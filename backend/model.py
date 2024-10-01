from pydantic import BaseModel, EmailStr

class User(BaseModel):
    name: str
    gmail: EmailStr
    year: int
    career: str  # เพิ่มฟิลด์ career สำหรับเก็บสายอาชีพที่สนใจ
