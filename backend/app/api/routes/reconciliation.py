from fastapi import APIRouter, UploadFile, File
from app.services.reconciliation_engine import reconcile
import pandas as pd
import io

router = APIRouter(prefix="/reconciliation")

def parse(file_bytes):
    df = pd.read_excel(io.BytesIO(file_bytes))
    return df.to_dict(orient="records")

@router.post("/")
async def run(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    t1 = parse(await file1.read())
    t2 = parse(await file2.read())
    results = reconcile(t1, t2)
    return {"results": results}
