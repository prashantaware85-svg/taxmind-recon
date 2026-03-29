from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    gstin = Column(String(15))
    pan = Column(String(10))
    tally_company_name = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
