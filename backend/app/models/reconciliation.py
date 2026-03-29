from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class ReconRun(Base):
    __tablename__ = "recon_runs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    status = Column(String(20), default="pending")
    matched_count = Column(Integer, default=0)
    partial_count = Column(Integer, default=0)
    missing_count = Column(Integer, default=0)
    file1_s3_key = Column(String)
    file2_s3_key = Column(String)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recon_run_id = Column(UUID(as_uuid=True), ForeignKey("recon_runs.id", ondelete="CASCADE"))
    amount = Column(Numeric(15, 2), nullable=False)
    date = Column(Date, nullable=False)
    reference = Column(String(200))
    party_name = Column(String(200))
    source = Column(String(10), nullable=False)
    status = Column(String(30))
    matched_with = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
