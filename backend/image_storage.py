"""Private image storage with a protected fallback for existing uploads."""
import io
import logging
import warnings
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent
PROPERTY_DIR = ROOT / "private_uploads" / "properties"
GALLERY_DIR = ROOT / "private_uploads" / "gallery"
LEGACY_PROPERTY_DIR = ROOT / "uploads" / "properties"
LEGACY_GALLERY_DIR = ROOT / "uploads" / "gallery"


def stored_path(name, directory, legacy=None):
    if not name or name in {".", ".."} or any(c in name for c in "/\\:\x00?*<>|\""):
        raise HTTPException(404, "Attēls nav atrasts.")
    path = (directory / name).resolve()
    if path.parent != directory.resolve():
        raise HTTPException(404, "Attēls nav atrasts.")
    if not path.exists() and legacy is not None:
        old = (legacy / name).resolve()
        if old.parent == legacy.resolve() and old.is_file():
            return old
    return path


def property_path(url, property_id):
    prefix = "/uploads/properties/"
    if not url or not url.startswith(prefix):
        return None
    name = url[len(prefix):]
    if not name.startswith(f"property_{property_id}_"):
        return None
    try:
        return stored_path(name, PROPERTY_DIR, LEGACY_PROPERTY_DIR)
    except HTTPException:
        return None


def remove_image(path):
    if path is not None:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            # A committed DB change must not appear to fail because of cleanup.
            logging.getLogger(__name__).exception("Unable to remove obsolete image")


def save_property_image(upload, property_id):
    content = upload.file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Foto nedrīkst pārsniegt 10 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(content)) as original:
                if original.format not in {"JPEG", "MPO", "PNG", "WEBP"}:
                    raise ValueError("format")
                if original.width * original.height > 40_000_000:
                    raise HTTPException(413, "Attēla izšķirtspēja ir pārāk liela.")
                original.verify()
            with Image.open(io.BytesIO(content)) as original:
                image = ImageOps.exif_transpose(original).convert("RGB")
                image.thumbnail((2560, 2560))
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(415, "Izvēlies derīgu JPG, PNG vai WebP attēlu.")

    name = f"property_{property_id}_{uuid4().hex}.jpg"
    path = stored_path(name, PROPERTY_DIR)
    try:
        PROPERTY_DIR.mkdir(parents=True, exist_ok=True)
        image.save(path, "JPEG", quality=90, optimize=True)
    except OSError:
        remove_image(path)
        raise HTTPException(500, "Neizdevās saglabāt attēlu. Iepriekšējais foto saglabāts.")
    return path, "/uploads/properties/" + name
