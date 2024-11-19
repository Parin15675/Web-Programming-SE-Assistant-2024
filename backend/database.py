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
target_gpaDB = database.target_gpa
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

async def fetch_curriculum_by_year(year: int, gmail: str):
    user = await users_collection.find_one({"gmail": gmail})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if year == 3:
        field = user.get("field")
        if not field:
            raise HTTPException(status_code=400, detail="Field of interest is required for Year 3 users")
        
        # Filter subjects by field for Year 3
        document = await curriculum_collection2.find_one({"year": year, "gmail": gmail})
        if document:
            filtered_subjects = [
                subject for subject in document.get("subjects", [])
                if subject.get("field", "For All") in [field, "For All"]
            ]
            document["subjects"] = filtered_subjects
            return document
    else:
        # General curriculum for other years
        document = await curriculum_collection2.find_one({"year": year, "gmail": gmail})
    
    if document:
        return document
    raise HTTPException(status_code=404, detail="Curriculum not found")



async def initialize_curriculums(gmail):
    curriculums = [
        # Year 1 Semester 1
        {
            "year": 1,
            "semester": 1,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Introduction to Calculus",
                    "description": "Functions, limits, continuity, derivatives, integrals, sequences, and series.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Functions", "rating": 0},
                        {"name": "Derivatives", "rating": 0},
                        {"name": "Integrals", "rating": 0}
                    ]
                },
                {
                    "name": "Circuits and Electronics",
                    "description": "Electric circuits, Ohm's law, Kirchhoff's law, semiconductors, and operational amplifiers.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Electric Circuits", "rating": 0},
                        {"name": "Semiconductors", "rating": 0},
                        {"name": "Operational Amplifiers", "rating": 0}
                    ]
                },
                {
                    "name": "Elementary Systems Programming",
                    "description": "Rust programming language: loops, functions, memory, and ownership.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Rust Basics", "rating": 0},
                        {"name": "Memory Management", "rating": 0},
                        {"name": "Functions", "rating": 0}
                    ]
                },
                {
                    "name": "Computer Programming",
                    "description": "Structured programming, object-oriented approaches, and GUI basics.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Programming Basics", "rating": 0},
                        {"name": "Object-Oriented Programming", "rating": 0},
                        {"name": "GUI Design", "rating": 0}
                    ]
                },
                {
                    "name": "INTERCULTURAL COMMUNICATION SKILLS IN ENGLISH 1",
                    "description": "Foundational communication skills for intercultural contexts.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Speaking Skills", "rating": 0},
                        {"name": "Listening Skills", "rating": 0}
                    ]
                },
                {
                    "name": "Introduction to Logic",
                    "description": "Basic logic, reasoning, and problem-solving techniques.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Logic Basics", "rating": 0},
                        {"name": "Reasoning", "rating": 0}
                    ]
                }
            ]
        },
        # Year 1 Semester 2
        {
            "year": 1,
            "semester": 2,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Differential Equations",
                    "description": "First-order and higher-order differential equations, linear systems.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "First-Order Equations", "rating": 0},
                        {"name": "Higher-Order Equations", "rating": 0}
                    ]
                },
                {
                    "name": "Discrete Mathematics",
                    "description": "Set theory, graph theory, counting techniques, and recursion.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Set Theory", "rating": 0},
                        {"name": "Graph Theory", "rating": 0},
                        {"name": "Counting", "rating": 0}
                    ]
                },
                {
                    "name": "Digital System Fundamentals",
                    "description": "Binary systems, Boolean algebra, sequential circuits, and ALU design.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Binary Systems", "rating": 0},
                        {"name": "Sequential Circuits", "rating": 0}
                    ]
                },
                {
                    "name": "Object-Oriented Programming",
                    "description": "Encapsulation, inheritance, polymorphism, and UML modeling.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Encapsulation", "rating": 0},
                        {"name": "Inheritance", "rating": 0},
                        {"name": "Polymorphism", "rating": 0}
                    ]
                },
                {
                    "name": "INTERCULTURAL COMMUNICATION SKILLS IN ENGLISH 2",
                    "description": "Advanced communication skills for intercultural contexts.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Advanced Speaking", "rating": 0},
                        {"name": "Advanced Writing", "rating": 0}
                    ]
                }
            ]
        },
        # Year 2 Semester 2
        {
            "year": 2,
            "semester": 1,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Probability Models and Data Analysis",
                    "description": "Probability, random variables, distributions, and statistical inference.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Probability", "rating": 0},
                        {"name": "Random Variables", "rating": 0},
                        {"name": "Distributions", "rating": 0}
                    ]
                },
                {
                    "name": "Computer Architecture and Organization",
                    "description": "CPU, memory hierarchy, instruction set architecture, and GPU basics.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "CPU Design", "rating": 0},
                        {"name": "Memory Hierarchy", "rating": 0},
                        {"name": "Parallelism", "rating": 0}
                    ]
                },
                {
                    "name": "Data Structures and Algorithms",
                    "description": "Stacks, queues, trees, sorting algorithms, and graph algorithms.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Data Structures", "rating": 0},
                        {"name": "Sorting Algorithms", "rating": 0},
                        {"name": "Graph Algorithms", "rating": 0}
                    ]
                },
                {
                    "name": "Web Programming",
                    "description": "HTML, CSS, JavaScript, and web frameworks.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "HTML", "rating": 0},
                        {"name": "CSS", "rating": 0},
                        {"name": "JavaScript", "rating": 0}
                    ]
                },
                {
                    "name": "Digital Citizen",
                    "description": "Digital ethics, data privacy, and responsible technology usage.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Digital Ethics", "rating": 0},
                        {"name": "Data Privacy", "rating": 0}
                    ]
                },
                {
                    "name": "Language and Communication Course",
                    "description": "Advanced communication skills and language development.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Advanced Speaking", "rating": 0},
                        {"name": "Writing Skills", "rating": 0}
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
                    "name": "Linear Algebra",
                    "description": "Matrices, vector spaces, eigenvalues, and linear transformations.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Matrices", "rating": 0},
                        {"name": "Vector Spaces", "rating": 0},
                        {"name": "Eigenvalues", "rating": 0}
                    ]
                },
                {
                    "name": "Computer Networks",
                    "description": "Network protocols, TCP/IP, routing, and wireless communication.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Network Protocols", "rating": 0},
                        {"name": "Routing", "rating": 0},
                        {"name": "Wireless Communication", "rating": 0}
                    ]
                },
                {
                    "name": "Algorithm Design and Analysis",
                    "description": "Greedy methods, dynamic programming, and divide-and-conquer.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Greedy Methods", "rating": 0},
                        {"name": "Dynamic Programming", "rating": 0},
                        {"name": "Divide-and-Conquer", "rating": 0}
                    ]
                },
                {
                    "name": "Software Engineering Principles",
                    "description": "Software development lifecycle, project management, and CASE tools.",
                    "credit": 4,
                    "field": "For All",
                    "topics": [
                        {"name": "Development Lifecycle", "rating": 0},
                        {"name": "Project Management", "rating": 0},
                        {"name": "CASE Tools", "rating": 0}
                    ]
                },
                {
                    "name": "Database Systems",
                    "description": "SQL, ER diagrams, and relational database design.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "SQL", "rating": 0},
                        {"name": "ER Diagrams", "rating": 0},
                        {"name": "Normalization", "rating": 0}
                    ]
                },
                {
                    "name": "Seminar in Software Engineering",
                    "description": "Lectures and seminars by industry experts.",
                    "credit": 0,
                    "field": "For All",
                    "topics": [
                        {"name": "Seminar Topics", "rating": 0}
                    ]
                },
                {
                    "name": "Philosophy of Science",
                    "description": "Philosophical foundations of science and critical thinking.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Scientific Method", "rating": 0},
                        {"name": "Critical Thinking", "rating": 0}
                    ]
                }
            ]
        },
        {
            "year": 3,
            "semester": 1,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Operating Systems",
                    "description": "Organization and structure of operating systems, including process management, memory management, and file systems.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Process Management", "rating": 0},
                        {"name": "Memory Management", "rating": 0},
                        {"name": "File Systems", "rating": 0}
                    ]
                },
                {
                    "name": "Theory of Computation",
                    "description": "Finite automata, regular expressions, Turing machines, and complexity theory.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Automata Theory", "rating": 0},
                        {"name": "Turing Machines", "rating": 0},
                        {"name": "Complexity Theory", "rating": 0}
                    ]
                },
                {
                    "name": "Software Design and Architecture",
                    "description": "Principles of software design, patterns, and architectural styles.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Design Patterns", "rating": 0},
                        {"name": "Architectural Styles", "rating": 0},
                        {"name": "Quality Attributes", "rating": 0}
                    ]
                },
                {
                    "name": "Artificial Intelligence",
                    "description": "Knowledge representation, search strategies, expert systems, and machine learning basics.",
                    "credit": 3,
                    "field": "AI",
                    "topics": [
                        {"name": "Search Strategies", "rating": 0},
                        {"name": "Expert Systems", "rating": 0},
                        {"name": "Machine Learning", "rating": 0}
                    ]
                },
                {
                    "name": "Computer Graphics and Mixed Reality",
                    "description": "2D and 3D graphics, transformations, rendering, and introduction to Mixed Reality (MR).",
                    "credit": 4,
                    "field": "Metaverse",
                    "topics": [
                        {"name": "2D Transformations", "rating": 0},
                        {"name": "3D Graphics", "rating": 0},
                        {"name": "Mixed Reality", "rating": 0}
                    ]
                },
                {
                    "name": "Web Service Development and Service-Oriented Architecture",
                    "description": "RESTful APIs, SOA, microservices, and cloud platforms.",
                    "credit": 3,
                    "field": "Metaverse and For Industrial IoT",
                    "topics": [
                        {"name": "RESTful APIs", "rating": 0},
                        {"name": "SOA and Microservices", "rating": 0},
                        {"name": "Cloud Platforms", "rating": 0}
                    ]
                },
                {
                    "name": "Real-Time Embedded System Design and Development",
                    "description": "Design and development of real-time embedded systems, including ARM processors and scheduling.",
                    "credit": 4,
                    "field": "IoT",
                    "topics": [
                        {"name": "Embedded Processors", "rating": 0},
                        {"name": "Scheduling", "rating": 0},
                        {"name": "Performance Metrics", "rating": 0}
                    ]
                },
                {
                    "name": "AI Programming",
                    "description": "Hands-on programming with Prolog and Python for AI applications.",
                    "credit": 1,
                    "field": "AI",
                    "topics": [
                        {"name": "Prolog Programming", "rating": 0},
                        {"name": "Python for AI", "rating": 0}
                    ]
                },
                {
                    "name": "Machine Learning",
                    "description": "Introduction to supervised and unsupervised learning, neural networks, and reinforcement learning.",
                    "credit": 3,
                    "field": "AI",
                    "topics": [
                        {"name": "Supervised Learning", "rating": 0},
                        {"name": "Unsupervised Learning", "rating": 0},
                        {"name": "Neural Networks", "rating": 0}
                    ]
                },
                {
                    "name": "Data Science and Data Analytics",
                    "description": "Data analysis techniques, data visualization, and real-world case studies.",
                    "credit": 3,
                    "field": "AI",
                    "topics": [
                        {"name": "Data Analysis", "rating": 0},
                        {"name": "Visualization", "rating": 0},
                        {"name": "Case Studies", "rating": 0}
                    ]
                }
            ]
        },
        # Year 3 Semester 2
        {
            "year": 3,
            "semester": 2,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Compiler Construction",
                    "description": "Lexical analysis, parser construction, type checking, and code optimization.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Lexical Analysis", "rating": 0},
                        {"name": "Parsing", "rating": 0},
                        {"name": "Code Optimization", "rating": 0}
                    ]
                },
                {
                    "name": "Software Development Process and Project Management",
                    "description": "Software development lifecycle, agile methods, and project management techniques.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Agile Methods", "rating": 0},
                        {"name": "Project Management", "rating": 0},
                        {"name": "Testing Strategies", "rating": 0}
                    ]
                },
                {
                    "name": "Distributed Computing",
                    "description": "Distributed systems architecture, fault tolerance, and CAP theorem.",
                    "credit": 3,
                    "field": "Metaverse",
                    "topics": [
                        {"name": "Distributed Architectures", "rating": 0},
                        {"name": "Fault Tolerance", "rating": 0},
                        {"name": "CAP Theorem", "rating": 0}
                    ]
                },
                {
                    "name": "Advanced Database Systems",
                    "description": "Database management systems, concurrency control, and distributed database systems.",
                    "credit": 3,
                    "field": "For Metaverse",
                    "topics": [
                        {"name": "Distributed Databases", "rating": 0},
                        {"name": "Concurrency Control", "rating": 0},
                        {"name": "Object-Oriented Databases", "rating": 0}
                    ]
                },
                {
                    "name": "Knowledge Representation and Reasoning",
                    "description": "Study of semantic networks, frames, logic representation, and reasoning methods.",
                    "credit": 3,
                    "field": "AI",
                    "topics": [
                        {"name": "Semantic Networks", "rating": 0},
                        {"name": "Logic Representation", "rating": 0},
                        {"name": "Reasoning Methods", "rating": 0}
                    ]
                },
                {
                    "name": "Team Software Project",
                    "description": "Team-based software and hardware project development, integrating knowledge and skills.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Requirement Analysis", "rating": 0},
                        {"name": "Project Implementation", "rating": 0},
                        {"name": "Project Management", "rating": 0}
                    ]
                },{
                    "name": "User Experience and User Interface Design",
                    "description": "A comprehensive overview of the user experience and user interface design process.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "User-Centered Design", "rating": 0},
                        {"name": "Design Process", "rating": 0},
                        {"name": "Interface Development", "rating": 0}
                    ]
                },
                {
                    "name": "Industrial IoT Networks and Communications",
                    "description": "Study of IoT network standards, architectures, and secure communication protocols.",
                    "credit": 3,
                    "field": "IoT",
                    "topics": [
                        {"name": "IoT Standards", "rating": 0},
                        {"name": "Secure Communication", "rating": 0},
                        {"name": "Industrial Applications", "rating": 0}
                    ]
                },
                {
                    "name": "Cyber-Physical Systems and Industry 4.0",
                    "description": "Introduction to CPS in smart factories, including Digital Twin and Industry 4.0 concepts.",
                    "credit": 3,
                    "field": "IoT",
                    "topics": [
                        {"name": "Cyber-Physical Systems", "rating": 0},
                        {"name": "Industry 4.0", "rating": 0},
                        {"name": "Communication Protocols", "rating": 0}
                    ]
                },
                {
                    "name": "Deep Learning",
                    "description": "Comprehensive study of neural networks, backpropagation, and convolutional networks.",
                    "credit": 3,
                    "field": "AI",
                    "topics": [
                        {"name": "Neural Networks", "rating": 0},
                        {"name": "Optimization", "rating": 0},
                        {"name": "CNNs", "rating": 0}
                    ]
                }
            ]
        },
        {
            "year": 4,
            "semester": 1,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Free Elective",
                    "description": "Free elective course for enhancing interdisciplinary skills.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Interdisciplinary Skills", "rating": 0}
                    ]
                },
                {
                    "name": "Information and Computer Security",
                    "description": "Overview of information security, risk management, encryption, and network security.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Risk Management", "rating": 0},
                        {"name": "Encryption and Decryption", "rating": 0},
                        {"name": "Network Security", "rating": 0}
                    ]
                },
                {
                    "name": "Software Engineering Project 1",
                    "description": "First half of the senior project focusing on independent research and system development.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Project Development", "rating": 0},
                        {"name": "Mid-Semester Report", "rating": 0},
                        {"name": "Final Presentation", "rating": 0}
                    ]
                }
            ]
        },
        # Year 4 Semester 2
        {
            "year": 4,
            "semester": 2,
            "gmail": gmail,
            "subjects": [
                {
                    "name": "Software Verification and Validation",
                    "description": "Study of testing techniques, peer reviews, and formal verification in software development.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Testing Techniques", "rating": 0},
                        {"name": "Peer Reviews", "rating": 0},
                        {"name": "Formal Verification", "rating": 0}
                    ]
                },
                {
                    "name": "Software Engineering Project 2",
                    "description": "Continuation of Software Engineering Project 1 focusing on implementation and finalization.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Implementation", "rating": 0},
                        {"name": "Final Presentation", "rating": 0},
                        {"name": "Thesis Submission", "rating": 0}
                    ]
                },
                {
                    "name": "Professional Skills and Issues",
                    "description": "Ethics, legal aspects, and professional practices in software engineering.",
                    "credit": 3,
                    "field": "For All",
                    "topics": [
                        {"name": "Professional Ethics", "rating": 0},
                        {"name": "Team Management", "rating": 0},
                        {"name": "Industry Practices", "rating": 0}
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




