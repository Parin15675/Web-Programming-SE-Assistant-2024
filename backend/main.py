from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from model import User
from database import create_user, fetch_curriculum_by_year, initialize_curriculums, get_user_by_name, user_helper, users_collection, upload_pdf, get_pdf, fetch_books
import io  # Added for handling byte streams

app = FastAPI()

# CORS Middleware settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize curriculum data when server starts
@app.on_event("startup")
async def startup_event():
    await initialize_curriculums()

# Create user and get curriculum
@app.post("/api/user/")
async def create_user_and_get_curriculum(user: User):
    user_data = await create_user(user)
    curriculum = await fetch_curriculum_by_year(user.year)
    if curriculum:
        return {"user": user_data, "curriculum": curriculum}
    raise HTTPException(404, f"No curriculum found for year {user.year}")

# Get curriculum by year
@app.get("/api/curriculum/{year}")
async def get_curriculum_by_year(year: int):
    curriculum = await fetch_curriculum_by_year(year)
    if curriculum:
        return curriculum
    raise HTTPException(404, f"No curriculum found for year {year}")

# Get user and their curriculum by name
@app.get("/api/user/{name}")
async def get_user_by_name(name: str):
    user = await users_collection.find_one({"name": name})
    if user:
        curriculum = await fetch_curriculum_by_year(user['year'])
        return {"user": user_helper(user), "curriculum": curriculum}
    raise HTTPException(404, f"User {name} not found")

# Upload PDF file to MongoDB
@app.post("/upload-book/")
async def upload_book(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    file_data = await file.read()  # Read the file's content as bytes
    pdf_id = await upload_pdf(file_data, file.filename)  # Store in MongoDB using GridFS
    return {"pdf_id": pdf_id}

# Download PDF file from MongoDB
@app.get("/books/{pdf_id}")
async def download_book(pdf_id: str):
    file_data = await get_pdf(pdf_id)  # Get the file data from MongoDB
    if not file_data:
        raise HTTPException(404, detail="PDF not found")
    
    return StreamingResponse(io.BytesIO(file_data), media_type="application/pdf")  # Stream the PDF file

@app.get("/api/books/")
async def list_books():
    files = await fetch_books()  # Fetch the list of PDF files
    return files

