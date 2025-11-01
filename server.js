require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting storage (in-memory for simplicity, use Redis for production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per window per IP

// Simple rate limiting middleware
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  if (rateLimitStore.has(ip)) {
    const record = rateLimitStore.get(ip);
    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
  
  // Check rate limit
  if (rateLimitStore.has(ip)) {
    const record = rateLimitStore.get(ip);
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
      const resetTime = Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000);
      console.warn(`⚠️  Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ 
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${resetTime} seconds.`,
        retryAfter: resetTime
      });
    }
    record.count++;
  } else {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
  }
  
  next();
}

// CORS configuration - allow only specific origins in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) - useful for testing
    // In production, you should restrict this
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }
    
    // In production, check against allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Trust proxy for accurate IP addresses (important for rate limiting behind reverse proxies)
app.set('trust proxy', true);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API key validation middleware (optional - enable if API_KEY is set)
function validateApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  
  // Skip validation if no API key is configured
  if (!apiKey) {
    return next();
  }
  
  // Check for API key in header or query parameter
  const providedKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!providedKey || providedKey !== apiKey) {
    console.warn(`⚠️  Invalid API key attempt from IP: ${req.ip || 'unknown'}`);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }
  
  next();
}

// Honeypot validation (detects bots)
function validateHoneypot(req, res, next) {
  // Check for common bot honeypot fields
  const honeypotFields = ['website', 'url', 'homepage', 'company_website'];
  
  for (const field of honeypotFields) {
    if (req.body[field] && req.body[field].trim() !== '') {
      console.warn(`⚠️  Honeypot triggered: ${field} was filled. Likely a bot. IP: ${req.ip || 'unknown'}`);
      // Return success to bot (don't let them know they were caught)
      return res.status(200).json({ 
        success: true, 
        message: 'Thank you for your submission' 
      });
    }
  }
  
  next();
}

// Request validation middleware
function validateRequest(req, res, next) {
  // Validate Content-Type
  if (req.get('Content-Type') !== 'application/json') {
    return res.status(400).json({ 
      error: 'Invalid Content-Type',
      message: 'Content-Type must be application/json'
    });
  }
  
  // Validate request body size (max 10KB)
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10 * 1024) {
    return res.status(413).json({ 
      error: 'Payload too large',
      message: 'Request body exceeds maximum size of 10KB'
    });
  }
  
  next();
}

// API endpoint for contact form submission
// This endpoint receives form data and forwards it to n8n webhook
app.post('/api/contact', 
  rateLimiter,           // Rate limiting
  validateRequest,        // Request validation
  validateHoneypot,      // Honeypot check
  validateApiKey,         // API key validation (if configured)
  async (req, res) => {
  try {
    console.log('Received POST /api/contact request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
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
    
    // Additional validation: phone number format (basic check)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone.trim())) {
      console.warn(`⚠️  Invalid phone format from IP: ${req.ip || 'unknown'}`);
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Email validation (if provided)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    // Sanitize inputs (basic XSS prevention)
    const sanitize = (str) => {
      if (!str) return '';
      return str.trim().replace(/[<>]/g, '');
    };

    // Format data for n8n compatibility - all fields are mappable in n8n
    const payload = {
      phone: sanitize(phone),
      name: sanitize(name),
      email: sanitize(email),
      business: sanitize(business),
      exampleInformation1: sanitize(exampleInformation1),
      exampleInformation2: sanitize(exampleInformation2),
      exampleInformation3: sanitize(exampleInformation3),
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
    };

    // Forward to n8n webhook if configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    let webhookError = null;
    
    if (n8nWebhookUrl) {
      try {
        // Clean the webhook URL (remove any trailing whitespace or issues)
        const cleanWebhookUrl = n8nWebhookUrl.trim();
        console.log('Forwarding to n8n webhook:', cleanWebhookUrl);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('Request headers:', {
          'Content-Type': 'application/json',
          'User-Agent': 'node-axios'
        });
        
        const response = await axios.post(cleanWebhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 second timeout
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Don't throw on 4xx errors
          },
          maxRedirects: 5,
          followRedirects: true,
        });
        
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ Successfully forwarded to n8n webhook');
          console.log('Response status:', response.status);
          if (response.data) {
            console.log('Response data:', JSON.stringify(response.data, null, 2));
          }
        } else {
          // Treat non-2xx responses as errors
          throw {
            response: response,
            message: `Request failed with status code ${response.status}`,
            isAxiosError: true
          };
        }
      } catch (error) {
        webhookError = error;
        console.error('❌ Error forwarding to n8n webhook:');
        console.error('Webhook URL:', n8nWebhookUrl);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response status text:', error.response.statusText);
          console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
          
          // Provide helpful message for 404
          if (error.response.status === 404) {
            console.error('⚠️  404 Error - This usually means:');
            console.error('   1. The n8n workflow is not activated (make sure to click "Activate" in n8n)');
            console.error('   2. The webhook URL is incorrect');
            console.error('   3. The webhook path/ID has changed');
            console.error('   Check your n8n workflow and ensure it is activated with the correct webhook URL.');
          }
        }
        if (error.request) {
          console.error('Request was made but no response received');
          console.error('Request details:', {
            url: n8nWebhookUrl,
            timeout: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Connection error'
          });
        }
        if (error.code === 'ECONNREFUSED') {
          console.error('Connection refused - check if n8n webhook URL is correct and accessible');
        }
      }
    } else {
      console.log('N8N_WEBHOOK_URL not configured. Set it in your .env file or environment variables.');
      webhookError = { message: 'Webhook URL not configured' };
    }

    // Log the submission
    console.log('Contact form submission:', payload);

    // Return response with webhook status
    if (webhookError) {
      // Format error details properly
      let errorDetails = 'Configuration error';
      if (webhookError.response) {
        // Server responded with error
        const responseData = webhookError.response.data;
        if (typeof responseData === 'object' && responseData !== null) {
          errorDetails = JSON.stringify(responseData);
        } else if (responseData) {
          errorDetails = String(responseData);
        } else {
          errorDetails = `HTTP ${webhookError.response.status} ${webhookError.response.statusText || ''}`;
        }
      } else if (webhookError.request) {
        errorDetails = 'No response from webhook server';
      }
      
      return res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully, but webhook failed',
        data: payload,
        webhookError: {
          message: webhookError.message || 'Webhook request failed',
          details: errorDetails,
          status: webhookError.response?.status,
          webhookUrl: n8nWebhookUrl
        },
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: payload,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint - inform about API usage
app.get('/', (req, res) => {
  res.json({ 
    message: 'This is the API server. The React app should be running on port 3000.',
    endpoints: {
      'POST /api/contact': 'Submit contact form',
      'GET /api/health': 'Health check'
    },
    reactApp: 'http://localhost:3000'
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  console.error(`⚠️  404 - Route not found: ${req.method} ${req.path}`);
  console.error('Available routes: POST /api/contact, GET /api/health');
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path,
    availableRoutes: ['POST /api/contact', 'GET /api/health']
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('\n📋 Configuration:');
  if (process.env.N8N_WEBHOOK_URL) {
    console.log(`✅ n8n webhook configured: ${process.env.N8N_WEBHOOK_URL}`);
    console.log(`   (Trimmed: ${process.env.N8N_WEBHOOK_URL.trim()})`);
  } else {
    console.log('⚠️  N8N_WEBHOOK_URL not configured. Set it in your .env file.');
    console.log('   Example: N8N_WEBHOOK_URL=https://launchos.app.n8n.cloud/webhook/local-host-website-to-trigger-call');
  }
  console.log('\n🔒 Security Features:');
  console.log(`  ✅ Rate limiting: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW / 1000 / 60} minutes per IP`);
  console.log(`  ✅ CORS: ${process.env.ALLOWED_ORIGINS ? `Restricted to: ${process.env.ALLOWED_ORIGINS}` : 'Open (set ALLOWED_ORIGINS for production)'}`);
  console.log(`  ✅ API Key: ${process.env.API_KEY ? 'Enabled (configured)' : 'Disabled (set API_KEY to enable)'}`);
  console.log(`  ✅ Honeypot: Enabled (detects bots)`);
  console.log(`  ✅ Request validation: Enabled`);
  console.log(`  ✅ Security headers: Enabled`);
  console.log('\nRoutes registered:');
  console.log('  POST /api/contact - Contact form submission (protected)');
  console.log('  GET  /api/health - Health check');
});

