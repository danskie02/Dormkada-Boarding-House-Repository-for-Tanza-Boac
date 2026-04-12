# SendGrid Email Setup Guide

This document provides complete instructions for setting up SendGrid email notifications for reservation status updates in the Dorm Finder application.

## Overview

The Dorm Finder application now sends email notifications to students when their reservation status changes. The following events trigger emails:

- **Reservation Accepted**: Student is notified when their reservation is accepted by the owner
- **Reservation Rejected**: Student is notified when their reservation is rejected
- **Reservation Expired**: Student is notified when their reservation expires (24-hour pending period elapses)

## Prerequisites

- A SendGrid account (free tier available at https://sendgrid.com/)
- API key from SendGrid
- Node.js and npm/pnpm installed

## Setup Instructions

### 1. Create a SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for a free account
3. Complete email verification

### 2. Generate SendGrid API Key

1. Log in to your SendGrid account
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose "Full Access" (or customize permissions as needed)
5. Give it a name like "Dorm Finder API Key"
6. Copy the generated API key (you'll only see it once)

### 3. Update Environment Variables

In the `.env` file in your project root, add or update the following:

```env
SENDGRID_API_KEY=your_actual_api_key_from_sendgrid
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Important**: 
- Replace `your_actual_api_key_from_sendgrid` with your actual API key
- Replace `yourdomain.com` with your domain. For testing, you can use a SendGrid test email address
- **Never commit the API key to version control**

### 4. Install Dependencies

Since the project uses pnpm workspaces, install dependencies:

```bash
npm exec pnpm -- install
```

Or if you have pnpm installed globally:

```bash
pnpm install
```

### 5. Verify Sender Email (Important)

For production, you'll need to verify the sender email:

1. Go to SendGrid Dashboard → **Settings** → **Sender Authentication**
2. Complete domain authentication or single sender verification
3. This prevents emails from going to spam folder

For testing, SendGrid provides a test email: `test@example.com`

## Implementation Details

### Email Service (`artifacts/api-server/src/lib/email-service.ts`)

The email service module provides:

- `sendEmail(options)` - Generic email sending function
- `sendReservationAcceptedEmail()` - Send acceptance notification
- `sendReservationRejectedEmail()` - Send rejection notification  
- `sendReservationExpiredEmail()` - Send expiration notification

### HTTP Endpoints

#### Accept Reservation
- **Route**: `POST /reservations/:id/accept`
- **Trigger**: Automatically sends acceptance email to student
- **Email Include**: Room name, boarding house name

#### Reject Reservation
- **Route**: `POST /reservations/:id/reject`
- **Optional**: Include reason in request body
- **Trigger**: Automatically sends rejection email to student
- **Email Include**: Room name, boarding house name, optional rejection reason

#### List Reservations
- **Route**: `GET /reservations`
- **Trigger**: Automatically sends expiration emails for pending reservations over 24 hours old
- **Email Include**: Room name, boarding house name

## Email Templates

The email service includes pre-designed HTML templates for:

1. **Acceptance Email**
   - Success message with green accent
   - Room and boarding house details
   - Call-to-action to view account

2. **Rejection Email**
   - Professional notification with orange/warning accent
   - Room and boarding house details
   - Optional rejection reason
   - Encouragement to browse other listings

3. **Expiration Email**
   - Notification with red accent
   - Reservation details
   - Explanation that room is now available
   - Invitation to make new reservations

## Testing

### Local Testing

1. Update `.env` with your SendGrid API key
2. Use SendGrid's test email: `test@example.com` as recipient
3. Start the API server:
   ```bash
   cd artifacts/api-server
   npm run dev
   ```
4. Make API requests to test endpoints

### Sandbox Mode (Optional)

For testing without sending real emails, modify `email-service.ts`:

```typescript
const sendGridApiKey = process.env.SENDGRID_API_KEY;
const SANDBOX_MODE = process.env.EMAIL_SANDBOX_MODE === "true";

export async function sendEmail(email: EmailOptions): Promise<void> {
  if (SANDBOX_MODE) {
    console.log("SANDBOX: Would send email to", email.to);
    console.log("Subject:", email.subject);
    return;
  }
  // ... rest of implementation
}
```

Then in `.env`:
```env
EMAIL_SANDBOX_MODE=true
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `SENDGRID_API_KEY` is correct in `.env`
2. **Check Email Permissions**: Ensure API key has "Mail Send" permission
3. **Check Sender Email**: Verify `SENDGRID_FROM_EMAIL` is verified in SendGrid
4. **Check Server Logs**: Look for error messages in the API server logs
5. **Test Connection**: Use the SendGrid test email first

### Emails Going to Spam

1. **Verify Domain**: Complete domain authentication in SendGrid
2. **Check Headers**: Ensure DKIM and SPF are properly configured
3. **Avoid Spam Words**: Keep email content professional
4. **Monitor Bounces**: Check SendGrid dashboard for bounced emails

### Student Email Not Found

- Ensure student records have valid email addresses in the database
- Check user creation process includes email validation

## Production Considerations

1. **Domain Authentication**: Set up proper SPF and DKIM records
2. **Email Validation**: Implement email validation in user registration
3. **Rate Limiting**: Consider adding rate limiting for email sends
4. **Error Handling**: Implement retry logic for failed sends
5. **Logging**: Log all email attempts for debugging
6. **Unsubscribe Links**: Add unsubscribe functionality for compliance

## Future Enhancements

- Add email templates to database for customization
- Implement email queuing for better reliability
- Add email read tracking
- Support for HTML and text-only variants
- Localization support for different languages
- Scheduled email reminders

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [SendGrid Best Practices](https://sendgrid.com/blog/email-best-practices/)

## Support

For issues with SendGrid integration:
1. Check SendGrid documentation: https://docs.sendgrid.com/
2. View SendGrid Activity Monitor for email logs
3. Check application logs for errors
