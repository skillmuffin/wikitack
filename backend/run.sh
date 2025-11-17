#!/bin/bash

# WikiTack API Startup Script

echo "Starting WikiTack API..."

# Activate virtual environment
source .venv/bin/activate

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
