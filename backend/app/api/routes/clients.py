from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.client import Client
from app.api.deps import get_current_user

router = APIRouter()

class ClientCreate(BaseModel):
    name: str
    gstin: str = ""
    pan: str = ""

class ClientOut(BaseModel):
    id: str
    name: str
    gstin: str = ""
    pan: str = ""

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClientOut])
def list_clients(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    clients = db.query(Client).filter(Client.firm_id == current_user.firm_id).all()
    return [ClientOut(id=str(c.id), name=c.name, gstin=c.gstin or "", pan=c.pan or "") for c in clients]

@router.post("/", response_model=ClientOut)
def create_client(req: ClientCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    client = Client(firm_id=current_user.firm_id, name=req.name, gstin=req.gstin, pan=req.pan)
    db.add(client)
    db.commit()
    db.refresh(client)
    return ClientOut(id=str(client.id), name=client.name, gstin=client.gstin or "", pan=client.pan or "")

@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.firm_id == current_user.firm_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"message": "Deleted"}
