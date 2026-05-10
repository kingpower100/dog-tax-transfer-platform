#!/bin/bash

# Once-Only Dog Tax Transfer Platform - Start Script

echo "🚀 Starting Once-Only Dog Tax Transfer Platform..."

# 1. Setup Backend
echo "📦 Setting up backend..."
cd backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d ".venv_linux" ]; then
    source .venv_linux/bin/activate
else
    python3 -m venv .venv_linux
    source .venv_linux/bin/activate
fi
pip install -q -r requirements.txt

# 2. Initialize Database
echo "🗄️ Initializing and seeding database..."
python -m app.seed --reset
python -m app.import_csv --file data/example_data.csv

# 3. Start Backend in background
echo "⚡ Starting FastAPI backend on http://127.0.0.1:8000..."
uvicorn app.main:app --reload --port 8000 > uvicorn.log 2>&1 &
BACKEND_PID=$!

# 4. Setup Frontend
echo "🎨 Setting up frontend..."
cd ../frontend
npm install --silent

# 5. Start Frontend
echo "🌐 Starting React frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Platform is running!"
echo "   - Backend: http://127.0.0.1:8000"
echo "   - Frontend: http://localhost:5173"
echo "   - Documentation: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill background processes
trap "kill $BACKEND_PID $FRONTEND_PID; echo '🛑 Servers stopped.'; exit" INT
wait
