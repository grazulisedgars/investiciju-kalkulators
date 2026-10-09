"""Source copied into the project's gallery router after verification."""
import io
import warnings
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Cookie, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from database import get_db
from models import GalleryPhoto, Property
from schemas import GalleryPhotoUpdate
from security import decode_access_token

router = APIRouter(prefix="/properties/{property_id}/gallery", tags=["Galerija"])
GALLERY_DIR = Path(__file__).resolve().parent / "uploads" / "gallery"
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_BATCH_SIZE = 50 * 1024 * 1024
MAX_FILES = 20
CATEGORY = Literal["initial", "renovation", "finished"]


def require_property(property_id: int, token: str | None, db: Session):
    # Katra galerijas darbība pārbauda lietotāju un īpašuma piederību.
    payload = decode_access_token(token) if token else None
    if not payload or not payload.get("sub"):
        raise HTTPException(401, "Nepieciešama derīga autentifikācija.")
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(401, "Tokens nav derīgs.")
    property = db.query(Property).filter(
        Property.property_id == property_id, Property.user_id == user_id
    ).first()
    if not property:
        raise HTTPException(404, "Īpašums nav atrasts.")
    return property


def require_photo(property_id: int, photo_id: int, db: Session):
    photo = db.query(GalleryPhoto).filter(
        GalleryPhoto.id == photo_id, GalleryPhoto.property_id == property_id
    ).first()
    if not photo:
        raise HTTPException(404, "Foto nav atrasts.")
    return photo


def photo_path(storage_name: str):
    # Datubāzē glabājam servera ģenerētu faila nosaukumu, nevis lietotāja ceļu.
    path = (GALLERY_DIR / storage_name).resolve()
    if path.parent != GALLERY_DIR.resolve():
        raise HTTPException(404, "Foto fails nav atrasts.")
    return path


def serialize_photo(photo):
    return {
        "id": photo.id, "property_id": photo.property_id,
        "photo_date": photo.photo_date, "category": photo.category,
        "description": photo.description, "filename": photo.filename,
        "image_url": f"/properties/{photo.property_id}/gallery/{photo.id}/image",
        "created_at": photo.created_at, "updated_at": photo.updated_at,
    }


@router.get("")
def list_gallery_photos(property_id: int, category: CATEGORY | None = None,
                        access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    require_property(property_id, access_token, db)
    query = db.query(GalleryPhoto).filter(GalleryPhoto.property_id == property_id)
    if category:
        query = query.filter(GalleryPhoto.category == category)
    photos = query.order_by(GalleryPhoto.photo_date, GalleryPhoto.created_at, GalleryPhoto.id).all()
    return [serialize_photo(photo) for photo in photos]


@router.post("", status_code=201)
def upload_gallery_photos(property_id: int, photos: list[UploadFile] = File(...),
                          photo_date: date = Form(...), category: CATEGORY = Form(...),
                          description: str | None = Form(default=None, max_length=1000),
                          access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    require_property(property_id, access_token, db)
    if not 1 <= len(photos) <= MAX_FILES:
        raise HTTPException(422, "Vienā reizē izvēlies no 1 līdz 20 foto.")
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    saved_paths, entries = [], []
    total_size = 0
    try:
        # Visa augšupielāde ir viena transakcija: kļūdas gadījumā iztīrām arī failus.
        for upload in photos:
            data = upload.file.read(MAX_FILE_SIZE + 1)
            total_size += len(data)
            if len(data) > MAX_FILE_SIZE or total_size > MAX_BATCH_SIZE:
                raise HTTPException(413, "Foto limits ir 10 MB; kopējais augšupielādes limits ir 50 MB.")
            # Pārbaudām attēla saturu, jo pārlūka MIME tips var atšķirties.
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    with Image.open(io.BytesIO(data)) as original:
                        if original.format not in {"JPEG", "MPO", "PNG", "WEBP"}:
                            raise HTTPException(415, "Atļauti JPG, PNG un WebP attēli.")
                        if original.width * original.height > 40_000_000:
                            raise HTTPException(413, "Attēla izšķirtspēja ir pārāk liela.")
                        original.verify()
                    with Image.open(io.BytesIO(data)) as original:
                        # MPO ir kameras JPEG paveids; saglabājam tā galveno kadru.
                        original.seek(0)
                        image = ImageOps.exif_transpose(original).convert("RGB")
                        image.thumbnail((2560, 2560))
                        storage_name = f"{uuid4().hex}.jpg"
                        path = photo_path(storage_name)
                        saved_paths.append(path)
                        image.save(path, format="JPEG", quality=90, optimize=True)
            except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
                raise HTTPException(415, "Fails nav derīgs vai atbalstīts attēls.")
            photo = GalleryPhoto(
                property_id=property_id, storage_name=storage_name,
                filename=Path(upload.filename or "Foto").name[:255],
                photo_date=photo_date, category=category,
                description=(description or "").strip() or None,
            )
            db.add(photo)
            entries.append(photo)
        db.flush()
        response = [serialize_photo(photo) for photo in entries]
        db.commit()
        return response
    except Exception:
        db.rollback()
        for path in saved_paths:
            path.unlink(missing_ok=True)
        raise


@router.get("/{photo_id}/image")
def get_gallery_image(property_id: int, photo_id: int,
                      access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    require_property(property_id, access_token, db)
    photo = require_photo(property_id, photo_id, db)
    path = photo_path(photo.storage_name)
    if not path.is_file():
        raise HTTPException(404, "Foto fails nav atrasts.")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})


@router.patch("/{photo_id}")
def update_gallery_photo(property_id: int, photo_id: int, data: GalleryPhotoUpdate,
                         access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    require_property(property_id, access_token, db)
    photo = require_photo(property_id, photo_id, db)
    changes = data.model_dump(exclude_unset=True)
    for key, value in changes.items():
        if key in {"photo_date", "category"} and value is None:
            raise HTTPException(422, "Datums un kategorija nedrīkst būt tukši.")
        setattr(photo, key, ((value or "").strip() or None) if key == "description" else value)
    photo.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(photo)
    return serialize_photo(photo)


@router.delete("/{photo_id}")
def delete_gallery_photo(property_id: int, photo_id: int,
                         access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    require_property(property_id, access_token, db)
    photo = require_photo(property_id, photo_id, db)
    path = photo_path(photo.storage_name)
    db.delete(photo)
    db.commit()
    path.unlink(missing_ok=True)
    return {"message": "Foto izdzēsts.", "id": photo_id}
