import motor.motor_asyncio
import gridfs  # GridFS is still used for the file handling
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson.objectid import ObjectId
from model import User

# Initialize MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://parin561a:codecamp@cluster0.mcyeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
database = client.CurriculumDB
users_collection = database.users
curriculum_collection = database.curriculum
fs = AsyncIOMotorGridFSBucket(database)  # Initialize GridFS for async file storage

# Helper function to transform user data from MongoDB
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "year": user["year"],
    }

# Function for creating a new user
async def create_user(name: str, year: int):
    user = await users_collection.find_one({"name": name})
    if user:
        return user_helper(user)  # Return existing user if found
    new_user = User(name=name, year=year)
    result = await users_collection.insert_one(new_user.dict())
    return user_helper(await users_collection.find_one({"_id": result.inserted_id}))

# Function to retrieve an existing user by name
async def get_user_by_name(name: str):
    user = await users_collection.find_one({"name": name})
    if user:
        return user_helper(user)
    return None

# Function for fetching curriculum based on the user's year
async def fetch_curriculum_by_year(year: int):
    document = await curriculum_collection.find_one({"year": year})
    return document

# Initialize default curriculum data
async def initialize_curriculums():
    curriculums = [
        {"year": 1, "subjects": [
            {"name": "Math 101", "description": "Basic mathematics covering algebra, calculus, and geometry."},
            {"name": "Physics 101", "description": "Introduction to physics with a focus on mechanics and motion."},
            {"name": "Programming 101", "description": "Fundamental programming concepts using Python."}
        ]},
        {"year": 2, "subjects": [
            {"name": "Data Structures", "description": "Study of linear and non-linear data structures such as stacks, queues, and linked lists."},
            {"name": "Algorithms", "description": "Design and analysis of algorithms for problem-solving, including sorting and searching algorithms."},
            {"name": "Database Systems", "description": "Introduction to database design, SQL, and relational database management."}
        ]},
        {"year": 3, "subjects": [
            {"name": "Operating Systems", "description": "Introduction to operating system concepts, including processes, threads, memory management, and file systems."},
            {"name": "Networking", "description": "Basic networking concepts such as TCP/IP, DNS, and routing."},
            {"name": "Software Engineering", "description": "Study of software development methodologies, including agile, and software project management."}
        ]},
        {"year": 4, "subjects": [
            {"name": "Machine Learning", "description": "Introduction to machine learning concepts, supervised and unsupervised learning, and neural networks."},
            {"name": "AI", "description": "Study of artificial intelligence, problem-solving, knowledge representation, and reasoning."},
            {"name": "Cloud Computing", "description": "Study of cloud computing models, services, and deployment, including AWS and Azure."}
        ]}
    ]
    # Insert curriculums if not already present
    for curriculum in curriculums:
        existing = await curriculum_collection.find_one({"year": curriculum["year"]})
        if not existing:
            await curriculum_collection.insert_one(curriculum)

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



