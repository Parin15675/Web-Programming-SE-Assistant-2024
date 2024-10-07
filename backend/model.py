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
    schedules: Optional[Dict[str, Dict[int, Schedule]]] = None  # Store schedules per day as minute keys