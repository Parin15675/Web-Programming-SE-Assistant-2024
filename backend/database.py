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
curriculum_collection2 = database.curriculum_2
holiday_collection = database.holiday
fs = AsyncIOMotorGridFSBucket(database)  # Initialize GridFS for async file storage

fs_year1 = AsyncIOMotorGridFSBucket(database, bucket_name="fs_year1")
fs_year2 = AsyncIOMotorGridFSBucket(database, bucket_name="fs_year2")
fs_year3 = AsyncIOMotorGridFSBucket(database, bucket_name="fs_year3")
fs_year4 = AsyncIOMotorGridFSBucket(database, bucket_name="fs_year4")

# Helper function to get GridFS bucket by year
def get_bucket_by_year(year: int):
    fs_map = {
        1: fs_year1,
        2: fs_year2,
        3: fs_year3,
        4: fs_year4,
    }
    return fs_map.get(year, None)


# Helper function สำหรับแปลง ObjectId ให้เป็น string
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "gmail": user["gmail"],
        "year": user["year"],
        "career": user.get("career", None),
        "field": user.get("field", None),  # Include the field property
        "ratings": user.get("ratings", {}),
        "schedules": user.get("schedules", {})  # Include schedules field
    }


# Function to save user data and transform ObjectId
async def create_user(user: User):
    # Check if a user with the same Gmail already exists
    existing_user = await users_collection.find_one({"gmail": user.gmail})
    if existing_user:
        # Update the existing user with field, career, and year
        await users_collection.update_one(
            {"gmail": user.gmail},
            {"$set": {
                "career": user.career,
                "year": user.year,
                "field": user.field  # Update the field property
            }}
        )
        updated_user = await users_collection.find_one({"gmail": user.gmail})
        return user_helper(updated_user)  # Return the updated user if found

    # If the user doesn't exist, create a new user
    user_data = user.dict()
    user_data['schedules'] = {}  # Initialize schedules as an empty dictionary
    result = await users_collection.insert_one(user_data)
    new_user = await users_collection.find_one({"_id": result.inserted_id})
    return user_helper(new_user)  

# ฟังก์ชันสำหรับดึงข้อมูลวิชาเรียนตามปีการศึกษาและอีเมลผู้ใช้
async def fetch_curriculum_by_year(year: int, gmail: str):
    document = await curriculum_collection2.find_one({"year": year, "gmail": gmail})
    if document:
        document["_id"] = str(document["_id"])  # แปลง ObjectId เป็น string
        return document
    return None

# ฟังก์ชันสำหรับเพิ่มข้อมูลวิชาเรียนล่วงหน้า
async def initialize_curriculums(gmail):
    curriculums = [
        {
            "year": 1,
            "semester": 1,
            "gmail": gmail,  
            "subjects": [
                {
                    "name": "Math 101",
                    "description": "Basic mathematics covering algebra, calculus, and geometry.",
                    "topics": [
                        {"name": "Algebra", "rating": 0},
                        {"name": "Calculus", "rating": 0},
                        {"name": "Geometry", "rating": 0}
                    ]
                },
                {
                    "name": "Physics 101",
                    "description": "Introduction to physics with a focus on mechanics and motion.",
                    "topics": [
                        {"name": "Mechanics", "rating": 0},
                        {"name": "Thermodynamics", "rating": 0},
                        {"name": "Waves", "rating": 0}
                    ]
                }
            ]
        },
        {
            "year": 1,
            "semester": 2,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Programming 101",
                    "description": "Fundamental programming concepts using Python.",
                    "topics": [
                        {"name": "Python Basics", "rating": 0},
                        {"name": "Control Structures", "rating": 0},
                        {"name": "Data Structures", "rating": 0}
                    ]
                },
                {
                    "name": "Chemistry 101",
                    "description": "Introduction to basic chemistry concepts.",
                    "topics": [
                        {"name": "Atomic Structure", "rating": 0},
                        {"name": "Chemical Reactions", "rating": 0},
                        {"name": "Periodic Table", "rating": 0}
                    ]
                }
            ]
        },
        {
            "year": 2,
            "semester": 1,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Data Structures",
                    "description": "Study of linear and non-linear data structures such as stacks, queues, and trees.",
                    "topics": [
                        {"name": "Stacks", "rating": 0},
                        {"name": "Queues", "rating": 0},
                        {"name": "Trees", "rating": 0}
                    ]
                },
                {
                    "name": "Algorithms",
                    "description": "Design and analysis of algorithms for problem-solving, including sorting, searching, and graph algorithms.",
                    "topics": [
                        {"name": "Sorting", "rating": 0},
                        {"name": "Searching", "rating": 0},
                        {"name": "Graph Algorithms", "rating": 0}
                    ]
                }
            ]
        },
        {
            "year": 2,
            "semester": 2,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Database Systems",
                    "description": "Introduction to database design, SQL, and relational database management systems.",
                    "topics": [
                        {"name": "SQL Basics", "rating": 0},
                        {"name": "ER Diagrams", "rating": 0},
                        {"name": "Indexing", "rating": 0}
                    ]
                },
                {
                    "name": "Operating Systems",
                    "description": "Concepts and design of operating systems, including process management and memory management.",
                    "topics": [
                        {"name": "Process Management", "rating": 0},
                        {"name": "Memory Management", "rating": 0},
                        {"name": "File Systems", "rating": 0}
                    ]
                }
            ]
        }
    ]

    # Insert the curriculum data into the database
    for curriculum in curriculums:
        result = await curriculum_collection2.insert_one(curriculum)
        print(f"Inserted curriculum for year {curriculum['year']}, semester {curriculum['semester']} with ObjectId: {result.inserted_id}")




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

# Holiday data for 2024 and 2025
holiday_data = [
    {"date": "2024-01-01", "title": "New Year's Day"},
    {"date": "2024-02-24", "title": "Makha Bucha Day"},
    {"date": "2024-04-06", "title": "Chakri Memorial Day"},
    {"date": "2024-04-13", "title": "Songkran Festival"},
    {"date": "2024-05-01", "title": "Labor Day"},
    {"date": "2024-05-22", "title": "Visakha Bucha Day"},
    {"date": "2024-07-20", "title": "Asahna Bucha Day"},
    {"date": "2024-07-28", "title": "King Vajiralongkorn's Birthday"},
    {"date": "2024-08-12", "title": "The Queen Mother's Birthday"},
    {"date": "2024-10-13", "title": "King Bhumibol Memorial Day"},
    {"date": "2024-10-23", "title": "Chulalongkorn Day"},
    {"date": "2024-12-05", "title": "King Bhumibol's Birthday"},
    {"date": "2024-12-10", "title": "Constitution Day"},
    {"date": "2024-12-31", "title": "New Year's Eve"},
    {"date": "2025-01-01", "title": "New Year's Day"},
    {"date": "2025-02-11", "title": "Makha Bucha Day"},
    {"date": "2025-04-06", "title": "Chakri Memorial Day"},
    {"date": "2025-04-13", "title": "Songkran Festival"},
    {"date": "2025-05-01", "title": "Labor Day"},
    {"date": "2025-05-11", "title": "Visakha Bucha Day"},
    {"date": "2025-07-09", "title": "Asahna Bucha Day"},
    {"date": "2025-07-28", "title": "King Vajiralongkorn's Birthday"},
    {"date": "2025-08-12", "title": "The Queen Mother's Birthday"},
    {"date": "2025-10-13", "title": "King Bhumibol Memorial Day"},
    {"date": "2025-10-23", "title": "Chulalongkorn Day"},
    {"date": "2025-12-05", "title": "King Bhumibol's Birthday"},
    {"date": "2025-12-10", "title": "Constitution Day"},
    {"date": "2025-12-31", "title": "New Year's Eve"}
]

# Function to insert holiday data into the holiday collection
async def insert_holiday_data():
    # Check if the collection already has data
    existing_holidays = await database.holiday.count_documents({})
    if existing_holidays > 0:
        print("Holiday data already exists in the database.")
        return

    # Insert the holiday data
    result = await database.holiday.insert_many(holiday_data)
    print(f"Inserted {len(result.inserted_ids)} holiday documents into the collection.")




