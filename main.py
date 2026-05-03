"""
main.py — FastAPI entry point for the YouTube Video Summariser API.

Endpoints:
  GET  /                  → Health check
  POST /api/summarize     → Returns summary text + Mermaid diagram code
  POST /api/download-doc  → Returns a downloadable .docx file
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Import our custom services
import services

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="YouTube Video Summariser API")

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ──────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    video_url: str
    token_limit: int = 500


class DownloadDocRequest(BaseModel):
    title: str
    summary: str


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────

@app.get("/")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "YouTube Video Summariser API is running 🚀"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """Dummy favicon to silence browser 404 errors."""
    return Response(content=b"", media_type="image/x-icon")


@app.post("/api/summarize")
def summarize_video(request: SummarizeRequest):
    """
    Main endpoint. Accepts a YouTube URL, returns:
      - title: Inferred video title
      - summary: Structured markdown summary
      - mermaid_code: Mermaid.js diagram syntax
    """
    try:
        # Step 1: Fetch transcript from YouTube
        transcript = services.get_video_transcript(request.video_url)

        # Step 2: Generate summary via Gemini
        result = services.generate_summary(transcript, request.token_limit)

        # Step 3: Generate Mermaid diagram code via Gemini
        mermaid_code = services.generate_mermaid_code(result["summary"])

        return {
            "title": result["title"],
            "summary": result["summary"],
            "mermaid_code": mermaid_code,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.post("/api/download-doc")
def download_doc(request: DownloadDocRequest):
    """
    Accepts a title and summary, generates a styled .docx file,
    and returns it as a downloadable file stream.
    """
    try:
        buffer = services.create_word_document(request.title, request.summary)

        # Create a safe filename from the title
        safe_title = "".join(c for c in request.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title[:50]}_Summary.docx"

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")
