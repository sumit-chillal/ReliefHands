# Email Notifications Setup Guide

## Current Status
⚠️ **Email notifications are NOT working because the SendGrid API key is incomplete/invalid**

Current key in `.env`: `SG.ZmR8U` (INVALID - too short)

## How to Fix Email Notifications

### Option 1: Get a Valid SendGrid API Key (Recommended)

1. **Sign up for SendGrid** (Free tier available)
   - Go to: https://sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create an API Key**
   - Log in to SendGrid Dashboard
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it: "ReliefHands"
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (it will look like: `SG.xxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`)

3. **Update the Backend .env File**
   ```bash
   # Edit /app/backend/.env
   SENDGRID_API_KEY="SG.your_actual_long_api_key_here"
   FROM_EMAIL="noreply@reliefhands.org"  # Or use your verified sender email
   ```

4. **Verify Sender Email** (Important!)
   - In SendGrid Dashboard → Settings → Sender Authentication
   - Add and verify your sender email (e.g., noreply@yourdomain.com)
   - Or use Single Sender Verification for testing

5. **Restart Backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### Option 2: Use a Different Email Service

If you prefer Gmail, Outlook, or another service, update the `send_email` function in `/app/backend/server.py` to use SMTP instead of SendGrid.

## Email Notification Triggers

The system sends emails for these events:

### 1. **User Registration** ✉️
- **Trigger**: When volunteer registers
- **Recipient**: New volunteer
- **Subject**: "Welcome to Relief Hands!"
- **Content**: Welcome message + account pending verification notice

### 2. **NGO Registration** ✉️
- **Trigger**: When NGO registers
- **Recipient**: NGO email
- **Subject**: "NGO Registration Received"
- **Content**: Registration confirmation + pending admin approval notice

### 3. **Volunteer Verification** ✉️
- **Trigger**: Admin approves/rejects volunteer
- **Recipient**: Volunteer
- **Subject**: "Account Approved" or "Account Rejected"
- **Content**: Approval/rejection status

### 4. **NGO Verification** ✉️
- **Trigger**: Admin approves/rejects NGO
- **Recipient**: NGO email
- **Subject**: "NGO Registration Approved" or "NGO Registration Rejected"
- **Content**: Approval/rejection status

### 5. **Volunteer Request Status** ✉️
- **Trigger**: NGO approves/rejects volunteer application
- **Recipient**: Volunteer
- **Subject**: "Volunteer Request Approved" or "Volunteer Request Rejected"
- **Content**: Campaign name + status

### 6. **New Volunteer Application** ✉️
- **Trigger**: Volunteer applies to campaign
- **Recipient**: NGO email
- **Subject**: "New Volunteer Application"
- **Content**: Volunteer name + campaign title

### 7. **Campaign Completion** ✉️
- **Trigger**: NGO marks campaign as completed
- **Recipient**: All approved volunteers
- **Subject**: "Certificate Available"
- **Content**: Congratulations message + certificate download link

### 8. **Emergency Campaign Approval** ✉️
- **Trigger**: Admin approves/rejects emergency status
- **Recipient**: NGO email
- **Subject**: "Emergency Campaign Approved" or "Emergency Campaign Rejected"
- **Content**: Campaign title + status

### 9. **Google OAuth Registration** ✉️
- **Trigger**: User signs up with Google
- **Recipient**: User's Google email
- **Subject**: "Welcome to Relief Hands!"
- **Content**: Welcome message (account auto-verified)

## Testing Email Notifications

### Without SendGrid (Current State)
The system will log email notifications to the console:
```
⚠️  SendGrid API key not configured or invalid. Email notification skipped.
📧 Would send to user@example.com
📌 Subject: Welcome to Relief Hands!
📄 Content preview: <h2>Welcome...</h2>
```

You can check backend logs:
```bash
tail -f /var/log/supervisor/backend.out.log | grep "📧"
```

### With Valid SendGrid Key
Once configured, you'll see:
```
✅ Email sent successfully to user@example.com, status: 202
```

## Quick Test After Setup

1. Register a new volunteer with your real email
2. Check backend logs:
   ```bash
   tail -20 /var/log/supervisor/backend.out.log
   ```
3. Check your email inbox (and spam folder!)

## Troubleshooting

**Problem**: "Sender email not verified"
- **Solution**: Verify your sender email in SendGrid Dashboard

**Problem**: Emails going to spam
- **Solution**: 
  - Use verified domain
  - Add SPF/DKIM records
  - Use professional email content

**Problem**: "401 Unauthorized"
- **Solution**: API key is invalid, regenerate in SendGrid

**Problem**: "403 Forbidden"
- **Solution**: API key doesn't have Mail Send permissions

## Alternative: Mock Email Server for Testing

For local testing without SendGrid:
```bash
# Install mailhog (optional)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Update server.py to use SMTP on port 1025
# View emails at http://localhost:8025
```

---

## Current State Summary

✅ **All email triggers are implemented and working**
❌ **SendGrid API key is invalid/incomplete**
⚠️ **Emails will be logged to console but NOT sent to actual email addresses**

**To fix**: Follow "Option 1" above to get a valid SendGrid API key.
