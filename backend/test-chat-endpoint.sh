#!/bin/bash

# Test script for the chat endpoint
# This script tests the chat endpoint structure without requiring a real API key

echo "Testing Chat Endpoint..."
echo ""

# Test 1: Health check endpoint
echo "1. Testing health check endpoint..."
curl -s http://localhost:3001/api/v1/chat/health | jq '.' || echo "Server not running or endpoint not available"
echo ""

# Test 2: POST /message endpoint structure (will fail without API key, but tests routing)
echo "2. Testing message endpoint structure (expecting validation error)..."
curl -s -X POST http://localhost:3001/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "Server not running or endpoint not available"
echo ""

echo "Test complete!"
echo ""
echo "To fully test the endpoint, you need to:"
echo "1. Add GOOGLE_GEMINI_API_KEY to backend/.env"
echo "2. Start the backend server: cd backend && npm run dev"
echo "3. Send a proper request with all required fields"