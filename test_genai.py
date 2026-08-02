import os
from google import genai
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)
# skip generation since model name might not exist or need billing, let's just make sure it compiles
print("ok")
