from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.reconciliation import ReconRun, Transaction
from app.models.client import Client
from app.services.reconciliation_engine import reconcile
import pandas as pd
import io
from datetime import datetime
import uuid

router = APIRouter()

def parse_file(file_bytes, filename):
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        df = pd.read_excel(io.BytesIO(file_bytes))
    
    df.columns = [c.lower().strip() for c in df.columns]
    records = []
    for _, row in df.iterrows():
        try:
            amount = float(row.get('amount', 0))
            date_val = pd.to_datetime(row.get('date')).date()
            records.append({
                'amount': amount,
                'date': date_val,
                'reference': str(row.get('reference', '')),
                'party_name': str(row.get('party_name', ''))
            })
        except:
            continue
    return records

@router.post("/")
async def run_reconciliation(
    client_id: str = Form(...),
    books_file: UploadFile = File(...),
    party_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id, Client.firm_id == current_user.firm_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    books_bytes = await books_file.read()
    party_bytes = await party_file.read()

    books = parse_file(books_bytes, books_file.filename)
    party = parse_file(party_bytes, party_file.filename)

    result = reconcile(books, party)

    run = ReconRun(
        client_id=client_id,
        status='done',
        matched_count=result['matched_count'],
        partial_count=0,
        missing_count=result['missing_in_party'] + result['missing_in_books'],
        created_by=current_user.id
    )
    db.add(run)
    db.flush()

    for r in result['results']:
        t = Transaction(
            recon_run_id=run.id,
            amount=r['amount'],
            date=r['date'],
            reference=r.get('reference', ''),
            party_name=r.get('party_name', ''),
            source='books' if r['status'] != 'missing_in_books' else 'party',
            status=r['status']
        )
        db.add(t)

    db.commit()

    return {
        'run_id': str(run.id),
        'matched_count': result['matched_count'],
        'missing_in_party': result['missing_in_party'],
        'missing_in_books': result['missing_in_books'],
        'results': [{
            'amount': r['amount'],
            'date': str(r['date']),
            'reference': r.get('reference', ''),
            'party_name': r.get('party_name', ''),
            'status': r['status']
        } for r in result['results']]
    }

@router.get("/{run_id}")
def get_recon_result(run_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    run = db.query(ReconRun).filter(ReconRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    transactions = db.query(Transaction).filter(Transaction.recon_run_id == run_id).all()
    return {
        'run_id': run_id,
        'status': run.status,
        'matched_count': run.matched_count,
        'missing_count': run.missing_count,
        'transactions': [{'amount': str(t.amount), 'date': str(t.date), 'status': t.status, 'reference': t.reference} for t in transactions]
    }
