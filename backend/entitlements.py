"""Shared server-side plan policy. Plan changes do not delete account data."""
import os
import re
from pathlib import Path
from dotenv import dotenv_values
from fastapi import Cookie,Depends,HTTPException,Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from security import decode_access_token

def is_pro(user):return user.plan=="pro"
def can_test_plans(user):
    # Read missing local settings explicitly: the running dev server may have
    # started before these values were added. Process settings take precedence.
    local=dotenv_values(Path(__file__).resolve().with_name(".env"))
    def setting(key):return os.getenv(key) or local.get(key,"")
    allowed={value.strip() for value in setting("TEST_PLAN_USER_IDS").split(",")}
    return (setting("APP_ENV")=="development" and setting("ENABLE_TEST_PLANS").lower()=="true" and str(user.id) in allowed)
def plan_info(user):
    pro=is_pro(user)
    return {"plan":"pro" if pro else "basic","property_limit":None if pro else 3,
            "features":{"diary":pro,"advanced_analysis":pro,"gallery":pro},
            "test_plan_switch_enabled":can_test_plans(user)}
def session_user(token,db):
    payload=decode_access_token(token) if token else None
    try:user_id=int(payload["sub"]) if payload else None
    except (KeyError,ValueError,TypeError):user_id=None
    user=db.get(User,user_id) if user_id else None
    if not user:raise HTTPException(401,"Lūdzu, pieslēdzies savam kontam.")
    return user

def enforce_feature_access(request:Request,access_token:str|None=Cookie(default=None),db:Session=Depends(get_db)):
    if not re.match(r"^/properties/[^/]+/(diary|gallery|advanced-analysis)(/|$)",request.url.path):return
    user=session_user(access_token,db)
    if not is_pro(user):
        raise HTTPException(403,detail={"code":"PRO_REQUIRED","message":"Šī iespēja pieejama tikai ar PRO plānu."})
