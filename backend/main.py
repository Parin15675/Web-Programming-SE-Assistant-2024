from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import User
from database import create_user, fetch_curriculum_by_year, initialize_curriculums, get_user_by_name, user_helper, users_collection



app = FastAPI()

# เพิ่มการตั้งค่า CORS Middleware เพื่ออนุญาตการเชื่อมต่อจาก Frontend ที่ localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # เปลี่ยนเป็น IP Address ที่คุณใช้งานถ้าใช้ IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ฟังก์ชันที่ถูกเรียกใช้เมื่อเซิร์ฟเวอร์เริ่มทำงาน เพื่อเพิ่มข้อมูลวิชาเรียนล่วงหน้าใน MongoDB
@app.on_event("startup")
async def startup_event():
    await initialize_curriculums()

# API สำหรับบันทึกข้อมูลผู้ใช้และดึงข้อมูลวิชาเรียนตามปีการศึกษา
@app.post("/api/user/")
async def create_user_and_get_curriculum(user: User):
    user_data = await create_user(user)  # บันทึกข้อมูลผู้ใช้ลงใน MongoDB
    curriculum = await fetch_curriculum_by_year(user.year)  # ดึงข้อมูลวิชาตามปีที่ผู้ใช้เลือก
    if curriculum:
        return {"user": user_data, "curriculum": curriculum}
    raise HTTPException(404, f"No curriculum found for year {user.year}")


# API สำหรับดึงข้อมูลวิชาเรียนตามปีการศึกษา
@app.get("/api/curriculum/{year}")
async def get_curriculum_by_year(year: int):
    curriculum = await fetch_curriculum_by_year(year)
    if curriculum:
        return curriculum
    raise HTTPException(404, f"No curriculum found for year {year}")

@app.get("/api/user/{name}")
async def get_user_by_name(name: str):
    user = await users_collection.find_one({"name": name})  # ดึงข้อมูลผู้ใช้จาก MongoDB
    if user:
        curriculum = await fetch_curriculum_by_year(user['year'])  # ดึงข้อมูลวิชาตามปีการศึกษาของผู้ใช้
        return {"user": user_helper(user), "curriculum": curriculum}  # ใช้ user_helper เพื่อแปลง ObjectId
    raise HTTPException(404, f"User {name} not found")

