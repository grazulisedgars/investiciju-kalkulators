"""Current user's profile; email is intentionally immutable."""
import io
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter,Cookie,Depends,File,HTTPException,UploadFile,Response
from fastapi.responses import FileResponse
from pydantic import BaseModel,ConfigDict,Field,StrictBool
from sqlalchemy import func,select,delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from PIL import Image,ImageOps,UnidentifiedImageError
from database import get_db
from models import User,Property,DiaryEntry,ExpenseEntry,LoanEntry,UtilityEntry,WorkEntry,RentEntry,AdvancedAnalysis,GalleryPhoto
from security import decode_access_token,hash_password,verify_password
router=APIRouter(prefix="/account/profile",tags=["Mans profils"])
PHOTO_DIR=Path(__file__).resolve().parent/"private_uploads"/"profile"
MAX_SIZE=4*1024*1024
class ProfileUpdate(BaseModel):
    model_config=ConfigDict(extra="forbid",str_strip_whitespace=True)
    first_name:str=Field(min_length=1,max_length=100)
    last_name:str=Field(min_length=1,max_length=100)
    username:str=Field(min_length=3,max_length=50,pattern=r"^[\w.-]+$")
def require_user(token,db):
    payload=decode_access_token(token) if token else None
    try: user_id=int(payload["sub"]) if payload else None
    except (KeyError,TypeError,ValueError): user_id=None
    user=db.get(User,user_id) if user_id else None
    if not user: raise HTTPException(401,"Lūdzu, pieslēdzies savam kontam.")
    return user
def serialize(user,db):
    count=db.query(func.count(Property.property_id)).filter(Property.user_id==user.id).scalar()
    return dict(id=user.id,first_name=user.first_name,last_name=user.last_name,username=user.username,email=user.email,
                created_at=user.created_at,avatar_url=f"/account/profile/photo?v={user.avatar_filename}" if user.avatar_filename else None,
                email_verified=bool(user.email_verified_at),status="active" if user.email_verified_at else "email_unverified",plan="free",property_count=count,property_limit=3)
@router.get("")
def get_profile(access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    return serialize(require_user(access_token,db),db)
@router.patch("")
def update_profile(data:ProfileUpdate,access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    if db.query(User).filter(func.lower(User.username)==data.username.lower(),User.id!=user.id).first():
        raise HTTPException(409,"Šis lietotājvārds jau tiek izmantots.")
    user.first_name=data.first_name;user.last_name=data.last_name;user.username=data.username
    try: db.commit()
    except IntegrityError:
        db.rollback();raise HTTPException(409,"Šis lietotājvārds jau tiek izmantots.")
    db.refresh(user);return serialize(user,db)
@router.get("/photo")
def get_photo(access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    if not user.avatar_filename:raise HTTPException(404,"Profila foto nav pievienots.")
    path=PHOTO_DIR/user.avatar_filename
    if not path.is_file():raise HTTPException(404,"Profila foto nav atrasts.")
    return FileResponse(path,media_type="image/png",headers={"Cache-Control":"private, no-store"})
@router.post("/photo")
async def upload_photo(file:UploadFile=File(...),access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    content=await file.read(MAX_SIZE+1)
    if len(content)>MAX_SIZE:raise HTTPException(413,"Foto nedrīkst pārsniegt 4 MB.")
    try:
        with Image.open(io.BytesIO(content)) as source:
            if source.format not in ("JPEG","MPO","PNG","WEBP"):
                raise ValueError()
            if source.width*source.height>80000000:
                raise HTTPException(422,"Attēla izšķirtspēja nedrīkst pārsniegt 80 megapikseļus.")
            # Decode high-resolution JPEGs at reduced size before creating the avatar.
            if source.format in ("JPEG","MPO"):
                source.draft("RGB",(1024,1024))
            image=ImageOps.fit(ImageOps.exif_transpose(source).convert("RGB"),(512,512))
    except (UnidentifiedImageError,OSError,ValueError,Image.DecompressionBombError):
        raise HTTPException(422,"Izvēlies derīgu JPG, PNG vai WebP attēlu.")
    PHOTO_DIR.mkdir(parents=True,exist_ok=True)
    name=uuid4().hex+".png";path=PHOTO_DIR/name;old=user.avatar_filename
    image.save(path,format="PNG");user.avatar_filename=name
    try:db.commit()
    except Exception:
        db.rollback();path.unlink(missing_ok=True);raise
    if old:(PHOTO_DIR/old).unlink(missing_ok=True)
    db.refresh(user);return serialize(user,db)

@router.delete("/photo")
def delete_photo(access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    old=user.avatar_filename
    user.avatar_filename=None
    try:db.commit()
    except Exception:
        db.rollback();raise
    if old:(PHOTO_DIR/old).unlink(missing_ok=True)
    db.refresh(user);return serialize(user,db)

class PasswordUpdate(BaseModel):
    model_config=ConfigDict(extra="forbid")
    current_password:str=Field(min_length=1,max_length=1024)
    new_password:str=Field(min_length=8,max_length=128)
    confirm_password:str=Field(min_length=1,max_length=128)

@router.post("/password")
def change_password(data:PasswordUpdate,access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    if not verify_password(data.current_password,user.password_hash):
        raise HTTPException(400,"Pašreizējā parole nav pareiza.")
    password=data.new_password
    if not (any(c.isupper() for c in password) and any(c.islower() for c in password)
            and any(c.isdecimal() for c in password) and any(not c.isalnum() and not c.isspace() for c in password)):
        raise HTTPException(422,"Jaunajai parolei jāatbilst visām paroles prasībām.")
    if password!=data.confirm_password:
        raise HTTPException(422,"Jaunās paroles nesakrīt.")
    if password==data.current_password:
        raise HTTPException(422,"Jaunajai parolei jāatšķiras no pašreizējās paroles.")
    user.password_hash=hash_password(password)
    try:db.commit()
    except Exception:
        db.rollback();raise
    return {"message":"Parole veiksmīgi nomainīta."}

class AccountDeletion(BaseModel):
    model_config=ConfigDict(extra="forbid")
    password:str=Field(min_length=1,max_length=1024)
    confirmed:StrictBool

@router.delete("")
def delete_account(data:AccountDeletion,response:Response,access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    import html
    import logging
    user=require_user(access_token,db)
    user=db.query(User).filter(User.id==user.id).with_for_update().populate_existing().one()
    if not data.confirmed:raise HTTPException(422,"Apstiprini, ka saproti konta dzēšanas sekas.")
    if not verify_password(data.password,user.password_hash):raise HTTPException(400,"Pašreizējā parole nav pareiza.")
    root=Path(__file__).resolve().parent
    properties=db.query(Property).filter(Property.user_id==user.id).with_for_update().all()
    property_ids=[row.property_id for row in properties]
    candidates=[]
    def owned_file(folder,name):
        path=(folder/name).resolve()
        if not path.is_relative_to(folder.resolve()):raise HTTPException(500,"Neizdevās sagatavot konta failu dzēšanu.")
        if path.is_file():candidates.append(path)
    if user.avatar_filename:owned_file(PHOTO_DIR,user.avatar_filename)
    for row in properties:
        if row.image_url and row.image_url.startswith("/uploads/properties/"):
            owned_file(root/"uploads"/"properties",row.image_url.removeprefix("/uploads/properties/"))
    for row in db.query(GalleryPhoto).filter(GalleryPhoto.property_id.in_(property_ids)).all():
        owned_file(root/"uploads"/"gallery",row.storage_name)
    # Local confirmation messages also contain account data and a one-time token.
    mail_dir=root/"private_uploads"/"mail"
    for path in mail_dir.glob("*.html"):
        if '<p>Saņēmējs: '+html.escape(user.email)+'</p>' in path.read_text(encoding="utf-8"):
            owned_file(mail_dir,path.name)
    staged=[]
    try:
        for path in set(candidates):
            staged_path=path.with_name(".deleting-"+uuid4().hex)
            path.rename(staged_path);staged.append((path,staged_path))
        diary_ids=select(DiaryEntry.id).where(DiaryEntry.property_id.in_(property_ids))
        for model in (ExpenseEntry,LoanEntry,UtilityEntry,WorkEntry,RentEntry):
            db.execute(delete(model).where(model.diary_entry_id.in_(diary_ids)),execution_options={"synchronize_session":False})
        for model in (GalleryPhoto,AdvancedAnalysis,DiaryEntry):
            db.execute(delete(model).where(model.property_id.in_(property_ids)),execution_options={"synchronize_session":False})
        db.execute(delete(Property).where(Property.user_id==user.id),execution_options={"synchronize_session":False})
        db.execute(delete(User).where(User.id==user.id),execution_options={"synchronize_session":False})
        db.commit()
    except Exception:
        db.rollback()
        for original,temporary in reversed(staged):temporary.rename(original)
        raise HTTPException(500,"Kontu neizdevās izdzēst. Mēģini vēlreiz.")
    for original,temporary in staged:
        try:temporary.unlink(missing_ok=True)
        except OSError:logging.getLogger(__name__).exception("Unable to remove staged account file")
    response.delete_cookie("access_token",path="/")
    return {"message":"Profils un ar to saistītie dati ir izdzēsti."}
