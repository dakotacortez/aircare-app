#!/bin/bash

# Test FCM token registration endpoint
# Usage: ./test-fcm-endpoint.sh <your-payload-token>

if [ -z "$1" ]; then
  echo "Usage: $0 <payload-token>"
  echo "Get your token from browser cookies (payload-token)"
  exit 1
fi

TOKEN=$1

echo "Testing FCM token registration..."
echo ""

# Test POST (register token)
echo "1. Registering test token..."
curl -X POST http://localhost:3000/api/users/me/fcmTokens \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=$TOKEN" \
  -d '{
    "token": "test-fcm-token-12345",
    "platform": "android"
  }' \
  -v

echo ""
echo ""
echo "2. Check your user record at http://localhost:3000/admin/collections/users/1"
echo "   You should see the test token in fcmTokens array"
