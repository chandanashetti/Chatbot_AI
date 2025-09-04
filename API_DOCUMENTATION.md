# Chatbot AI Platform - API Documentation

## Overview

This document provides comprehensive API documentation for the Chatbot AI Platform. The platform provides bot management, agent handling, analytics, and real-time chat capabilities.

**Base URL:** `http://localhost:5000` (Development) / `https://your-domain.com` (Production)

**API Version:** v1

**Authentication:** JWT Bearer Token (where applicable)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Bot Management](#bot-management)
3. [Agent Management](#agent-management)
4. [Handoff Requests](#handoff-requests)
5. [Analytics](#analytics)
6. [Chat & Widget](#chat--widget)
7. [Knowledge Base](#knowledge-base)
8. [Settings](#settings)
9. [WebSocket Events](#websocket-events)
10. [Error Codes](#error-codes)
11. [Rate Limiting](#rate-limiting)

---

## Authentication

### Headers Required
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### User Roles
- `superadmin` - Full system access
- `admin` - Administrative access
- `manager` - Management operations
- `operator` - Operational tasks
- `viewer` - Read-only access
- `agent` - Agent-specific operations

---

## Bot Management

### Get All Bots
```http
GET /api/bots
```

**Query Parameters:**
- `status` (optional): `draft`, `active`, `inactive`, `archived`
- `search` (optional): Search term for bot name/description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "bots": [
      {
        "_id": "bot_id",
        "name": "Customer Support Bot",
        "description": "Handles customer inquiries",
        "status": "active",
        "isPublished": true,
        "createdAt": "2025-01-01T00:00:00Z",
        "analytics": {
          "totalQueries": 1247,
          "successRate": 0.85,
          "avgResponseTime": 2.3
        }
      }
    ],
    "totalCount": 5,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

### Get Bot by ID
```http
GET /api/bots/:id
```

### Create Bot
```http
POST /api/bots
```

**Request Body:**
```json
{
  "name": "New Bot",
  "description": "Bot description",
  "settings": {
    "personality": {
      "tone": "professional",
      "style": "conversational"
    },
    "capabilities": ["text", "files"],
    "maxTokens": 4000
  },
  "flow": {
    "nodes": [],
    "connections": []
  }
}
```

### Update Bot
```http
PUT /api/bots/:id
```

### Publish Bot
```http
POST /api/bots/:id/publish
```

**Response:**
```json
{
  "success": true,
  "message": "Bot published successfully",
  "data": {
    "bot": { /* bot object */ },
    "deploymentUrl": "https://your-domain.com/widget.js?botId=bot_id"
  }
}
```

### Unpublish Bot
```http
POST /api/bots/:id/unpublish
```

### Delete Bot
```http
DELETE /api/bots/:id
```

---

## Agent Management

### Get All Agents
```http
GET /api/agents
```

**Query Parameters:**
- `status` (optional): `available`, `busy`, `offline`, `break`
- `search` (optional): Search by name or email
- `skills` (optional): Filter by skills (comma-separated)
- `departments` (optional): Filter by departments

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "_id": "agent_id",
        "name": "Sarah Johnson",
        "email": "sarah@company.com",
        "phone": "+1-555-0123",
        "status": "available",
        "availability": {
          "isOnline": true,
          "lastSeen": "2025-01-01T12:00:00Z",
          "maxConcurrentChats": 5
        },
        "metrics": {
          "totalChatsHandled": 127,
          "activeChats": 2,
          "averageResponseTime": 2.5,
          "customerSatisfactionScore": 4.3,
          "ratingsCount": 45
        },
        "skills": ["technical", "billing"],
        "departments": ["support", "sales"]
      }
    ],
    "totalCount": 10
  }
}
```

### Get Available Agents
```http
GET /api/agents/available
```

### Get Agent by ID
```http
GET /api/agents/:id
```

### Create Agent
```http
POST /api/agents
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+1-555-0124",
  "skills": ["technical", "sales"],
  "departments": ["support"],
  "availability": {
    "maxConcurrentChats": 3
  }
}
```

### Update Agent
```http
PUT /api/agents/:id
```

### Update Agent Status
```http
PATCH /api/agents/:id/status
```

**Request Body:**
```json
{
  "status": "available"
}
```

### Update Agent Availability
```http
PATCH /api/agents/:id/availability
```

**Request Body:**
```json
{
  "isOnline": true,
  "maxConcurrentChats": 5
}
```

### Get Agent Statistics
```http
GET /api/agents/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalChatsHandled": 127,
    "activeChats": 2,
    "averageResponseTime": 2.5,
    "customerSatisfactionScore": 4.3,
    "ratingsCount": 45,
    "todayStats": {
      "chatsHandled": 8,
      "avgResponseTime": 2.1
    }
  }
}
```

### Deactivate Agent
```http
DELETE /api/agents/:id
```

---

## Handoff Requests

### Get All Handoff Requests
```http
GET /api/handoffs
```

**Query Parameters:**
- `status` (optional): `pending`, `assigned`, `accepted`, `declined`, `completed`
- `priority` (optional): `low`, `medium`, `high`, `critical`
- `agentId` (optional): Filter by assigned agent
- `platform` (optional): `web`, `whatsapp`, `facebook`

**Response:**
```json
{
  "success": true,
  "data": {
    "handoffs": [
      {
        "_id": "handoff_id",
        "conversationId": "conv_123",
        "userId": "user_456",
        "userName": "John Customer",
        "platform": "web",
        "reason": "Complex billing inquiry",
        "category": "billing",
        "priority": "high",
        "status": "pending",
        "aiConfidence": 0.3,
        "queuePosition": 1,
        "estimatedWaitTime": 5,
        "assignedAgent": null,
        "createdAt": "2025-01-01T12:00:00Z",
        "notes": []
      }
    ],
    "totalCount": 3
  }
}
```

### Get Handoff Queue
```http
GET /api/handoffs/queue
```

### Get Handoff by ID
```http
GET /api/handoffs/:id
```

### Create Handoff Request
```http
POST /api/handoffs
```

**Request Body:**
```json
{
  "conversationId": "conv_123",
  "userId": "user_456",
  "userName": "John Customer",
  "platform": "web",
  "reason": "Need human assistance with billing",
  "category": "billing",
  "priority": "medium",
  "aiConfidence": 0.2
}
```

### Assign Handoff
```http
POST /api/handoffs/:id/assign
```

**Request Body:**
```json
{
  "agentId": "agent_id"
}
```

### Accept Handoff
```http
POST /api/handoffs/:id/accept
```

**Request Body:**
```json
{
  "agentId": "agent_id"
}
```

### Decline Handoff
```http
POST /api/handoffs/:id/decline
```

**Request Body:**
```json
{
  "agentId": "agent_id",
  "reason": "Not available"
}
```

### Complete Handoff
```http
POST /api/handoffs/:id/complete
```

**Request Body:**
```json
{
  "agentId": "agent_id",
  "resolution": {
    "wasResolved": true,
    "satisfactionScore": 5,
    "resolutionTime": 300,
    "summary": "Issue resolved successfully"
  }
}
```

### Escalate Handoff
```http
POST /api/handoffs/:id/escalate
```

**Request Body:**
```json
{
  "reason": "Requires supervisor assistance",
  "escalationLevel": "supervisor"
}
```

### Add Note to Handoff
```http
POST /api/handoffs/:id/notes
```

**Request Body:**
```json
{
  "content": "Customer called regarding this issue",
  "author": "agent_id",
  "isInternal": true
}
```

### Get Handoff Statistics
```http
GET /api/handoffs/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHandoffs": 150,
    "pendingHandoffs": 5,
    "avgWaitTime": 4.2,
    "avgResolutionTime": 8.5,
    "satisfactionScore": 4.1,
    "byPriority": {
      "critical": 2,
      "high": 8,
      "medium": 15,
      "low": 25
    }
  }
}
```

---

## Analytics

### Get Dashboard Analytics
```http
GET /api/analytics/dashboard
```

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `botIds` (optional): Comma-separated bot IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 1247,
    "totalConversations": 856,
    "avgResponseTime": 2.3,
    "satisfactionScore": 4.2,
    "handoffRate": 0.12,
    "topCategories": [
      { "name": "billing", "count": 234 },
      { "name": "technical", "count": 189 }
    ],
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    }
  }
}
```

### Get Chart Analytics
```http
GET /api/analytics/charts
```

**Query Parameters:**
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `granularity` (optional): `hour`, `day`, `week`, `month`

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationsOverTime": [
      { "date": "2025-01-01", "conversations": 45, "queries": 120 },
      { "date": "2025-01-02", "conversations": 52, "queries": 134 }
    ],
    "responseTimeDistribution": [
      { "range": "0-1s", "count": 450 },
      { "range": "1-3s", "count": 320 }
    ],
    "satisfactionTrend": [
      { "date": "2025-01-01", "score": 4.1 },
      { "date": "2025-01-02", "score": 4.3 }
    ]
  }
}
```

---

## Chat & Widget

### Widget Script
```http
GET /widget.js
```

**Query Parameters:**
- `botId`: Bot ID for widget configuration

### Widget API Endpoint
```http
POST /api/widget/chat
```

**Request Body:**
```json
{
  "botId": "bot_id",
  "message": "Hello, I need help",
  "sessionId": "session_123",
  "userId": "user_456",
  "platform": "web"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm here to help. What can I assist you with today?",
    "confidence": 0.95,
    "sessionId": "session_123",
    "requiresHandoff": false,
    "suggestedActions": [
      { "type": "quick_reply", "text": "Billing Question" },
      { "type": "quick_reply", "text": "Technical Support" }
    ]
  }
}
```

### Get Chat History
```http
GET /api/chat/history/:sessionId
```

### End Chat Session
```http
POST /api/chat/end
```

**Request Body:**
```json
{
  "sessionId": "session_123",
  "feedback": {
    "rating": 5,
    "comment": "Very helpful"
  }
}
```

---

## Knowledge Base

### Upload Document
```http
POST /api/knowledge-base/upload
```

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: Document file (PDF, DOCX, TXT)
- `botId`: Associated bot ID
- `category`: Document category

### Get Documents
```http
GET /api/knowledge-base/documents
```

**Query Parameters:**
- `botId` (optional): Filter by bot
- `category` (optional): Filter by category
- `search` (optional): Search in content

### Delete Document
```http
DELETE /api/knowledge-base/documents/:id
```

### Reindex Knowledge Base
```http
POST /api/knowledge-base/reindex
```

---

## Settings

### Get System Settings
```http
GET /api/settings
```

### Update Settings
```http
PUT /api/settings
```

**Request Body:**
```json
{
  "openaiApiKey": "sk-...",
  "defaultLanguage": "en",
  "maxConcurrentChats": 100,
  "enableAnalytics": true,
  "webhookUrl": "https://your-domain.com/webhook"
}
```

### Get Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T12:00:00Z",
    "services": {
      "database": "connected",
      "openai": "available",
      "websocket": "running"
    },
    "version": "1.0.0"
  }
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');
```

### Events

#### Agent Status Updates
```javascript
// Listen for agent status changes
socket.on('agent:status', (data) => {
  console.log('Agent status updated:', data);
  // { agentId: 'agent_id', status: 'available', timestamp: '...' }
});
```

#### New Handoff Requests
```javascript
// Listen for new handoff requests
socket.on('handoff:new', (data) => {
  console.log('New handoff request:', data);
  // { handoffId: 'handoff_id', priority: 'high', ... }
});
```

#### Chat Messages
```javascript
// Listen for chat messages
socket.on('chat:message', (data) => {
  console.log('New message:', data);
  // { sessionId: 'session_id', message: '...', sender: 'user' }
});
```

#### System Notifications
```javascript
// Listen for system notifications
socket.on('system:notification', (data) => {
  console.log('System notification:', data);
  // { type: 'info', message: 'System maintenance in 10 minutes' }
});
```

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTH_REQUIRED` | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `BOT_NOT_PUBLISHED` | Bot is not published |
| `AGENT_UNAVAILABLE` | No agents available |
| `HANDOFF_EXPIRED` | Handoff request expired |

---

## Rate Limiting

### Limits

| Endpoint Category | Requests per Minute |
|-------------------|-------------------|
| Authentication | 10 |
| Bot Management | 60 |
| Agent Operations | 100 |
| Chat/Widget | 1000 |
| Analytics | 30 |
| File Upload | 5 |

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Production Deployment

### Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/chatbot_ai

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/logs/app.log
```

### Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure proper CORS origins
3. **Rate Limiting**: Implement appropriate rate limits
4. **Input Validation**: Validate all inputs
5. **Authentication**: Use strong JWT secrets
6. **File Uploads**: Validate file types and sizes
7. **Database**: Use connection pooling and proper indexing
8. **Monitoring**: Implement logging and monitoring

### Performance Optimization

1. **Caching**: Implement Redis for session storage
2. **Database Indexing**: Ensure proper indexes
3. **Connection Pooling**: Configure MongoDB connection pool
4. **Load Balancing**: Use load balancer for multiple instances
5. **CDN**: Use CDN for static assets
6. **Compression**: Enable gzip compression
7. **Monitoring**: Use APM tools for performance monitoring

---

## Support

For technical support or questions about the API:
- **Documentation**: This document
- **Status Page**: `https://your-domain.com/status`
- **Support Email**: support@your-domain.com

---

**Last Updated:** January 2025  
**API Version:** 1.0  
**Documentation Version:** 1.0
