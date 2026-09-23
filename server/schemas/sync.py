from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime

class CRDTSyncRequest(BaseModel):
    client_id: str
    client_timestamp: datetime
    vector_clock: Dict[str, int]
    compressed_payload: str
    mutations_count: int = Field(ge=0)

class CRDTSyncResponse(BaseModel):
    server_timestamp: datetime
    sync_status: str
    server_vector_clock: Dict[str, int]
    applied_mutations: List[str]
    downstream_mutations: Optional[List[Dict[str, Any]]] = None

