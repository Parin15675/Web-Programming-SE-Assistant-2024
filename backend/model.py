from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional

class Schedule(BaseModel):
    start_minute: int
    end_minute: int
    title: str
    details: str
    color: str
    youtube_video_id: Optional[str] = None

class User(BaseModel):
    name: str
    gmail: EmailStr
    year: int
    career: str
    field: Optional[str] = None
    schedules: Optional[Dict[str, Dict[int, Schedule]]] = None

class TargetGPARequest(BaseModel):
    gmail: str
    target_gpa: float

class SimplifiedUser(BaseModel): 
    name: Optional[str] = None
    gmail: Optional[EmailStr] = None
    year: Optional[int] = None
    career: Optional[str] = None
    field: Optional[str] = None

class RatingRequest(BaseModel):
    gmail: EmailStr
    subject: str
    topic: str
    rating: int

class ScheduleRequest(BaseModel):
    gmail: EmailStr
    schedules: Dict[str, Dict[int, Schedule]]  # Dict[date, Dict[minute, Schedule details]]
