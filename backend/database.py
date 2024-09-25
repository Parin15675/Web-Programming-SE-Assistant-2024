import motor.motor_asyncio
from bson import ObjectId
from model import User

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017/')
database = client.CurriculumDB
users_collection = database.users
curriculum_collection = database.curriculum

# Helper function สำหรับแปลง ObjectId ให้เป็น string
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),  # แปลง ObjectId ให้เป็น string
        "name": user["name"],
        "year": user["year"],
    }

# ฟังก์ชันสำหรับบันทึกข้อมูลผู้ใช้และแปลง ObjectId
async def create_user(user: User):
    user_data = user.dict()  # แปลงเป็น dictionary
    result = await users_collection.insert_one(user_data)  # บันทึกข้อมูลลง MongoDB
    new_user = await users_collection.find_one({"_id": result.inserted_id})  # ดึงข้อมูลผู้ใช้ที่บันทึกใหม่
    return user_helper(new_user)  # ส่งข้อมูลกลับไป


# ฟังก์ชันสำหรับดึงข้อมูลวิชาเรียนตามปีการศึกษา
async def fetch_curriculum_by_year(year: int):
    document = await curriculum_collection.find_one({"year": year})
    if document:
        document["_id"] = str(document["_id"])  # แปลง ObjectId ให้เป็น string
        return document
    return None

# ฟังก์ชันสำหรับเพิ่มข้อมูลวิชาเรียนล่วงหน้า
async def initialize_curriculums():
    curriculums = [
            {"year": 1, "subjects": [
                {"name": "Math 101", "description": "Basic mathematics covering algebra, calculus, and geometry."},
                {"name": "Physics 101", "description": "Introduction to physics with a focus on mechanics and motion."},
                {"name": "Programming 101", "description": "Fundamental programming concepts using Python."}
            ]},
            {"year": 2, "subjects": [
                {"name": "Data Structures", "description": "Study of linear and non-linear data structures such as stacks, queues, and trees."},
                {"name": "Algorithms", "description": "Design and analysis of algorithms for problem-solving, including sorting, searching, and graph algorithms."},
                {"name": "Database Systems", "description": "Introduction to database design, SQL, and relational database management systems."}
            ]},
            {"year": 3, "subjects": [
                {"name": "Operating Systems", "description": "Concepts and design of operating systems, including process management and memory management."},
                {"name": "Networking", "description": "Principles of computer networking, including OSI model, TCP/IP, and network protocols."},
                {"name": "Software Engineering", "description": "Software development methodologies, project management, and quality assurance techniques."}
            ]},
            {"year": 4, "subjects": [
                {"name": "Machine Learning", "description": "Introduction to machine learning algorithms and their applications."},
                {"name": "AI", "description": "Foundations of artificial intelligence, including knowledge representation and reasoning."},
                {"name": "Cloud Computing", "description": "Study of cloud architecture, services, and deployment models."}
            ]}
    ]
    for curriculum in curriculums:
        await curriculum_collection.insert_one(curriculum)

# ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จากชื่อ
async def get_user_by_name(name: str):
    document = await users_collection.find_one({"name": name})
    if document:
        return user_helper(document)
    return None
