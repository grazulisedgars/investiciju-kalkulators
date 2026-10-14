"""One-time email verification and private, local development mail outbox."""
import hashlib
import html
import os
import secrets
from datetime import datetime,timedelta,timezone
from pathlib import Path
from urllib.parse import urlencode
from fastapi import APIRouter,Cookie,Depends,HTTPException
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from database import get_db
from models import User
from account_profile import require_user
router=APIRouter(prefix="/account/email",tags=["E-pasta apstiprināšana"])
OUTBOX=Path(__file__).resolve().parent/"private_uploads"/"mail"

def utc(value):
    return value.replace(tzinfo=timezone.utc) if value and value.tzinfo is None else value

def send_verification(user,db):
    now=datetime.now(timezone.utc)
    if user.email_verified_at:return False
    if user.email_verification_sent_at and now-utc(user.email_verification_sent_at)<timedelta(seconds=60):
        raise HTTPException(429,"Saiti vari nosūtīt atkārtoti pēc 60 sekundēm.",headers={"Retry-After":"60"})
    token=secrets.token_urlsafe(32)
    user.email_verification_hash=hashlib.sha256(token.encode()).hexdigest()
    user.email_verification_expires_at=now+timedelta(hours=24)
    user.email_verification_sent_at=now
    base=os.getenv("FRONTEND_URL","http://localhost:5173").rstrip("/")
    link=base+"/?"+urlencode({"verify_email":token})
    # Local delivery only: no external email service has been configured yet.
    if os.getenv("MAIL_DELIVERY","local")!="local":
        db.rollback()
        raise HTTPException(503,"E-pasta piegādes pakalpojums vēl nav konfigurēts.")
    OUTBOX.mkdir(parents=True,exist_ok=True)
    path=OUTBOX/(now.strftime("%Y%m%d-%H%M%S")+"-"+secrets.token_hex(6)+".html")
    message='<!doctype html><html lang="lv"><meta charset="utf-8"><title>Apstiprini savu PROPFOLIO e-pastu</title><body style="font-family:Arial;max-width:600px;margin:40px auto;line-height:1.6"><h1>Apstiprini savu e-pastu</h1><p>Saņēmējs: '+html.escape(user.email)+'</p><p>Lai pabeigtu PROPFOLIO reģistrāciju, apstiprini savu e-pasta adresi.</p><p><a style="display:inline-block;padding:12px 20px;background:#126a4e;color:white;border-radius:6px" href="'+html.escape(link,quote=True)+'">Apstiprināt e-pastu</a></p><p>Saite derīga 24 stundas un izmantojama vienu reizi. Ja nereģistrējies PROPFOLIO, šo vēstuli vari ignorēt.</p></body></html>'
    try:
        path.write_text(message,encoding="utf-8")
        db.commit()
    except Exception:
        db.rollback();path.unlink(missing_ok=True)
        raise HTTPException(503,"Neizdevās sagatavot apstiprinājuma vēstuli. Mēģini vēlreiz.")
    return True

@router.post("/resend")
def resend(access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    user=require_user(access_token,db)
    # Serialize sends for the same account to enforce the cooldown.
    user=db.query(User).filter(User.id==user.id).with_for_update().populate_existing().one()
    sent=send_verification(user,db)
    return {"message":"Apstiprinājuma vēstule sagatavota lokālajā testa pastkastē." if sent else "E-pasts jau ir apstiprināts.","delivery":"local"}

class VerificationCode(BaseModel):
    token:str=Field(min_length=32,max_length=128)

@router.post("/verify")
def verify(data:VerificationCode,db:Session=Depends(get_db)):
    digest=hashlib.sha256(data.token.encode()).hexdigest()
    user=db.query(User).filter(User.email_verification_hash==digest).with_for_update().first()
    if not user or not user.email_verification_expires_at or utc(user.email_verification_expires_at)<=datetime.now(timezone.utc):
        raise HTTPException(400,"Saite nav derīga, ir jau izmantota vai tās derīguma termiņš ir beidzies. Pieprasi jaunu saiti savā kontā.")
    user.email_verified_at=datetime.now(timezone.utc)
    user.email_verification_hash=None
    user.email_verification_expires_at=None
    db.commit()
    return {"message":"E-pasts veiksmīgi apstiprināts."}
