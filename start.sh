#!/bin/bash

# Once-Only Dog Tax Transfer Platform - Universal Start Script
# Optimized for: Linux, macOS, and Windows (Git Bash / WSL)

echo "🚀 Initializing Once-Only Dog Tax Transfer Platform..."

# --- 1. OS Detection ---
OS="linux"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi
echo "💻 System: $OS"

# --- 2. Environment Path Configuration ---
VENV_DIR="backend/.venv"
if [ "$OS" == "windows" ]; then
    PYTHON_VENV="$VENV_DIR/Scripts/python.exe"
    PIP_VENV="$VENV_DIR/Scripts/pip.exe"
else
    PYTHON_VENV="$VENV_DIR/bin/python"
    PIP_VENV="$VENV_DIR/bin/pip"
fi

# --- 3. Backend Setup ---
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR" || python -m venv "$VENV_DIR"
fi

echo "📥 Checking backend dependencies..."
"$PIP_VENV" install -q --upgrade pip
"$PIP_VENV" install -q -r backend/requirements.txt

echo "🗄️ Seeding database..."
# Run from root but use venv python and specify module path
cd backend
../"$PYTHON_VENV" -m app.seed --reset
../"$PYTHON_VENV" -m app.import_csv --file data/example_data.csv
cd ..

# --- 4. Process Cleanup ---
# Ensure port 8000 is clear before starting
if [ "$OS" != "windows" ]; then
    PID_8000=$(lsof -t -i:8000)
    if [ ! -z "$PID_8000" ]; then
        echo "🧹 Clearing port 8000 (PID: $PID_8000)..."
        kill -9 $PID_8000 > /dev/null 2>&1
    fi
fi

# --- 5. Start Backend ---
echo "⚡ Starting FastAPI backend..."
"$PYTHON_VENV" -m uvicorn app.main:app --app-dir backend --reload --port 8000 > backend/uvicorn.log 2>&1 &
BACKEND_PID=$!

# --- 6. Frontend Setup & Start ---
if [ ! -d "frontend/node_modules" ]; then
    echo "🎨 Installing frontend dependencies (first time only)..."
    cd frontend && npm install --silent && cd ..
fi

echo "🌐 Starting React frontend..."
export VITE_API_BASE_URL=http://127.0.0.1:8000
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# --- 7. Health Check ---
echo "⌛ Waiting for services to be ready..."
MAX_RETRIES=10
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://127.0.0.1:8000/health > /dev/null; then
        echo "✅ Backend is healthy!"
        break
    fi
    sleep 1
    COUNT=$((COUNT + 1))
done

echo ""
echo "✨ Once-Only Dog Tax Platform is LIVE!"
echo "   - UI: http://localhost:5173"
echo "   - API: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to terminate both servers."

# Trap termination signal
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n🛑 Servers stopped.'; exit" INT

# Keep script alive to maintain background processes
wait
