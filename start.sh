#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Image Generation Studio...${NC}"
echo ""

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${GREEN}📡 Starting backend server...${NC}"
cd apps/server
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo -e "${GREEN}🎨 Starting frontend server...${NC}"
cd ../web
npm run dev &
FRONTEND_PID=$!

# Wait for both to be ready
sleep 3

echo ""
echo -e "${BLUE}✅ Both servers are running!${NC}"
echo -e "${GREEN}📡 Backend API: http://localhost:3001${NC}"
echo -e "${GREEN}🎨 Frontend App: http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for user to stop
wait
