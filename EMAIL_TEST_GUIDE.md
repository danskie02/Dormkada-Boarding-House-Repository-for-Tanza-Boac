
# Email Testing Guide for Dorm Finder

## Test Steps

### 1. Verify API is running
```
http://localhost:3002/api/health
```

### 2. Create test student account (if needed)
```
POST http://localhost:3002/api/auth/register
Content-Type: application/json

{
  "email": "teststudent@example.com",
  "fullName": "Test Student",
  "password": "TestPassword123!",
  "role": "student"
}
```

### 3. Create test owner account (if needed)
```
POST http://localhost:3002/api/auth/register
Content-Type: application/json

{
  "email": "testowner@example.com",
  "fullName": "Test Owner",
  "password": "TestPassword123!",
  "role": "owner"
}
```

### 4. Login and get JWT token
```
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "email": "teststudent@example.com",
  "password": "TestPassword123!"
}
```
Response will include a JWT token in Authorization header.

### 5. Create a test boarding house (as owner)
```
POST http://localhost:3002/api/boarding-houses
Content-Type: application/json
Authorization: Bearer <OWNER_JWT_TOKEN>

{
  "name": "Test Boarding House",
  "description": "A test boarding house",
  "location": "123 Test St",
  "totalRooms": 5
}
```

### 6. Create a test room
```
POST http://localhost:3002/api/rooms
Content-Type: application/json
Authorization: Bearer <OWNER_JWT_TOKEN>

{
  "boardingHouseId": 1,
  "name": "Test Room 101",
  "price": 5000,
  "capacity": 2,
  "availableSlots": 2,
  "amenities": "WiFi, AC, Bed",
  "status": "available"
}
```

### 7. Create a reservation (as student)
```
POST http://localhost:3002/api/reservations
Content-Type: application/json
Authorization: Bearer <STUDENT_JWT_TOKEN>

{
  "roomId": 1
}
```

### 8. Accept reservation (as owner) - THIS TRIGGERS THE EMAIL
```
POST http://localhost:3002/api/reservations/<RESERVATION_ID>/accept
Authorization: Bearer <OWNER_JWT_TOKEN>
```

Expected Result:
- API returns 200 OK
- Email is sent to teststudent@example.com
- Email contains: Room name, Boarding house name

### 9. Check SendGrid Activity Monitor
1. Go to https://app.sendgrid.com/
2. Login with your SendGrid account
3. Navigate to **Activity Monitor** or **Mail Activity**
4. Look for emails sent from `danskien31@gmail.com`
5. Verify the email was delivered to `teststudent@example.com`

## Expected Email Content

**Subject:** Your Dorm Finder Reservation Has Been Accepted! ✅

**Body includes:**
- Greeting with student name
- Room name (e.g., "Test Room 101")
- Boarding house name (e.g., "Test Boarding House")
- Professional formatting with green accent color
- Call-to-action to view account details

## Troubleshooting

### Email not sending?
1. Check SendGrid API key is correct in .env
2. Verify SENDGRID_FROM_EMAIL is set
3. Check API server logs for errors
4. Verify student email exists in database
5. Check SendGrid Activity Monitor for bounce/reject messages

### Email going to spam?
1. Verify sender email in SendGrid (domain authentication)
2. Check email content for spam keywords
3. Enable domain authentication in SendGrid

### API not responding?
1. Check API is running: `netstat -ano | findstr :3002`
2. Verify .env PORT is set to 3002 (or matching port)
3. Check API logs for errors

## Quick Test with cURL

```bash
# Health check
curl http://localhost:3002/api/health

# Create student
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "fullName": "Test Student",
    "password": "TestPassword123!",
    "role": "student"
  }'
```

## SendGrid Configuration

Current Configuration in `.env`:
- **SENDGRID_API_KEY**: Configured ✓
- **SENDGRID_FROM_EMAIL**: danskien31@gmail.com

Email sending is **async and non-blocking**, so:
- API response returns immediately
- Email is sent in background
- Errors are logged but don't block the request

