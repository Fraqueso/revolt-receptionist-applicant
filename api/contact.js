// Vercel Serverless Function - Contact Form API
import axios from 'axios';

// Rate limiting storage (in-memory, will reset on cold start)
// In production, use Redis or similar for persistent storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

function rateLimiter(ip) {
  const now = Date.now();
  
  if (rateLimitStore.has(ip)) {
    const record = rateLimitStore.get(ip);
    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
  
  if (rateLimitStore.has(ip)) {
    const record = rateLimitStore.get(ip);
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limited
    }
    record.count++;
  } else {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
  }
  
  return true; // OK
}

function validateApiKey(req) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true; // Skip if not configured
  
  const providedKey = req.headers['x-api-key'] || req.query?.api_key;
  return providedKey && providedKey === apiKey;
}

function validateHoneypot(body) {
  const honeypotFields = ['website', 'url', 'homepage', 'company_website'];
  for (const field of honeypotFields) {
    if (body[field] && body[field].trim() !== '') {
      return false; // Bot detected
    }
  }
  return true;
}

function sanitize(str) {
  if (!str) return '';
  return String(str).trim().replace(/[<>]/g, '');
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';

  // Rate limiting
  if (!rateLimiter(ip)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  // API key validation (if configured)
  if (!validateApiKey(req)) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  // Validate Content-Type
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ 
      error: 'Invalid Content-Type',
      message: 'Content-Type must be application/json'
    });
  }

  // Honeypot check
  if (!validateHoneypot(req.body)) {
    // Return success to bot (don't let them know they were caught)
    return res.status(200).json({ 
      success: true, 
      message: 'Thank you for your submission' 
    });
  }

  try {
    const {
      phone,
      name,
      email,
      business,
      exampleInformation1,
      exampleInformation2,
      exampleInformation3,
    } = req.body;

    // Validate required fields
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Phone number format validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Email validation (if provided)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Format and sanitize data
    const payload = {
      phone: sanitize(phone),
      name: sanitize(name),
      email: sanitize(email),
      business: sanitize(business),
      exampleInformation1: sanitize(exampleInformation1),
      exampleInformation2: sanitize(exampleInformation2),
      exampleInformation3: sanitize(exampleInformation3),
      timestamp: new Date().toISOString(),
      ip: ip,
    };

    // Forward to n8n webhook asynchronously (fire-and-forget)
    // This allows immediate response to the user while webhook processes in background
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (n8nWebhookUrl) {
      // Call webhook asynchronously without blocking the response
      const cleanWebhookUrl = n8nWebhookUrl.trim();
      console.log('Forwarding to n8n webhook (async):', cleanWebhookUrl);
      
      // Fire and forget - don't await this
      axios.post(cleanWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 second timeout (but won't block response)
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't throw on 4xx errors
        },
        maxRedirects: 5,
        followRedirects: true,
      })
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ Successfully forwarded to n8n webhook');
          console.log('Response status:', response.status);
        } else {
          console.error(`⚠️  Webhook returned non-2xx status: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error('❌ Error forwarding to n8n webhook (async):');
        console.error('Webhook URL:', cleanWebhookUrl);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        if (error.response) {
          console.error('Response status:', error.response.status);
          if (error.response.status === 404) {
            console.error('⚠️  404 Error - Check if n8n workflow is activated');
          }
        }
        if (error.request) {
          console.error('Request was made but no response received');
        }
      });
    } else {
      console.log('N8N_WEBHOOK_URL not configured. Set it in your .env file or environment variables.');
    }

    // Return success response immediately (don't wait for webhook)
    return res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: payload,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

