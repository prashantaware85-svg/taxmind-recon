from fastapi import FastAPI
from app.api.routes import reconciliation

app = FastAPI(title="TaxMind Recon API")
app.include_router(reconciliation.router)

@app.get("/")
def health():
    return {"status": "ok"}
