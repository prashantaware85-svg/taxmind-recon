from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.firm import Firm
from app.services.auth_service import hash_password, verify_password, create_access_token, create_refresh_token
from pydantic import BaseModel

router = APIRouter()

class RegisterRequest(BaseModel):
    firm_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    firm = Firm(name=req.firm_name)
    db.add(firm)
    db.flush()
    user = User(firm_id=firm.id, email=req.email, hashed_password=hash_password(req.password), role="ca_admin")
    db.add(user)
    db.commit()
    return {"message": "Registered successfully"}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": create_access_token(user),
        "refresh_token": create_refresh_token(user),
        "token_type": "bearer"
    }
