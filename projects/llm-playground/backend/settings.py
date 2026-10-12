import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class Settings(BaseModel):
    gemini_api_key:str = os.environ.get("gemini_api_key")

settings = Settings()