from pydantic import BaseModel
from typing import List, Optional

class FHIRIdentifier(BaseModel):
    system: str
    value: str

class FHIRName(BaseModel):
    use: str
    text: str
    family: Optional[str] = None
    given: Optional[List[str]] = None

class FHIRExtension(BaseModel):
    url: str
    valueInteger: Optional[int] = None
    valueString: Optional[str] = None
    valueBoolean: Optional[bool] = None

class FHIRPatientProfile(BaseModel):
    resourceType: str = "Patient"
    id: str
    identifier: Optional[List[FHIRIdentifier]] = None
    name: List[FHIRName]
    gender: Optional[str] = None
    birthDate: Optional[str] = None
    extension: Optional[List[FHIRExtension]] = None

class FHIRCoding(BaseModel):
    system: str
    code: str
    display: str

class FHIRCodeableConcept(BaseModel):
    coding: List[FHIRCoding]

class FHIRQuantity(BaseModel):
    value: float
    unit: str

class FHIRReference(BaseModel):
    reference: str

class FHIRObservationComponent(BaseModel):
    code: FHIRCodeableConcept
    valueQuantity: FHIRQuantity

class FHIRObservation(BaseModel):
    resourceType: str = "Observation"
    id: str
    status: str
    code: FHIRCodeableConcept
    subject: FHIRReference
    valueQuantity: FHIRQuantity
    component: Optional[List[FHIRObservationComponent]] = None

class FHIRMedicationStatement(BaseModel):
    resourceType: str = "MedicationStatement"
    id: str
    status: str
    medicationCodeableConcept: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: str
    extension: Optional[List[FHIRExtension]] = None
