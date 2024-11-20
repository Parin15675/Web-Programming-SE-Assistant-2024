from fastapi import FastAPI, UploadFile, File, HTTPException, Query,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from model import User,TargetGPARequest, SimplifiedUser, RatingRequest, ScheduleRequest
from database import create_user, fetch_curriculum_by_year, initialize_curriculums, get_user_by_name, user_helper, users_collection, upload_pdf, get_pdf, fetch_books,save_user_schedules, get_user_schedules,curriculum_collection2, insert_holiday_data, holiday_collection, get_bucket_by_year, target_gpaDB
import io
from googleapiclient.discovery import build
from typing import List, Dict, Optional
import random
import requests
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import json



app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


YOUTUBE_API_KEY = 'AIzaSyBlhAL6cZu6Al__e2PY1iKCWoDvStP0K_Q'

NEWS_API_KEY = 'f573033188a041a898274d18703287cf'


# Function to search for Youtube Videos
def youtube_search(query: str):
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    request = youtube.search().list(
        part='snippet',
        q=query,
        maxResults=10
    )
    response = request.execute()
    
    available_videos = [
        item for item in response.get('items', []) if 'videoId' in item['id']
    ]

    return available_videos

#Convert youtube ids into details
def youtube_videos(video_ids: List[str]):
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    request = youtube.videos().list(
        part='contentDetails',
        id=','.join(video_ids)
    )
    response = request.execute()

    return response.get('items', [])

# Define career keywords for each career type
career_keywords = {
    "Software Engineer": ["software engineering", "coding", "algorithms", "developer", "programming tutorial"],
    "Data Analysis": ["data analysis", "data science", "statistics", "Python data analysis", "data visualization"],
    "Web Development": ["web development", "frontend development", "backend development", "React.js", "HTML CSS JavaScript"],
    "Game Development": ["game development", "Unity tutorials", "Unreal Engine basics", "game design principles", "3D game development", "Godot tutorials", "C# for games", "Blender game assets", "indie game development"],
    "Mobile App Development": ["mobile app development", "Android development", "iOS development", "React Native tutorials", "Flutter tutorials", "Kotlin app development", "Swift programming", "mobile UI design"],
    "Artificial Intelligence (AI) and Machine Learning (ML)": ["machine learning tutorials", "artificial intelligence basics", "neural networks explained", "deep learning", "TensorFlow tutorials", "PyTorch basics", "AI projects", "ML algorithms"],
    "Cybersecurity": ["cybersecurity basics", "ethical hacking", "penetration testing", "network security", "cryptography explained", "cybersecurity tools", "ethical hacking with Kali Linux"],
    "Cloud Computing and DevOps": ["cloud computing tutorials", "AWS basics", "Azure cloud development", "DevOps principles", "Docker tutorials", "Kubernetes basics", "CI/CD pipelines", "serverless computing"],
    "Embedded Systems and IoT": ["embedded systems", "IoT projects", "Arduino tutorials", "Raspberry Pi programming", "microcontroller programming", "IoT with Python", "ESP32 projects"],
    "UI/UX Design": ["UI design tutorials", "UX principles", "Figma tutorials", "Adobe XD basics", "interaction design", "user research for UX", "prototyping tools", "design systems"],
    "Blockchain Development": ["blockchain development", "Ethereum smart contracts", "Solidity programming", "Decentralized applications (DApps)", "cryptocurrency basics", "Hyperledger tutorials", "NFT development"],
    "Robotics": ["robotics tutorials", "ROS (Robot Operating System)", "robot programming", "robot sensors and actuators", "autonomous robotics", "Arduino for robotics", "robot vision systems"],
    "Software Testing and QA": ["software testing tutorials", "manual testing basics", "test automation tools", "Selenium tutorials", "performance testing", "unit testing frameworks", "QA methodologies"],
    "AR/VR Development": ["augmented reality development", "virtual reality tutorials", "Unity for AR/VR", "3D modeling for VR", "ARKit basics", "ARCore tutorials", "immersive technologies"],
    "Big Data": ["big data tutorials", "Hadoop basics", "Spark for big data", "data pipelines", "NoSQL databases", "Apache Kafka tutorials", "data lake architecture"],
    "DevTools and Productivity": ["developer tools tutorials", "Git basics", "GitHub for teams", "terminal commands for developers", "debugging techniques", "VS Code extensions", "time management for developers"],
}


@app.get("/career_videos", response_model=List[dict])
async def get_career_videos(gmail: str):
    user = await users_collection.find_one({"gmail": gmail})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    career = user.get("career")
    if not career or career not in career_keywords:
        raise HTTPException(status_code=404, detail="Career interest not found")

    # Select a random keyword from the user's career interest
    search_term = random.choice(career_keywords[career])

    videos = youtube_search(search_term)
    if not videos:
        raise HTTPException(status_code=404, detail="No videos found for the given career")

    video_ids = [video['id']['videoId'] for video in videos if 'id' in video and 'videoId' in video['id']]
    if not video_ids:
        raise HTTPException(status_code=404, detail="No valid video IDs found")

    video_details = youtube_videos(video_ids)
    if not video_details:
        raise HTTPException(status_code=404, detail="No video details found")
    
    for video in videos:
        video_id = video.get('id', {}).get('videoId')
        if not video_id:
            continue
        for detail in video_details:
            if video_id == detail['id']:
                video['contentDetails'] = detail.get('contentDetails', {})
                break

    return videos

# API to search YouTube based on user query
@app.get("/search", response_model=List[dict])
def search(query: str = Query(..., description="Search term for YouTube")):
    if not query:
        raise HTTPException(status_code=400, detail="Missing query parameter")
    
    results = youtube_search(query)
    
    limited_results = results[:10]
    
    return limited_results

# New endpoint for fetching video details like contentDetails (duration)
@app.get("/videos", response_model=List[dict])
def get_video_details(video_ids: str = Query(..., description="Comma-separated list of YouTube video IDs")):
    if not video_ids:
        raise HTTPException(status_code=400, detail="Missing video_ids parameter")
    
    video_id_list = video_ids.split(',')
    details = youtube_videos(video_id_list)
    
    if not details:
        raise HTTPException(status_code=404, detail="No video details found")
    
    return details

# API to create user and fetch curriculum by year
@app.post("/api/user/")
async def create_user_and_get_curriculum(user: User):
    user_data = await create_user(user)
    await initialize_curriculums(user.gmail)

    return {"user": user_data}


#Transforms a raw curriculum document from the database into a structured dictionary
def curriculum_helper(curriculum):
    return {
        "year": curriculum.get("year"),
        "semester": curriculum.get("semester"),
        "gmail": curriculum.get("gmail"),
        "subjects": [
            {
                "name": subject.get("name"),
                "description": subject.get("description"),
                "credit": subject.get("credit"),
                "field": subject.get("field"),
                "topics": [
                    {"name": topic.get("name"), "rating": topic.get("rating", 0)}
                    for topic in subject.get("topics", [])
                ],
            }
            for subject in curriculum.get("subjects", [])
        ],
    }

#get cirriculum by year and semester
async def fetch_curriculum_by_year_and_semester(year, semester, gmail):

    user = await users_collection.find_one({"gmail": gmail})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    field = user.get("field") 
    query = {"year": year, "semester": semester, "gmail": gmail}

    if year == 3 and field:
        query["subjects"] = {
            "$elemMatch": {"field": {"$in": [field, "For All"]}}
        }

    curriculum = await curriculum_collection2.find_one(query)
    if curriculum:
        
        # Filter subjects to only include relevant ones for the field or "For All"
        filtered_subjects = [
            subject for subject in curriculum.get("subjects", [])
            if subject.get("field", "For All") in [field, "For All"]
        ]
        curriculum["subjects"] = filtered_subjects
        return curriculum_helper(curriculum)

    return {"subjects": []}

    
# API to fetch user and curriculum by Gmail and optional semester
@app.get("/api/user/schedules/{gmail}")
async def get_user_by_gmail(gmail: str, semester: int = Query(None)):
    user = await users_collection.find_one({"gmail": gmail})
    if user:
        if semester:
            curriculum = await fetch_curriculum_by_year_and_semester(user['year'], semester, user['gmail'])
        else:
             # Default to semester 1
            curriculum = await fetch_curriculum_by_year_and_semester(user['year'], 1, user['gmail'])

        user_data = user_helper(user)
        return {"user": user_data, "curriculum": curriculum}
    raise HTTPException(404, f"User {gmail} not found")


# Get user data by email
@app.get("/api/user/{gmail}", response_model=SimplifiedUser)
async def get_user_by_gmail(gmail: str):

    try:
        user = await users_collection.find_one({"gmail": gmail})
        if not user:
            raise HTTPException(status_code=404, detail=f"User with email {gmail} not found")

        user_data = {
            "name": user.get("name", "Unknown"),
            "gmail": user.get("gmail", "Unknown"),
            "year": user.get("year", None),
            "career": user.get("career", None),
            "field": user.get("field", None),
        }

        return SimplifiedUser(**user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.put("/api/user/{gmail}")
async def update_user(gmail: str, user_data: SimplifiedUser):
    """
    Updates user details in the database.
    """
    print(f"Incoming data for {gmail}: {user_data}")
    try:
        # Convert the user data to a dictionary and exclude unset fields
        updated_data = user_data.dict(exclude_unset=True)

        if not updated_data:
            raise HTTPException(status_code=400, detail="No fields provided to update")
        
        result = await users_collection.update_one({"gmail": gmail}, {"$set": updated_data})

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found or no changes made")

        return {"message": "User updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")



# API for uploading PDFs to MongoDB
@app.post("/upload-book/")
async def upload_book(file: UploadFile = File(...), year: int = Query(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    fs = get_bucket_by_year(year)
    if not fs:
        raise HTTPException(status_code=400, detail="Invalid year")

    file_data = await file.read()
    metadata = {"filename": file.filename, "year": year}
    pdf_id = await fs.upload_from_stream(file.filename, file_data, metadata=metadata) 
    return {"pdf_id": str(pdf_id)}


@app.get("/books/{year}")
async def list_books(year: int):
    fs = get_bucket_by_year(year)
    if not fs:
        raise HTTPException(status_code=400, detail="Invalid year")

    try:
        files = fs.find()
        files_list = await files.to_list(None)
        return [
            {
                "id": str(file["_id"]),
                "filename": file["metadata"]["filename"],
            }
            for file in files_list
        ]
    except Exception:
        raise HTTPException(500, detail="Failed to retrieve files")


@app.get("/books/{year}/{pdf_id}")
async def download_book(year: int, pdf_id: str):
    fs = get_bucket_by_year(year)
    if not fs:
        raise HTTPException(status_code=400, detail="Invalid year")
    
    try:
        # Convert pdf_id to ObjectId and fetch the file from GridFS
        file_data = await fs.open_download_stream(ObjectId(pdf_id))
        file_bytes = await file_data.read()
    except Exception:
        raise HTTPException(404, detail="PDF not found")
    
    return StreamingResponse(io.BytesIO(file_bytes), media_type="application/pdf")




def fetch_news(query: str):
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        articles = response.json().get("articles", [])
        return articles
    else:
        print(f"Failed to fetch news: {response.status_code}")
        return []


# Define career keywords for each career type
career_keywords_news = {
    "Software Engineer": ["software engineering", "coding", "algorithms", "developer", "programming tutorial"],
    "Data Analysis": ["data analysis", "data science", "statistics", "Python data analysis", "data visualization"],
    "Web Development": ["web development", "frontend development", "backend development", "React.js", "HTML CSS JavaScript"],
    "Game Development": ["game development", "Unity tutorials", "Unreal Engine basics", "game design principles", "3D game development", "Godot tutorial", "C# game", "Blender game assets", "indie game development"],
    "Mobile App Development": ["mobile app development", "Android development", "iOS development", "React Native tutorials", "Flutter tutorials", "Kotlin app development", "Swift programming", "mobile UI design"],
    "Artificial Intelligence (AI) and Machine Learning (ML)": ["machine learning tutorials", "artificial intelligence basics", "neural networks explained", "deep learning", "TensorFlow tutorials", "PyTorch basics", "AI projects", "ML algorithms"],
    "Cybersecurity": ["cybersecurity basics", "ethical hacking", "penetration testing", "network security", "cryptography explained", "cybersecurity tools", "ethical hacking with Kali Linux"],
    "Cloud Computing and DevOps": ["cloud computing tutorials", "AWS basics", "Azure cloud development", "DevOps principles", "Docker tutorials", "Kubernetes basics", "CI/CD pipelines", "serverless computing"],
    "Embedded Systems and IoT": ["embedded systems", "IoT projects", "Arduino tutorials", "Raspberry Pi programming", "microcontroller programming", "IoT with Python", "ESP32 projects"],
    "UI/UX Design": ["UI design tutorials", "UX principles", "Figma tutorials", "Adobe XD basics", "interaction design", "user research for UX", "prototyping tools", "design systems"],
    "Blockchain Development": ["blockchain development", "Ethereum smart contracts", "Solidity programming", "Decentralized applications (DApps)", "cryptocurrency basics", "Hyperledger tutorials", "NFT development"],
    "Robotics": ["robotics tutorials", "ROS (Robot Operating System)", "robot programming", "robot sensors and actuators", "autonomous robotics", "Arduino for robotics", "robot vision systems"],
    "Software Testing and QA": ["software testing tutorials", "manual testing basics", "test automation tools", "Selenium tutorials", "performance testing", "unit testing frameworks", "QA methodologies"],
    "AR/VR Development": ["augmented reality development", "virtual reality tutorials", "Unity for AR/VR", "3D modeling for VR", "ARKit basics", "ARCore tutorials", "immersive technologies"],
    "Big Data": ["big data tutorials", "Hadoop basics", "Spark for big data", "data pipelines", "NoSQL databases", "Apache Kafka tutorials", "data lake architecture"],
    "DevTools and Productivity": ["developer tools tutorials", "Git basics", "GitHub for teams", "terminal commands for developers", "debugging techniques", "VS Code extensions", "time management for developers"],
}




@app.get("/news")
def get_news(query: str = Query(...)):
    if not query:
        raise HTTPException(status_code=400, detail="Missing query parameter")

    normalized_query = query.lower()
    
    career_mapping_news = {k.lower(): k for k in career_keywords_news.keys()}

    if normalized_query in career_mapping_news:
        actual_career = career_mapping_news[normalized_query]

        keyword = random.choice(career_keywords_news[actual_career])
        print(f"Selected keyword for {actual_career}: {keyword}")

        url = f"https://newsapi.org/v2/everything?q={keyword}&apiKey={NEWS_API_KEY}&pageSize=10"
        print(f"Requesting news from: {url}")

        response = requests.get(url)

        if response.status_code == 200:
            print("News fetched successfully.")
            articles = response.json().get("articles", [])
            
            return articles[:10]
        else:
            print(f"Failed to fetch news, status code: {response.status_code}")
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch news")
    else:
        print(f"Invalid career type: {query}")
        raise HTTPException(status_code=400, detail="Invalid career type")
    

@app.post("/api/user/rating")
async def rate_subject(request: RatingRequest):
    try:
        print("Received rating request:", request)

        user = await curriculum_collection2.find_one({
            "gmail": request.gmail,
            "subjects": {
                "$elemMatch": {
                    "name": request.subject,
                    "topics.name": request.topic
                }
            }
        })

        if not user:
            raise HTTPException(status_code=404, detail="User or subject not found")

        result = await curriculum_collection2.update_one(
            {
                "_id": user["_id"],
                "subjects.name": request.subject,
                "subjects.topics.name": request.topic
            },
            {
                "$set": {
                    "subjects.$[subject].topics.$[topic].rating": request.rating
                }
            },
            array_filters=[
                {"subject.name": request.subject},
                {"topic.name": request.topic}
            ]
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update rating in database")

        print("Updated ratings successfully")
        return {"message": "Rating updated successfully"}
        
    except Exception as e:
        print(f"Error in rate_subject: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred") 

class Schedule(BaseModel):
    title: str
    details: str
    color: str
    startMinute: int
    endMinute: int
    youtubeVideoId: str = None

# API to save user schedules
@app.post("/save_schedules/")
async def save_schedules(
    gmail: str = Form(...),
    schedules: str = Form(...),
    videoFile: UploadFile = File(None)
):
    try:
        schedules_data = json.loads(schedules)

        file_id = None
        if videoFile:
            file_data = await videoFile.read()
            file_id = await upload_pdf(file_data, videoFile.filename)

        if file_id:
            for day, events in schedules_data.items():
                for minute, event in events.items():
                    event["videoFile"] = str(file_id)

        await save_user_schedules(gmail, schedules_data)

        return {"message": "Schedules saved successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
# API to fetch user schedules
@app.get("/get_schedules/{gmail}")
async def get_schedules(gmail: str):
    try:
        schedules = await get_user_schedules(gmail)
        return schedules
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@app.delete("/delete_schedule/")
async def delete_schedule(gmail: str, day: str, start_minute: int):
    try:
        user = await users_collection.find_one({"gmail": gmail})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
      
        if day in user["schedules"]:
            # Loop through all the events of the day and find the event with the matching start minute
            schedule_found = False
            for minute, event in user["schedules"][day].items():
                if event["startMinute"] == start_minute:
                    # Delete all the minutes between startMinute and endMinute
                    for minute_to_delete in range(event["startMinute"], event["endMinute"] + 1):
                        user["schedules"][day].pop(str(minute_to_delete), None)
                    
                    if not user["schedules"][day]:
                        del user["schedules"][day]
    
                    schedule_found = True
                    break

            if not schedule_found:
                raise HTTPException(status_code=404, detail="Schedule not found at the given time")
            
            await users_collection.update_one(
                {"_id": ObjectId(user["_id"])},
                {"$set": {"schedules": user["schedules"]}}
            )
            return {"message": "Schedule deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="No schedules found for the given day")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/api/public_holidays/")
async def get_public_holidays():
    """
    Fetch a list of public holidays from the database.
    """
    try:
        holidays_cursor = holiday_collection.find()
        holidays = await holidays_cursor.to_list(length=1000)

        for holiday in holidays:
            holiday["_id"] = str(holiday["_id"]) 

        return {"holidays": holidays}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching holidays: {str(e)}")


class ResetRatingRequest(BaseModel):
    gmail: EmailStr
    subject: str


class ResetRatingRequest(BaseModel):
    gmail: str
    subject: str

@app.post("/api/user/reset-rating")
async def reset_rating(request: ResetRatingRequest):
    try:
        user_curriculum = await curriculum_collection2.find_one({
            "gmail": request.gmail,
            "subjects.name": request.subject
        })

        if not user_curriculum:
            raise HTTPException(status_code=404, detail="Subject not found for user")

        result = await curriculum_collection2.update_one(
            {
                "_id": user_curriculum["_id"],
                "subjects.name": request.subject
            },
            {
                "$set": {
                    "subjects.$.topics.$[].rating": -1 
                }
            }
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to reset ratings")

        return {"message": "Ratings reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/user/target_gpa/")
async def set_target_gpa(data: TargetGPARequest):
    if not (0 <= data.target_gpa <= 4):
        raise HTTPException(status_code=400, detail="Target GPA must be between 0 and 4.")

    existing_user = await target_gpaDB.find_one({"gmail": data.gmail})

    if existing_user:
        result = await target_gpaDB.update_one(
            {"gmail": data.gmail},
            {"$set": {"target_gpa": data.target_gpa}}
        )
        if result.modified_count > 0:
            print(f"Updated target_gpa for {data.gmail}")
    else:
        result = await target_gpaDB.insert_one({"gmail": data.gmail, "target_gpa": data.target_gpa})
        if result.inserted_id:
            print(f"Inserted new document for {data.gmail}")

    return {"message": "Target GPA saved successfully!", "gmail": data.gmail, "target_gpa": data.target_gpa}


@app.get("/api/user/target_gpa/{gmail}")
async def get_target_gpa(gmail: str):
    user = await target_gpaDB.find_one({"gmail": gmail})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
 
    return {"gmail": user["gmail"], "target_gpa": user["target_gpa"]}
    
