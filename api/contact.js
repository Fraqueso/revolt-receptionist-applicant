// Vercel Serverless Function - Contact Form API
const axios = require('axios');

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

module.exports = async function handler(req, res) {
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

    // Forward to n8n webhook - wait with timeout to catch errors immediately
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    let webhookError = null;
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (n8nWebhookUrl) {
      const cleanWebhookUrl = n8nWebhookUrl.trim();
      console.log('🔔 Forwarding to n8n webhook:', cleanWebhookUrl);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      
      try {
        // Wait for webhook with timeout to catch errors immediately
        const webhookPromise = axios.post(cleanWebhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000, // 10 second timeout - enough time to detect most errors
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Don't throw on 4xx errors
          },
          maxRedirects: 5,
          followRedirects: true,
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Webhook timeout - processing in background')), 8000)
        );
        
        const response = await Promise.race([webhookPromise, timeoutPromise]);
        
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ Successfully forwarded to n8n webhook');
          console.log('Response status:', response.status);
        } else {
          console.error(`⚠️  Webhook returned non-2xx status: ${response.status}`);
          webhookError = { status: response.status, error: 'Non-2xx response' };
        }
      } catch (error) {
        // If timeout, webhook is still processing in background, but log the attempt
        if (error.message && error.message.includes('timeout')) {
          console.log('⏱️  Webhook request taking longer than expected, continuing in background...');
          // Continue processing - don't block the response
        } else {
          console.error('❌ Error forwarding to n8n webhook:');
          console.error('Webhook URL:', cleanWebhookUrl);
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            if (error.response.status === 404) {
              console.error('⚠️  404 Error - This usually means:');
              console.error('   1. The n8n workflow is not activated (check n8n dashboard)');
              console.error('   2. The webhook URL is incorrect');
              console.error('   3. The webhook path/ID has changed');
            }
            webhookError = { 
              status: error.response.status, 
              error: error.message,
              details: error.response.status === 404 ? 'Workflow may not be activated' : undefined
            };
          } else if (error.request) {
            console.error('⚠️  Request was made but no response received');
            console.error('   This could mean:');
            console.error('   1. The webhook URL is unreachable');
            console.error('   2. Network connectivity issues');
            console.error('   3. Firewall blocking the request');
            webhookError = { 
              error: 'No response from webhook',
              details: 'Check webhook URL accessibility'
            };
          } else {
            webhookError = { 
              error: error.message 
            };
          }
        }
      }
      
      // If webhook failed, also start background retry (fire and forget)
      if (webhookError && !webhookError.error.includes('timeout')) {
        console.log('🔄 Attempting background retry...');
        axios.post(cleanWebhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
          validateStatus: () => true, // Accept any status for background retry
        })
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            console.log('✅ Background retry successful');
          }
        })
        .catch(() => {
          // Silently fail background retry
        });
      }
    } else {
      console.log('⚠️  N8N_WEBHOOK_URL not configured. Set it in your .env file or environment variables.');
      webhookError = { 
        error: 'N8N_WEBHOOK_URL environment variable not set',
        details: 'Add N8N_WEBHOOK_URL to your .env file or Vercel environment variables'
      };
    }

    // Return response with webhook error info (if any) for debugging
    const responseData = {
      success: true,
      message: 'Contact form submitted successfully',
      data: payload,
    };
    
    // Include webhook error in dev mode for debugging
    if (isDev && webhookError) {
      responseData.webhookError = webhookError;
    }
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

