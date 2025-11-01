# API Endpoint Setup for n8n Integration

This guide explains how to set up the API endpoints to connect your contact form to n8n.

## Overview

The contact form on the final slide submits data to a backend API endpoint, which can forward the data to your n8n webhook. All form fields are available as mappable endpoints in n8n.

## Available Fields

The API endpoint provides the following mappable fields for n8n:

- `phone` - Phone number (required)
- `name` - Name
- `email` - Email address
- `business` - Business name
- `exampleInformation1` - First example information field
- `exampleInformation2` - Second example information field
- `exampleInformation3` - Third example information field
- `timestamp` - ISO timestamp of submission

## Setup Instructions

### 1. Install Dependencies

```bash
cd react-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# For React app
REACT_APP_API_URL=http://localhost:3001

# For backend server (n8n webhook)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# Server port (optional)
PORT=3001
```

### 3. Get Your n8n Webhook URL

1. Open your n8n workflow
2. Add or select a **Webhook** node
3. Configure it as a **POST** webhook
4. Copy the webhook URL (it will look like: `https://your-n8n-instance.com/webhook/abc123`)
5. Paste it into your `.env` file as `N8N_WEBHOOK_URL`

### 4. Start the Servers

You have two options:

#### Option A: Run both servers together (recommended for development)
```bash
npm run dev
```
This starts both the backend server (port 3001) and React app (port 3000) simultaneously.

#### Option B: Run servers separately

Terminal 1 - Backend Server:
```bash
npm run server
```

Terminal 2 - React App:
```bash
npm start
```

### 5. Test the Endpoint

#### Test the API endpoint directly:
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "business": "Example Corp",
    "exampleInformation1": "Info 1",
    "exampleInformation2": "Info 2",
    "exampleInformation3": "Info 3"
  }'
```

#### Test via the form:
1. Navigate to `http://localhost:3000` in your browser
2. Scroll to the contact form (last slide)
3. Fill out the form and submit
4. Check your n8n workflow to see the incoming data

## API Endpoint Details

### POST `/api/contact`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "business": "Example Corp",
  "exampleInformation1": "First example",
  "exampleInformation2": "Second example",
  "exampleInformation3": "Third example"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "phone": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "business": "Example Corp",
    "exampleInformation1": "First example",
    "exampleInformation2": "Second example",
    "exampleInformation3": "Third example",
    "timestamp": "2025-11-01T18:00:00.000Z"
  }
}
```

## n8n Workflow Setup

### Step 1: Create a Webhook Node

1. Add a **Webhook** node to your workflow
2. Set method to **POST**
3. Copy the webhook URL and add it to your `.env` file

### Step 2: Map the Fields

In n8n, you can map the incoming data:
- `{{$json.phone}}` - Phone number
- `{{$json.name}}` - Name
- `{{$json.email}}` - Email
- `{{$json.business}}` - Business
- `{{$json.exampleInformation1}}` - Example info 1
- `{{$json.exampleInformation2}}` - Example info 2
- `{{$json.exampleInformation3}}` - Example info 3
- `{{$json.timestamp}}` - Timestamp

### Step 3: Add Subsequent Nodes

After the webhook, you can add any n8n nodes you need:
- **Twilio** - To make phone calls
- **Email** - To send confirmation emails
- **CRM** - To save to HubSpot, Salesforce, etc.
- **Google Sheets** - To log submissions
- Any other automation you need!

## Troubleshooting

### Server not connecting
- Make sure the backend server is running on port 3001
- Check that `REACT_APP_API_URL` in `.env` matches the server URL
- Restart both servers after changing environment variables

### n8n not receiving data
- Verify `N8N_WEBHOOK_URL` is correctly set in your `.env` file
- Check n8n webhook node is set to POST method
- Check server logs for error messages
- Test the webhook URL directly with curl or Postman

### CORS errors
- The server already includes CORS middleware
- If issues persist, check that both servers are running

## Production Deployment

For production:
1. Update `REACT_APP_API_URL` to point to your production API
2. Set `N8N_WEBHOOK_URL` to your production n8n instance
3. Deploy the backend server separately or use serverless functions
4. Build the React app: `npm run build`

