from pydantic import BaseModel

class User(BaseModel):
    name: str
    year: int
