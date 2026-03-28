from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import reconciliation

app = FastAPI(title="TaxMind Recon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reconciliation.router)

@app.get("/")
def health():
    return {"status": "ok"}
