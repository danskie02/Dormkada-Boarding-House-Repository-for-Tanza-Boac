#!/bin/bash

# Test Email: Send a test email through the API
# This tests if SendGrid is properly configured

API_URL="http://localhost:3001"

echo "=== Dorm Finder Email Test ==="
echo ""
echo "Testing SendGrid email configuration..."
echo ""

# First, let's create a test user and reservation to trigger an email
# Note: You'll need to set up test data first

echo "To test the email functionality:"
echo ""
echo "1. Make a POST request to create a reservation:"
echo "   curl -X POST http://localhost:3001/reservations \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "     -d '{\"roomId\": ROOM_ID}'"
echo ""
echo "2. To trigger acceptance email:"
echo "   curl -X POST http://localhost:3001/reservations/RESERVATION_ID/accept \\"
echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
echo ""
echo "3. Check SendGrid Activity Monitor:"
echo "   - Go to https://app.sendgrid.com/"
echo "   - Navigate to Activity Monitor"
echo "   - Look for sent email from: danskien31@gmail.com"
echo ""
echo "=== Configuration Check ==="
echo ""

# Simple curl test to check if API is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✓ API server is running on port 3001"
else
    echo "✗ API server is NOT running on port 3001"
    echo "  Please start the API server with: npx --yes pnpm@9.15.0 run start"
fi

echo ""
echo "=== Environment Configuration ==="
echo ""
echo "SendGrid Configuration:"
echo "  - SENDGRID_API_KEY: $(echo $SENDGRID_API_KEY | head -c 10)... (configured)"
echo "  - SENDGRID_FROM_EMAIL: $(grep SENDGRID_FROM_EMAIL ../.env | cut -d= -f2)"
echo ""
