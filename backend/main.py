from fastapi import FastAPI, UploadFile, File, HTTPException, Query,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from model import User
from database import create_user, fetch_curriculum_by_year, initialize_curriculums, get_user_by_name, user_helper, users_collection, upload_pdf, get_pdf, fetch_books,save_user_schedules, get_user_schedules,curriculum_collection2, insert_holiday_data, holiday_collection, get_bucket_by_year
import io  # Added for handling byte streams
from googleapiclient.discovery import build
from typing import List, Dict, Optional
import random  # Added to randomize career search terms
import requests
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import json



app = FastAPI()

# CORS Middleware to allow connections from the frontend (e.g., React app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to match your frontend domain/IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace 'YOUR_YOUTUBE_API_KEY' with your actual YouTube Data API key
YOUTUBE_API_KEY = 'AIzaSyAbSZ8_8guAb0mePBBF-24baUJtyeHaabQ'


# @app.on_event("startup")
# async def startup_event():
#     print("Initializing curriculum...")
#     await initialize_curriculums()
#     print("Curriculum initialized successfully!")

# Function to search YouTube using the API
def youtube_search(query: str):
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    request = youtube.search().list(
        part='snippet',
        q=query,
        maxResults=10  # Limit the number of results
    )
    response = request.execute()
    
    # Filter out unavailable or invalid videos
    available_videos = [
        item for item in response.get('items', []) if 'videoId' in item['id']
    ]
    print(f"Filtered videos: {available_videos}")  # Log filtered videos
    return available_videos

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
    # Add more career types with keywords here as needed
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

    # Perform YouTube search
    videos = youtube_search(search_term)

    # Extract video IDs and fetch content details
    video_ids = [video['id']['videoId'] for video in videos]
    video_details = youtube_videos(video_ids)

    # Merge snippet and contentDetails
    for video in videos:
        for detail in video_details:
            if video['id']['videoId'] == detail['id']:
                video['contentDetails'] = detail.get('contentDetails', {})
                break
    

    return videos

# API to search YouTube based on user query
@app.get("/search", response_model=List[dict])
def search(query: str = Query(..., description="Search term for YouTube")):
    if not query:
        raise HTTPException(status_code=400, detail="Missing query parameter")
    
    results = youtube_search(query)
    
    # Limit the number of videos returned
    limited_results = results[:5]
    
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
    user_data = await create_user(user)  # Save user to MongoDB
    await initialize_curriculums(user.gmail)
    # curriculum = await fetch_curriculum_by_year(user.year, user.gmail)  # Fetch curriculum for the selected year
    # if curriculum:  
    #     return {"user": user_data, "curriculum": curriculum}

    # raise HTTPException(404, f"No curriculum found for year {user.year}")
    return {"user": user_data}

def curriculum_helper(curriculum):
    """
    Transforms a raw curriculum document from the database into a structured dictionary
    that matches the specified format.
    """
    return {
        "year": curriculum.get("year"),
        "semester": curriculum.get("semester"),
        "gmail": curriculum.get("gmail"),
        "subjects": [
            {
                "name": subject.get("name"),
                "description": subject.get("description"),
                "topics": [
                    {"name": topic.get("name"), "rating": topic.get("rating", 0)}
                    for topic in subject.get("topics", [])
                ],
            }
            for subject in curriculum.get("subjects", [])
        ],
    }

async def fetch_curriculum_by_year_and_semester(year, semester, gmail):
    print(f"Fetching year: {year}, semester: {semester}, gmail: {gmail}")  # Debug log
    curriculum = await curriculum_collection2.find_one({"year": year, "semester": semester, "gmail": gmail})
    if curriculum:
        print(f"Curriculum found: {curriculum}")  # Debug log
        return curriculum_helper(curriculum)
    print("No curriculum found for given semester.")  # Debug log
    return {"subjects": []}

    
# API to fetch user and curriculum by Gmail and optional semester
@app.get("/api/user/schedules/{gmail}")
async def get_user_by_gmail(gmail: str, semester: int = Query(None)):
    user = await users_collection.find_one({"gmail": gmail})
    if user:
        # If semester is provided, fetch specific semester curriculum
        if semester:
            curriculum = await fetch_curriculum_by_year_and_semester(user['year'], semester, user['gmail'])
        else:
            # If no semester is provided, return all semesters or a default
            curriculum = await fetch_curriculum_by_year_and_semester(user['year'], 1, user['gmail'])  # Default to semester 1

        user_data = user_helper(user)
        return {"user": user_data, "curriculum": curriculum}
    raise HTTPException(404, f"User {gmail} not found")

class SimplifiedUser(BaseModel):
    name: Optional[str] = None
    gmail: Optional[EmailStr] = None
    year: Optional[int] = None
    career: Optional[str] = None
    field: Optional[str] = None

@app.get("/api/user/{gmail}", response_model=SimplifiedUser)
async def get_user_by_gmail(gmail: str):
    """
    Fetch user information by Gmail from the database.
    Args:
        gmail (str): User's Gmail address.
    Returns:
        SimplifiedUser: User data including name, gmail, year, career, and field.
    """
    try:
        # Use `await` with `find_one` for proper async handling
        user = await users_collection.find_one({"gmail": gmail})
        if not user:
            raise HTTPException(status_code=404, detail=f"User with email {gmail} not found")

        # Prepare the response data
        user_data = {
            "name": user.get("name", "Unknown"),
            "gmail": user.get("gmail", "Unknown"),
            "year": user.get("year", None),
            "career": user.get("career", None),
            "field": user.get("field", None),  # Include the field property
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

        # Update user data in MongoDB
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
    
    # Get the corresponding GridFS bucket for the year
    fs = get_bucket_by_year(year)
    if not fs:
        raise HTTPException(status_code=400, detail="Invalid year")

    file_data = await file.read()  # Read file as bytes
    metadata = {"filename": file.filename, "year": year}
    pdf_id = await fs.upload_from_stream(file.filename, file_data, metadata=metadata)  # Save in MongoDB GridFS
    return {"pdf_id": str(pdf_id)}

@app.get("/books/{year}")
async def list_books(year: int):
    # Get the corresponding GridFS bucket for the year
    fs = get_bucket_by_year(year)
    if not fs:
        raise HTTPException(status_code=400, detail="Invalid year")

    # Retrieve the list of files in the bucket
    try:
        files = fs.find()  # Get a cursor to all files in the bucket
        files_list = await files.to_list(None)  # Convert cursor to a list
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
    # Get the corresponding GridFS bucket for the year
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


# Replace with your actual NewsAPI key
NEWS_API_KEY = 'f573033188a041a898274d18703287cf'

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
}

@app.get("/news")
def get_news(query: str = Query(...)):
    if not query:
        raise HTTPException(status_code=400, detail="Missing query parameter")

    # Normalize the query string to lowercase for comparison
    normalized_query = query.lower()
    
    # Add logging to check if the query is received properly
    print(f"Received query: {query}")

    # Create a mapping of lowercase career types for normalization
    career_mapping_news = {k.lower(): k for k in career_keywords_news.keys()}

    # Check if the normalized query is in the career_keywords dictionary
    if normalized_query in career_mapping_news:
        # Get the original career type from the mapping
        actual_career = career_mapping_news[normalized_query]

        # Randomly select a keyword from the list of career-related keywords
        keyword = random.choice(career_keywords_news[actual_career])
        print(f"Selected keyword for {actual_career}: {keyword}")  # Debug log to see the chosen keyword

        # Fetch news articles using the randomly selected keyword
        url = f"https://newsapi.org/v2/everything?q={keyword}&apiKey={NEWS_API_KEY}&pageSize=10"  # Limit to 10 articles using pageSize
        print(f"Requesting news from: {url}")  # Debug the final API request URL

        response = requests.get(url)

        if response.status_code == 200:
            print("News fetched successfully.")  # Log success
            articles = response.json().get("articles", [])
            
            # Return only the first 10 articles (already limited by pageSize)
            return articles[:10]
        else:
            print(f"Failed to fetch news, status code: {response.status_code}")  # Log failure
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch news")
    else:
        print(f"Invalid career type: {query}")  # Log invalid career types
        raise HTTPException(status_code=400, detail="Invalid career type")
    

class RatingRequest(BaseModel):
    gmail: EmailStr
    subject: str
    topic: str  # ต้องมี attribute topic
    rating: int

@app.post("/api/user/rating")
async def rate_subject(request: RatingRequest):
    try:
        print("Received rating request:", request)

        # Find the document where this user has the specified subject and topic
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

        # Update the rating for the specific subject and topic
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

# Schedule model definition
class Schedule(BaseModel):
    title: str
    details: str
    color: str
    startMinute: int
    endMinute: int
    youtubeVideoId: str = None  # Optional YouTube video ID

# Request model for schedules
class ScheduleRequest(BaseModel):
    gmail: EmailStr
    schedules: Dict[str, Dict[int, Schedule]]  # Dict[date, Dict[minute, Schedule details]]

# API to save user schedules
@app.post("/save_schedules/")
async def save_schedules(
    gmail: str = Form(...),
    schedules: str = Form(...),
    videoFile: UploadFile = File(None)
):
    try:
        # Parse schedules from JSON
        schedules_data = json.loads(schedules)

        # Save the file to GridFS if provided
        file_id = None
        if videoFile:
            file_data = await videoFile.read()
            file_id = await upload_pdf(file_data, videoFile.filename)

        # Update schedules to include file ID if applicable
        if file_id:
            for day, events in schedules_data.items():
                for minute, event in events.items():
                    event["videoFile"] = str(file_id)

        # Save schedules to MongoDB
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
        # Fetch user by email
        user = await users_collection.find_one({"gmail": gmail})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if the day exists in the user's schedule
        if day in user["schedules"]:
            # Loop through all the events of the day and find the event with the matching start minute
            schedule_found = False
            for minute, event in user["schedules"][day].items():
                if event["startMinute"] == start_minute:
                    # Delete all the minutes between startMinute and endMinute
                    for minute_to_delete in range(event["startMinute"], event["endMinute"] + 1):
                        user["schedules"][day].pop(str(minute_to_delete), None)
                    
                    # If no more schedules exist for that day, delete the day entry
                    if not user["schedules"][day]:
                        del user["schedules"][day]
                    
                    # Mark that the schedule was found and break the loop
                    schedule_found = True
                    break

            if not schedule_found:
                raise HTTPException(status_code=404, detail="Schedule not found at the given time")
            
            # Update the user's schedule in the database
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
        # Fetch holidays from the "holiday" collection
        holidays_cursor = holiday_collection.find()  # Get all documents from the collection
        holidays = await holidays_cursor.to_list(length=1000)  # Convert the cursor to a list with a max limit

        # Transform ObjectId to string and return the result
        for holiday in holidays:
            holiday["_id"] = str(holiday["_id"])  # Convert ObjectId to string for JSON serialization

        return {"holidays": holidays}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching holidays: {str(e)}")


# @app.on_event("startup")
# async def startup_event():
#     await insert_holiday_data()