from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, clients, reconciliation, reports, billing

app = FastAPI(title="TaxMind Recon API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(clients.router, prefix="/clients", tags=["clients"])
app.include_router(reconciliation.router, prefix="/reconciliation", tags=["reconciliation"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])

@app.get("/")
def root():
    return {"message": "TaxMind Recon API", "status": "running"}
