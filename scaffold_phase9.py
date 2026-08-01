import os

files = {
    "sentinel-insider-ai/.github/workflows/ci.yml": """name: Sentinel CI/CD

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.11
      uses: actions/setup-python@v4
      with:
        python-version: "3.11"
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    - name: Run Tests
      run: |
        cd backend
        pytest -v

  build-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: "18"
    - name: Install dependencies and build
      run: |
        cd frontend
        npm ci
        npm run build
""",
    "sentinel-insider-ai/backend/Dockerfile": """FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
""",
    "sentinel-insider-ai/docker-compose.yml": """version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - REDIS_URI=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongo
      - redis
    networks:
      - sentinel_net

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - sentinel_net

  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"
    networks:
      - sentinel_net

volumes:
  mongo_data:

networks:
  sentinel_net:
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 9 Scaffolding completed.")
