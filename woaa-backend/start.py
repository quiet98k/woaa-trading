"""
Script to run the FastAPI application using uvicorn.
Loads environment variables and starts the server with auto-reload for development.
"""

import os
import uvicorn
from dotenv import load_dotenv

# Load variables from .env file into environment
load_dotenv()

# Read host and port from environment or use defaults
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
