import motor.motor_asyncio
import gridfs  # GridFS is still used for the file handling
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson.objectid import ObjectId
from model import User
from fastapi import FastAPI, UploadFile, File, HTTPException, Query


# Initialize MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://parin561a:codecamp@cluster0.mcyeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
database = client.CurriculumDB
users_collection = database.users
curriculum_collection = database.curriculum
fs = AsyncIOMotorGridFSBucket(database)  # Initialize GridFS for async file storage

holiday_collection = database.holiday

# Helper function สำหรับแปลง ObjectId ให้เป็น string
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "gmail": user["gmail"],
        "year": user["year"],
        "career": user.get("career", None),
        "ratings": user.get("ratings", {}),
        "schedules": user.get("schedules", {})  # Include schedules field
    }


# ฟังก์ชันสำหรับบันทึกข้อมูลผู้ใช้และแปลง ObjectId
async def create_user(user: User):
    # Check if a user with the same Gmail already exists
    existing_user = await users_collection.find_one({"gmail": user.gmail})
    if existing_user:
        return user_helper(existing_user)  # Return the existing user if found

    # If the user doesn't exist, create a new user
    user_data = user.dict()
    user_data['schedules'] = {}  # Initialize schedules as an empty dictionary
    result = await users_collection.insert_one(user_data)
    new_user = await users_collection.find_one({"_id": result.inserted_id})
    return user_helper(new_user)



# ฟังก์ชันสำหรับดึงข้อมูลวิชาเรียนตามปีการศึกษา
async def fetch_curriculum_by_year(year: int):
    document = await curriculum_collection.find_one({"year": year})
    if document:
        document["_id"] = str(document["_id"])  # แปลง ObjectId เป็น string
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

async def get_user_by_gmail(gmail: str):
    document = await users_collection.find_one({"gmail": gmail})
    if document:
        return user_helper(document)
    return None

# Function to upload a PDF to GridFS
async def upload_pdf(file_data, filename):
    pdf_id = await fs.upload_from_stream(filename, file_data, metadata={"filename": filename, "contentType": "application/pdf"})
    return str(pdf_id)


# Function to retrieve a PDF from GridFS by ID
async def get_pdf(pdf_id):
    file_data = await fs.open_download_stream(ObjectId(pdf_id))
    return await file_data.read()



async def fetch_books():
    files_cursor = fs.find()  # This returns an async cursor
    files = await files_cursor.to_list(length=100)  # Fetch up to 100 files
    
    return [
        {
            "filename": file.get("filename", "Unnamed file"),  # Directly access the 'filename'
            "id": str(file["_id"]),
            "uploadDate": file.get("uploadDate")  # Access upload date if necessary
        }
        for file in files
    ]

# Function to save user schedules to MongoDB
async def save_user_schedules(gmail: str, schedules: dict):
    user = await users_collection.find_one({"gmail": gmail})
    if not user:
        raise Exception("User not found")

    # Convert events to the appropriate format for MongoDB storage
    formatted_schedules = {
        date: {
            str(minute): {
                "title": event["title"],
                "details": event["details"],
                "color": event["color"],
                "startMinute": event["startMinute"],
                "endMinute": event["endMinute"],
                "youtubeVideoId": event.get("youtubeVideoId"),
                "videoFile": event.get("videoFile"),  # Handle file ID for videos
            }
            for minute, event in events.items()
        }
        for date, events in schedules.items()
    }

    await users_collection.update_one(
        {"gmail": gmail},
        {"$set": {"schedules": formatted_schedules}}
    )



# Function to fetch user schedules from MongoDB
async def get_user_schedules(gmail: str):
    user = await users_collection.find_one({"gmail": gmail})
    if user:
        return user.get("schedules", {})
    else:
        raise HTTPException(status_code=404, detail="User not found")


