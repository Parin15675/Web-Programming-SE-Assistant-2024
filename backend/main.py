from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from model import User
from database import create_user, fetch_curriculum_by_year, initialize_curriculums, get_user_by_name, user_helper, users_collection, upload_pdf, get_pdf, fetch_books,save_user_schedules, get_user_schedules
import io  # Added for handling byte streams
from googleapiclient.discovery import build
from typing import List, Dict
import random  # Added to randomize career search terms
import requests
from pydantic import BaseModel, EmailStr

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
YOUTUBE_API_KEY = 'AIzaSyB6beEGYhSRxAdB6IXc_K1Jr5W4fRm1j3A'

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

# Fetch videos based on career
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

# Initialize curriculum when the server starts
@app.on_event("startup")
async def startup_event():
    await initialize_curriculums()

# API to create user and fetch curriculum by year
@app.post("/api/user/")
async def create_user_and_get_curriculum(user: User):
    user_data = await create_user(user)  # Save user to MongoDB
    curriculum = await fetch_curriculum_by_year(user.year)  # Fetch curriculum for the selected year
    if curriculum:
        return {"user": user_data, "curriculum": curriculum}
    raise HTTPException(404, f"No curriculum found for year {user.year}")

# API to fetch user and curriculum by Gmail
@app.get("/api/user/{gmail}")
async def get_user_by_gmail(gmail: str):
    user = await users_collection.find_one({"gmail": gmail})  # Fetch user by Gmail
    if user:
        curriculum = await fetch_curriculum_by_year(user['year'])
        return {"user": user_helper(user), "curriculum": curriculum}
    raise HTTPException(404, f"User {gmail} not found")

# API for uploading PDFs to MongoDB
@app.post("/upload-book/")
async def upload_book(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    file_data = await file.read()  # Read file as bytes
    pdf_id = await upload_pdf(file_data, file.filename)  # Save in MongoDB GridFS
    return {"pdf_id": pdf_id}

# API for downloading PDF from MongoDB
@app.get("/books/{pdf_id}")
async def download_book(pdf_id: str):
    file_data = await get_pdf(pdf_id)  # Retrieve file from GridFS
    if not file_data:
        raise HTTPException(404, detail="PDF not found")
    
    return StreamingResponse(io.BytesIO(file_data), media_type="application/pdf")

# API for listing available books (PDFs)
@app.get("/api/books/")
async def list_books():
    files = await fetch_books()  # Fetch the list of PDF files from MongoDB
    return files

# Replace with your actual NewsAPI key
NEWS_API_KEY = 'ab40d7c1ff0c460d9e761c713881a3f8'

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
    rating: int

@app.post("/api/user/rating")
async def rate_subject(request: RatingRequest):
    if request.rating < 1 or request.rating > 10:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # ค้นหาและอัปเดตผู้ใช้ในฐานข้อมูล
    user = await users_collection.find_one({"gmail": request.gmail})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "ratings" not in user:
        user["ratings"] = {}
    user["ratings"][request.subject] = request.rating

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"ratings": user["ratings"]}}
    )

    return {"message": "Rating updated successfully"}
  

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
async def save_schedules(data: ScheduleRequest):
    try:
        result = await save_user_schedules(data.gmail, data.schedules)
        return result
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# API to fetch user schedules
@app.get("/get_schedules/{gmail}")
async def get_schedules(gmail: str):
    try:
        schedules = await get_user_schedules(gmail)
        return schedules
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

