import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI PDF Summarizer")

# Enable CORS (Good practice for APIs, though we'll serve static files directly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)


@app.post("/api/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    if not API_KEY or API_KEY == "your_api_key_here":
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key is missing or invalid. Please add it to your .env file.",
        )

    try:
        # Read the file content
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))

        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF. It might be scanned or empty.",
            )

        # Initialize the Gemini Model
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Create the prompt for the AI
        prompt = f"""
        Please provide a comprehensive summary of the following document. 
        Structure the summary with a brief introduction, key points (bulleted), and a conclusion.
        
        Document Text:
        {text[:50000]} # Limit to 50k characters to stay within reasonable limits
        """

        # Generate the summary
        response = model.generate_content(prompt)

        return JSONResponse(content={"summary": response.text})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mount the static directory to serve HTML, CSS, JS
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    # This block allows running with: python main.py
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
