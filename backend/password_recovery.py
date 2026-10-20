"""One-time password recovery using the existing local development outbox."""
import html
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import jwt
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth_limits import limit_auth
from database import get_db
from email_verification import OUTBOX
from models import User
from schemas import UserRegister
from security import JWT_ALGORITHM, JWT_SECRET_KEY, hash_password

router = APIRouter(prefix="/account/password", tags=["Paroles atjaunošana"])


class RecoveryRequest(BaseModel):
    email: EmailStr


class RecoveryReset(BaseModel):
    token: str = Field(min_length=32, max_length=2048)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


def recovery_token(user):
    return jwt.encode({"sub": str(user.id), "ver": user.session_version,
                       "purpose": "password-reset", "jti": secrets.token_hex(16),
                       "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
                      JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


@router.post("/request", dependencies=[Depends(limit_auth)])
def request_recovery(data: RecoveryRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == str(data.email).lower()).first()
    if os.getenv("MAIL_DELIVERY", "local") != "local":
        raise HTTPException(503, "E-pasta piegādes pakalpojums vēl nav konfigurēts.")
    if user:
        link = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/") + "/?" + urlencode({"reset_password": recovery_token(user)})
        OUTBOX.mkdir(parents=True, exist_ok=True)
        path = OUTBOX / ("reset-" + secrets.token_hex(16) + ".html")
        content = '<!doctype html><html lang="lv"><meta charset="utf-8"><title>Atjauno PROPFOLIO paroli</title><body><h1>Paroles atjaunošana</h1><p>Saņēmējs: ' + html.escape(user.email) + '</p><p><a href="' + html.escape(link, quote=True) + '">Izveidot jaunu paroli</a></p><p>Saite derīga 30 minūtes un izmantojama vienu reizi. Ja nepieprasīji paroles atjaunošanu, šo vēstuli vari ignorēt.</p></body></html>'
        try:
            path.write_text(content, encoding="utf-8")
        except OSError:
            path.unlink(missing_ok=True)
            raise HTTPException(503, "Neizdevās sagatavot vēstuli. Mēģini vēlreiz.")
    return {"message": "Ja konts ar šo e-pastu pastāv, paroles atjaunošanas saite ir sagatavota.", "delivery": "local"}


@router.post("/reset", dependencies=[Depends(limit_auth)])
def reset_password(data: RecoveryReset, response: Response, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"require": ["exp", "sub", "ver", "purpose"]})
        if payload["purpose"] != "password-reset":
            raise ValueError()
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(400, "Saite nav derīga vai tās derīguma termiņš ir beidzies. Pieprasi jaunu saiti.")
    user = db.query(User).filter(User.id == user_id).with_for_update().populate_existing().first()
    if not user or payload["ver"] != user.session_version:
        raise HTTPException(400, "Saite nav derīga vai jau izmantota. Pieprasi jaunu saiti.")
    try:
        UserRegister.validate_password(data.password)
    except ValueError as error:
        raise HTTPException(422, str(error))
    if data.password != data.confirm_password:
        raise HTTPException(422, "Jaunās paroles nesakrīt.")
    user.password_hash = hash_password(data.password)
    user.session_version += 1
    db.commit()
    response.delete_cookie("access_token", path="/")
    return {"message": "Parole atjaunota. Iepriekšējās sesijas ir izbeigtas. Ieej ar jauno paroli."}
