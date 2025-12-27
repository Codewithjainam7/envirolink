# EnvironmentTech Platform - Complete System Specification

> **Vision**: "Turn every citizen into a cleanliness sensor and every authority into a data-driven responder."

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [UI Screen Breakdown](#4-ui-screen-breakdown)
5. [Component Structure](#5-component-structure)
6. [AI Workflow](#6-ai-workflow)
7. [Deployment Plan](#7-deployment-plan)

---

## 1. System Architecture

### 1.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        CW[Citizen Web App<br/>Next.js PWA]
        CM[Citizen Mobile<br/>React Native]
        AD[Authority Dashboard<br/>Next.js]
        FW[Field Worker App<br/>React Native + Offline]
    end

    subgraph "API Gateway"
        AG[Kong / AWS API Gateway]
        WS[WebSocket Server<br/>Socket.io]
    end

    subgraph "Application Services"
        RS[Report Service]
        US[User Service]
        NS[Notification Service]
        AS[Analytics Service]
        AIS[AI Service]
        GS[GIS Service]
        TS[Task Service]
    end

    subgraph "AI/ML Pipeline"
        VIS[Vision API<br/>Waste Detection]
        NLP[NLP Service<br/>Voice-to-Text]
        ML[ML Models<br/>Hotspot Prediction]
    end

    subgraph "Data Layer"
        MDB[(MongoDB<br/>Reports, Users)]
        PG[(PostgreSQL<br/>Analytics)]
        RD[(Redis<br/>Cache, Queues)]
        S3[(Object Storage<br/>Images)]
    end

    subgraph "External Services"
        MAP[Mapbox / Google Maps]
        PUSH[Firebase FCM]
        SMS[Twilio SMS]
        EMAIL[SendGrid]
    end

    CW & CM & AD & FW --> AG
    AG --> RS & US & NS & AS & TS
    RS --> AIS
    AIS --> VIS & NLP & ML
    RS & US --> MDB
    AS --> PG
    RS & US --> RD
    RS --> S3
    GS --> MAP
    NS --> PUSH & SMS & EMAIL
    AG <--> WS
```

### 1.2 Microservices Architecture

| Service | Responsibility | Tech Stack | Port |
|---------|---------------|------------|------|
| **API Gateway** | Routing, Rate limiting, Auth | Kong/Express | 8000 |
| **Report Service** | CRUD for waste reports | Node.js/NestJS | 3001 |
| **User Service** | Auth, Profiles, Roles | Node.js/NestJS | 3002 |
| **Notification Service** | Push, Email, SMS | Node.js | 3003 |
| **Analytics Service** | Dashboards, KPIs | Python/FastAPI | 3004 |
| **AI Service** | Image analysis, ML | Python/FastAPI | 3005 |
| **GIS Service** | Mapping, Geolocation | Node.js | 3006 |
| **Task Service** | Worker assignments | Node.js/NestJS | 3007 |

### 1.3 Data Flow Architecture

```mermaid
sequenceDiagram
    participant C as Citizen App
    participant AG as API Gateway
    participant RS as Report Service
    participant AI as AI Service
    participant DB as MongoDB
    participant S3 as Image Storage
    participant NS as Notification

    C->>AG: Submit Report (image + location)
    AG->>RS: Forward Request
    RS->>S3: Upload Image
    S3-->>RS: Image URL
    RS->>AI: Analyze Image
    AI-->>RS: Waste Type, Volume, Confidence
    RS->>DB: Save Report
    DB-->>RS: Report ID
    RS->>NS: Trigger Notifications
    NS-->>C: Push Notification
    RS-->>AG: Report Created Response
    AG-->>C: Success + Report ID
```

---

## 2. Database Schema

### 2.1 MongoDB Collections

#### Reports Collection
```javascript
{
  _id: ObjectId,
  reportId: "RPT-2024-000001",  // Human-readable ID
  
  // Location Data
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: "123 Main St, City",
    locality: "Downtown",
    city: "Mumbai",
    pincode: "400001"
  },
  
  // Report Content
  images: [{
    url: "https://cdn.../image1.webp",
    thumbnailUrl: "https://cdn.../thumb1.webp",
    uploadedAt: ISODate,
    aiAnalysis: {
      wasteType: "illegal_dumping",
      volume: "large",
      confidence: 0.92,
      detectedObjects: ["plastic_bags", "construction_debris"]
    }
  }],
  
  // Classification
  category: "illegal_dumping",  // enum
  severity: "high",  // low | medium | high | critical
  estimatedVolume: "large",  // small | medium | large
  
  // Description
  description: "Large pile of construction waste...",
  voiceNote: { url: "...", transcript: "..." },
  
  // Reporter
  reporterId: ObjectId | null,  // null for anonymous
  isAnonymous: true,
  
  // Status Tracking
  status: "assigned",  // submitted | under_review | assigned | in_progress | resolved | closed
  statusHistory: [{
    status: "submitted",
    timestamp: ISODate,
    changedBy: ObjectId,
    notes: "Initial submission"
  }],
  
  // Assignment
  assignedTo: {
    departmentId: ObjectId,
    workerId: ObjectId,
    assignedAt: ISODate,
    assignedBy: ObjectId
  },
  
  // Resolution
  resolution: {
    beforeImages: ["..."],
    afterImages: ["..."],
    notes: "Cleanup completed",
    completedAt: ISODate,
    completedBy: ObjectId
  },
  
  // SLA Tracking
  sla: {
    targetResolutionTime: 48,  // hours
    dueAt: ISODate,
    isBreached: false,
    escalationLevel: 0
  },
  
  // Duplicate Detection
  isDuplicate: false,
  duplicateOf: ObjectId | null,
  
  // Metadata
  createdAt: ISODate,
  updatedAt: ISODate,
  deletedAt: null
}

// Indexes
db.reports.createIndex({ "location": "2dsphere" })
db.reports.createIndex({ "status": 1, "createdAt": -1 })
db.reports.createIndex({ "assignedTo.workerId": 1 })
db.reports.createIndex({ "reporterId": 1 })
db.reports.createIndex({ "category": 1 })
```

#### Users Collection
```javascript
{
  _id: ObjectId,
  userId: "USR-000001",
  
  // Auth
  email: "user@example.com",
  phone: "+91-9876543210",
  passwordHash: "...",
  authProvider: "local",  // local | google | apple
  
  // Profile
  profile: {
    firstName: "Rahul",
    lastName: "Sharma",
    avatar: "https://...",
    preferredLanguage: "en"
  },
  
  // Role & Permissions
  role: "citizen",  // citizen | field_worker | authority | admin | super_admin
  permissions: ["create_report", "view_own_reports"],
  
  // Organization (for authorities/workers)
  organization: {
    id: ObjectId,
    name: "Mumbai Municipal Corporation",
    department: "Solid Waste Management",
    designation: "Field Supervisor"
  },
  
  // Gamification
  engagement: {
    totalReports: 15,
    resolvedReports: 12,
    badges: ["first_report", "community_hero"],
    points: 250,
    rank: "Silver Reporter"
  },
  
  // Preferences
  preferences: {
    notifications: { push: true, email: true, sms: false },
    darkMode: false,
    locationSharing: true
  },
  
  // Status
  isActive: true,
  isVerified: true,
  lastLoginAt: ISODate,
  
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Departments Collection
```javascript
{
  _id: ObjectId,
  name: "Solid Waste Management",
  shortCode: "SWM",
  city: "Mumbai",
  
  // Contact
  contact: {
    email: "swm@mmc.gov.in",
    phone: "+91-22-12345678",
    address: "Municipal HQ, Mumbai"
  },
  
  // Coverage
  coverage: {
    zones: ["Zone-1", "Zone-2"],
    wards: ["Ward-A", "Ward-B"],
    geoFence: { type: "Polygon", coordinates: [[...]] }
  },
  
  // SLA Configuration
  slaConfig: {
    low: { targetHours: 72, escalateAfter: 48 },
    medium: { targetHours: 48, escalateAfter: 24 },
    high: { targetHours: 24, escalateAfter: 12 },
    critical: { targetHours: 6, escalateAfter: 3 }
  },
  
  // Workers
  workers: [ObjectId, ObjectId],
  supervisors: [ObjectId],
  
  isActive: true,
  createdAt: ISODate
}
```

### 2.2 PostgreSQL Schema (Analytics)

```sql
-- Time-series analytics data
CREATE TABLE report_analytics (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    locality VARCHAR(100),
    category VARCHAR(50),
    severity VARCHAR(20),
    status VARCHAR(30),
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    resolution_time_hours NUMERIC(10, 2),
    sla_breached BOOLEAN DEFAULT FALSE,
    department_id VARCHAR(50),
    worker_id VARCHAR(50)
);

-- Daily aggregations
CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    city VARCHAR(100),
    locality VARCHAR(100),
    total_reports INT DEFAULT 0,
    resolved_reports INT DEFAULT 0,
    pending_reports INT DEFAULT 0,
    avg_resolution_hours NUMERIC(10, 2),
    sla_breach_count INT DEFAULT 0,
    UNIQUE(date, city, locality)
);

-- Department performance
CREATE TABLE department_performance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    department_id VARCHAR(50),
    assigned_count INT DEFAULT 0,
    resolved_count INT DEFAULT 0,
    avg_resolution_hours NUMERIC(10, 2),
    sla_compliance_rate NUMERIC(5, 2),
    UNIQUE(date, department_id)
);

-- Hotspot predictions
CREATE TABLE hotspot_predictions (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    locality VARCHAR(100),
    predicted_reports_next_7_days INT,
    confidence_score NUMERIC(5, 4),
    contributing_factors JSONB,
    prediction_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_city_date ON report_analytics(city, created_at);
CREATE INDEX idx_analytics_status ON report_analytics(status);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
```

---

## 3. API Endpoints

### 3.1 Report Service APIs

#### Create Report
```
POST /api/v1/reports
Authorization: Bearer <token> (optional for anonymous)
Content-Type: multipart/form-data

Request:
{
  "images": [File],
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "Optional manual address"
  },
  "category": "illegal_dumping",
  "description": "Optional description",
  "voiceNote": File (optional),
  "isAnonymous": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "reportId": "RPT-2024-000001",
    "status": "submitted",
    "aiAnalysis": {
      "detectedCategory": "illegal_dumping",
      "confidence": 0.92,
      "estimatedVolume": "large"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Reports (with filters)
```
GET /api/v1/reports?status=open&category=illegal_dumping&page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "reports": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Get Nearby Reports
```
GET /api/v1/reports/nearby?lat=19.0760&lng=72.8777&radius=1000
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "reports": [...],
    "totalInRadius": 15
  }
}
```

#### Update Report Status
```
PATCH /api/v1/reports/:reportId/status
Authorization: Bearer <token>
Role: authority, admin

Request:
{
  "status": "assigned",
  "assignedTo": {
    "departmentId": "dept-001",
    "workerId": "worker-001"
  },
  "notes": "Assigned to Zone-1 team"
}

Response: 200 OK
```

#### Complete Report (Field Worker)
```
POST /api/v1/reports/:reportId/complete
Authorization: Bearer <token>
Role: field_worker
Content-Type: multipart/form-data

Request:
{
  "afterImages": [File, File],
  "notes": "Cleanup completed successfully",
  "resourcesUsed": "2 workers, 1 truck"
}

Response: 200 OK
```

### 3.2 User Service APIs

```
POST   /api/v1/auth/register          # Citizen registration
POST   /api/v1/auth/login             # Login (returns JWT)
POST   /api/v1/auth/refresh           # Refresh token
POST   /api/v1/auth/forgot-password   # Password reset
POST   /api/v1/auth/verify-otp        # Phone/Email verification

GET    /api/v1/users/me               # Current user profile
PATCH  /api/v1/users/me               # Update profile
GET    /api/v1/users/me/reports       # User's reports
GET    /api/v1/users/me/stats         # User engagement stats

GET    /api/v1/users/:id              # Admin: Get user
GET    /api/v1/users                  # Admin: List users
PATCH  /api/v1/users/:id/role         # Admin: Update role
```

### 3.3 Task Service APIs (Field Workers)

```
GET    /api/v1/tasks                  # List assigned tasks
GET    /api/v1/tasks/:id              # Task details
POST   /api/v1/tasks/:id/accept       # Accept task
POST   /api/v1/tasks/:id/start        # Start work
POST   /api/v1/tasks/:id/complete     # Complete with proof
POST   /api/v1/tasks/:id/escalate     # Escalate issue
GET    /api/v1/tasks/route            # Optimized route for tasks
```

### 3.4 Analytics APIs

```
GET    /api/v1/analytics/overview     # Dashboard overview
GET    /api/v1/analytics/trends       # Trends over time
GET    /api/v1/analytics/hotspots     # Hotspot data
GET    /api/v1/analytics/departments  # Department performance
GET    /api/v1/analytics/sla          # SLA compliance
GET    /api/v1/analytics/export       # Export CSV/PDF
```

### 3.5 Public APIs (No Auth Required)

```
GET    /api/v1/public/stats           # City-wide stats
GET    /api/v1/public/map             # Public map data
GET    /api/v1/public/leaderboard     # Top reporters
```

---

## 4. UI Screen Breakdown

### 4.1 Citizen App Screens

#### Home Screen
```
┌────────────────────────────────────┐
│  🌍 EnvironmentTech     [Profile]  │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │      Interactive Map         │  │
│  │   [🔴] [🟡] [🟢] markers    │  │
│  │                              │  │
│  │      📍 Your Location        │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌────────────────────────────┐    │
│  │ 🏆 Community Impact        │    │
│  │ ━━━━━━━━━○ 85% Clean City  │    │
│  │ 1,234 Reports | 1,100 Fixed│    │
│  └────────────────────────────┘    │
│                                    │
│  My Recent Reports                 │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 🔴     │ │ 🟢     │ │ 🟡     │  │
│  │ Open   │ │Resolved│ │Pending │  │
│  └────────┘ └────────┘ └────────┘  │
│                                    │
│           ╭─────────────╮          │
│           │ + Report 📸 │          │
│           ╰─────────────╯          │
└────────────────────────────────────┘
```

#### Report Creation Flow (Bottom Sheet)
```
┌────────────────────────────────────┐
│ ━━━━━━━ (drag handle)              │
│                                    │
│  📸 Capture Waste                  │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     [Camera Preview]         │  │
│  │     or                       │  │
│  │     [Selected Image]         │  │
│  └──────────────────────────────┘  │
│  [📷 Camera]  [🖼️ Gallery]        │
│                                    │
│  📍 Location                       │
│  ┌──────────────────────────────┐  │
│  │  Mini Map with Pin           │  │
│  │  "123 Main Street"           │  │
│  │  [Adjust on Map →]           │  │
│  └──────────────────────────────┘  │
│                                    │
│  🏷️ Category                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │🗑️  │ │🚧 │ │♻️  │ │🔌 │      │
│  │Dump│ │Debr│ │Litt│ │E-wa│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                    │
│  📝 Description (optional)         │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  └──────────────────────────────┘  │
│  [🎤 Voice Note]                   │
│                                    │
│  ☑️ Submit Anonymously             │
│                                    │
│  ╭──────────────────────────────╮  │
│  │      Submit Report  →        │  │
│  ╰──────────────────────────────╯  │
└────────────────────────────────────┘
```

#### Report Detail Screen
```
┌────────────────────────────────────┐
│  ← Back         Report #12345      │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     [Report Image]           │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🟡 In Progress               │  │
│  │ Assigned to: SWM Team-A      │  │
│  └──────────────────────────────┘  │
│                                    │
│  📍 123 Main Street, Downtown      │
│  🏷️ Illegal Dumping | Large Volume │
│  📅 Reported: 2 days ago           │
│                                    │
│  ━━━━━━━ Timeline ━━━━━━━          │
│                                    │
│  ● Submitted         Jan 13, 10am  │
│  │                                 │
│  ● Under Review      Jan 13, 11am  │
│  │                                 │
│  ● Assigned          Jan 14, 9am   │
│  │  → SWM Team-A                   │
│  │                                 │
│  ○ In Progress       (current)     │
│  │                                 │
│  ○ Resolved          (pending)     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 💬 Add Comment               │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### 4.2 Authority Dashboard Screens

#### Dashboard Overview
```
┌────────────────────────────────────────────────────────────────┐
│  🏛️ EnvironmentTech Authority Portal        [User ▼] [Logout] │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│ Dashboard│  📊 Overview                       Filter: [Today ▼]│
│ Reports  │  ┌─────────┬─────────┬─────────┬─────────┐         │
│ Map View │  │  📥     │  🔄     │  ✅     │  ⚠️     │         │
│ Workers  │  │  New    │ Active  │Resolved │ Breached│         │
│ Analytics│  │  45     │  123    │  890    │  12     │         │
│ Settings │  └─────────┴─────────┴─────────┴─────────┘         │
│          │                                                     │
│          │  ┌───────────────────┬─────────────────────────┐   │
│          │  │ Recent Reports    │  City Heatmap           │   │
│          │  │                   │  ┌───────────────────┐  │   │
│          │  │ ▪ RPT-001 🔴 New  │  │                   │  │   │
│          │  │ ▪ RPT-002 🟡 Prog │  │   [Map View]      │  │   │
│          │  │ ▪ RPT-003 🟢 Done │  │                   │  │   │
│          │  │                   │  └───────────────────┘  │   │
│          │  └───────────────────┴─────────────────────────┘   │
│          │                                                     │
│          │  ┌─────────────────────────────────────────────┐   │
│          │  │ 📈 Resolution Trend (Last 30 Days)          │   │
│          │  │ [Line Chart: Reports vs Resolved]           │   │
│          │  └─────────────────────────────────────────────┘   │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

### 4.3 Field Worker App Screens

#### Task List
```
┌────────────────────────────────────┐
│  👷 My Tasks              [Map 🗺️] │
├────────────────────────────────────┤
│  Today's Tasks (4)                 │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🔴 HIGH PRIORITY             │  │
│  │ RPT-001 | Illegal Dumping    │  │
│  │ 📍 123 Main St (1.2 km)      │  │
│  │ ⏰ Due in 4 hours            │  │
│  │ [Navigate] [Start Task]      │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🟡 MEDIUM                    │  │
│  │ RPT-005 | Overflowing Bin    │  │
│  │ 📍 Park Road (2.5 km)        │  │
│  │ ⏰ Due in 12 hours           │  │
│  │ [Navigate] [Start Task]      │  │
│  └──────────────────────────────┘  │
│                                    │
│  Completed Today: 3/7              │
│  ━━━━━━━━━━━○ 43%                  │
│                                    │
└────────────────────────────────────┘
```

### 4.4 Public Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│  🌍 City Cleanliness Dashboard              Mumbai | [Share]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              [Interactive City Map]                     │   │
│  │     🔴 Open    🟡 In Progress    🟢 Resolved           │   │
│  │                                                         │   │
│  │           [Heat overlay showing hotspots]               │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────┬────────────┬────────────┬────────────┐        │
│  │   12,345   │    11,892  │    96.3%   │   18 hrs   │        │
│  │   Total    │   Resolved │  Resolution│   Avg Time │        │
│  │  Reports   │            │    Rate    │            │        │
│  └────────────┴────────────┴────────────┴────────────┘        │
│                                                                │
│  🏆 Top Contributors                                           │
│  1. 🥇 Rahul S. - 45 reports                                  │
│  2. 🥈 Priya M. - 38 reports                                  │
│  3. 🥉 Amit K. - 32 reports                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Structure

### 5.1 Project Structure

```
environmenttech/
├── apps/
│   ├── citizen-web/                 # Next.js PWA
│   │   ├── src/
│   │   │   ├── app/                 # App Router pages
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── report/
│   │   │   │   ├── profile/
│   │   │   │   └── map/
│   │   │   ├── components/
│   │   │   │   ├── ui/              # Base UI components
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── BottomSheet.tsx
│   │   │   │   │   ├── Skeleton.tsx
│   │   │   │   │   └── AnimatedCounter.tsx
│   │   │   │   ├── map/
│   │   │   │   │   ├── MapView.tsx
│   │   │   │   │   ├── ReportMarker.tsx
│   │   │   │   │   └── HeatmapLayer.tsx
│   │   │   │   ├── report/
│   │   │   │   │   ├── ReportCard.tsx
│   │   │   │   │   ├── ReportForm.tsx
│   │   │   │   │   ├── CategoryPicker.tsx
│   │   │   │   │   ├── ImageCapture.tsx
│   │   │   │   │   ├── LocationPicker.tsx
│   │   │   │   │   └── Timeline.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── BottomNav.tsx
│   │   │   │       └── FloatingButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useReports.ts
│   │   │   │   ├── useGeolocation.ts
│   │   │   │   ├── useImageUpload.ts
│   │   │   │   └── useNotifications.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── utils.ts
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       └── animations.css
│   │   └── next.config.js
│   │
│   ├── authority-dashboard/          # Next.js Admin
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       │   ├── dashboard/
│   │       │   ├── reports/
│   │       │   ├── analytics/
│   │       │   └── workers/
│   │       └── ...
│   │
│   └── mobile/                       # React Native
│       ├── citizen/
│       └── worker/
│
├── packages/
│   ├── shared-ui/                    # Shared components
│   ├── api-client/                   # API SDK
│   └── types/                        # TypeScript types
│
├── services/
│   ├── api-gateway/
│   ├── report-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── user-service/
│   ├── notification-service/
│   ├── analytics-service/
│   ├── ai-service/
│   ├── gis-service/
│   └── task-service/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
└── docs/
    ├── api/
    ├── architecture/
    └── deployment/
```

### 5.2 Core UI Components

#### Button Component (Sensoneo-like)
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// Design tokens
const buttonStyles = {
  base: 'rounded-2xl font-medium transition-all duration-200 ease-out',
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  sizes: {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
};
```

#### BottomSheet Component
```typescript
// components/ui/BottomSheet.tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints: number[];      // [0.25, 0.5, 0.9]
  initialSnap?: number;
  children: React.ReactNode;
}

// Uses Framer Motion for smooth drag gestures
// Supports swipe-to-close
// Backdrop click to dismiss
```

#### AnimatedCounter Component
```typescript
// components/ui/AnimatedCounter.tsx
interface AnimatedCounterProps {
  value: number;
  duration?: number;         // Animation duration in ms
  formatFn?: (n: number) => string;
}

// Smooth number counting animation
// Supports formatting (1234 → "1,234")
```

### 5.3 Design System Tokens

```css
/* styles/design-tokens.css */

:root {
  /* Colors - Sensoneo-inspired palette */
  --color-primary-50: #ecfdf5;
  --color-primary-100: #d1fae5;
  --color-primary-500: #10b981;   /* Main green */
  --color-primary-600: #059669;
  --color-primary-700: #047857;
  
  --color-accent-500: #3b82f6;    /* Blue accent */
  
  --color-warning-500: #f59e0b;   /* Yellow/Orange */
  --color-danger-500: #ef4444;    /* Red */
  
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-gray-50: #111827;
  --color-gray-100: #1f2937;
  --color-gray-800: #f3f4f6;
  --color-gray-900: #f9fafb;
}
```

---

## 6. AI Workflow

### 6.1 Image Analysis Pipeline

```mermaid
flowchart TB
    subgraph Input
        IMG[Uploaded Image]
    end

    subgraph Preprocessing
        RESIZE[Resize to 640x640]
        ENHANCE[Image Enhancement<br/>Brightness, Contrast]
        QUALITY[Quality Check<br/>Blur Detection]
    end

    subgraph Detection
        MODEL[Vision Model<br/>YOLOv8 / EfficientNet]
        CLASSIFY[Waste Classification]
        VOLUME[Volume Estimation]
    end

    subgraph PostProcess
        CONF[Confidence Check]
        DUP[Duplicate Detection<br/>Location + Visual Similarity]
        REVIEW{Confidence > 0.7?}
    end

    subgraph Output
        AUTO[Auto-Categorize]
        MANUAL[Flag for Manual Review]
    end

    IMG --> RESIZE --> ENHANCE --> QUALITY
    QUALITY --> MODEL --> CLASSIFY --> VOLUME
    VOLUME --> CONF --> DUP --> REVIEW
    REVIEW -->|Yes| AUTO
    REVIEW -->|No| MANUAL
```

### 6.2 AI Service Implementation

```python
# services/ai-service/src/analyzer.py

from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
import torch
from transformers import pipeline
import numpy as np

class AnalysisResult(BaseModel):
    waste_type: str
    confidence: float
    volume_estimate: str  # small | medium | large
    detected_objects: list[str]
    is_waste_detected: bool
    requires_manual_review: bool

class WasteAnalyzer:
    def __init__(self):
        self.classifier = pipeline(
            "image-classification",
            model="microsoft/resnet-50"  # Fine-tuned on waste dataset
        )
        self.detector = torch.hub.load(
            'ultralytics/yolov8', 
            'custom',
            path='models/waste_detector.pt'
        )
        
    async def analyze(self, image: UploadFile) -> AnalysisResult:
        # 1. Preprocess
        img_array = await self.preprocess(image)
        
        # 2. Object Detection
        detections = self.detector(img_array)
        detected_objects = self.extract_objects(detections)
        
        # 3. Waste Classification
        classification = self.classifier(img_array)
        waste_type = self.map_to_category(classification[0])
        confidence = classification[0]['score']
        
        # 4. Volume Estimation
        volume = self.estimate_volume(detections)
        
        # 5. Determine if manual review needed
        requires_review = confidence < 0.7 or not detected_objects
        
        return AnalysisResult(
            waste_type=waste_type,
            confidence=confidence,
            volume_estimate=volume,
            detected_objects=detected_objects,
            is_waste_detected=len(detected_objects) > 0,
            requires_manual_review=requires_review
        )
    
    def map_to_category(self, classification) -> str:
        CATEGORY_MAP = {
            'garbage_pile': 'illegal_dumping',
            'overflowing_bin': 'overflowing_bin',
            'construction_waste': 'construction_debris',
            'electronic_waste': 'e_waste',
            'organic_waste': 'organic_waste',
            'scattered_litter': 'littering'
        }
        return CATEGORY_MAP.get(classification['label'], 'other')
```

### 6.3 Duplicate Detection Algorithm

```python
# services/ai-service/src/duplicate_detector.py

from sklearn.metrics.pairwise import cosine_similarity
import imagehash
from PIL import Image
from geopy.distance import geodesic

class DuplicateDetector:
    LOCATION_THRESHOLD_METERS = 50
    IMAGE_SIMILARITY_THRESHOLD = 0.85
    TIME_WINDOW_HOURS = 24
    
    async def is_duplicate(
        self, 
        new_report: dict, 
        existing_reports: list
    ) -> tuple[bool, str | None]:
        """
        Check if new report is duplicate of existing reports.
        Returns (is_duplicate, original_report_id)
        """
        new_location = (
            new_report['location']['coordinates'][1],
            new_report['location']['coordinates'][0]
        )
        new_image_hash = self.compute_image_hash(new_report['image_url'])
        
        for report in existing_reports:
            # Skip resolved reports
            if report['status'] in ['resolved', 'closed']:
                continue
                
            # Check location proximity
            report_location = (
                report['location']['coordinates'][1],
                report['location']['coordinates'][0]
            )
            distance = geodesic(new_location, report_location).meters
            
            if distance > self.LOCATION_THRESHOLD_METERS:
                continue
            
            # Check image similarity
            existing_hash = self.compute_image_hash(report['images'][0]['url'])
            similarity = self.compute_similarity(new_image_hash, existing_hash)
            
            if similarity > self.IMAGE_SIMILARITY_THRESHOLD:
                return True, report['_id']
        
        return False, None
```

### 6.4 Hotspot Prediction Model

```python
# services/ai-service/src/hotspot_predictor.py

import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

class HotspotPredictor:
    """
    Predicts future waste hotspots based on historical data.
    Features:
    - Historical report density
    - Day of week patterns
    - Seasonal trends
    - Location characteristics
    - Population density
    - Commercial activity
    """
    
    def train(self, historical_data: pd.DataFrame):
        features = self.extract_features(historical_data)
        target = historical_data['report_count_next_7_days']
        
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(features)
        
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1
        )
        self.model.fit(X_scaled, target)
    
    def predict_hotspots(self, locations: list) -> list[dict]:
        """
        Returns list of locations with predicted report counts.
        """
        predictions = []
        for loc in locations:
            features = self.extract_location_features(loc)
            X = self.scaler.transform([features])
            predicted_count = self.model.predict(X)[0]
            
            predictions.append({
                'location_id': loc['id'],
                'latitude': loc['lat'],
                'longitude': loc['lng'],
                'locality': loc['locality'],
                'predicted_reports': int(predicted_count),
                'confidence': self.calculate_confidence(predicted_count),
                'contributing_factors': self.explain_prediction(features)
            })
        
        return sorted(predictions, key=lambda x: -x['predicted_reports'])
```

---

## 7. Deployment Plan

### 7.1 Infrastructure Architecture

```mermaid
graph TB
    subgraph "CDN Layer"
        CF[Cloudflare CDN]
    end

    subgraph "Load Balancer"
        ALB[AWS ALB / GCP LB]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Frontend Pods"
            CW1[Citizen Web Pod 1]
            CW2[Citizen Web Pod 2]
            AD1[Admin Dashboard Pod]
        end

        subgraph "API Gateway"
            AG1[Kong Gateway Pod 1]
            AG2[Kong Gateway Pod 2]
        end

        subgraph "Services"
            RS1[Report Service]
            RS2[Report Service]
            US1[User Service]
            NS1[Notification Service]
            AIS1[AI Service]
        end
    end

    subgraph "Data Tier"
        MDB[(MongoDB Atlas)]
        PG[(PostgreSQL RDS)]
        RD[(Redis Cluster)]
        S3[(S3 / Cloud Storage)]
    end

    CF --> ALB --> AG1 & AG2
    AG1 & AG2 --> RS1 & RS2 & US1 & NS1 & AIS1
    RS1 & RS2 --> MDB & S3
    US1 --> MDB & RD
    AIS1 --> S3
```

### 7.2 Docker Configuration

```yaml
# docker-compose.yml (Development)
version: '3.8'

services:
  citizen-web:
    build: ./apps/citizen-web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN}
    depends_on:
      - api-gateway

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8000:8000"
    environment:
      - REPORT_SERVICE_URL=http://report-service:3001
      - USER_SERVICE_URL=http://user-service:3002
    depends_on:
      - report-service
      - user-service

  report-service:
    build: ./services/report-service
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/environmenttech
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://ai-service:3005
    depends_on:
      - mongodb
      - redis

  ai-service:
    build: ./services/ai-service
    ports:
      - "3005:3005"
    environment:
      - MODEL_PATH=/models
    volumes:
      - ./models:/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=environmenttech_analytics
      - POSTGRES_USER=analytics
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  mongodb_data:
  postgres_data:
```

### 7.3 Kubernetes Manifests

```yaml
# kubernetes/report-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: report-service
  namespace: environmenttech
spec:
  replicas: 3
  selector:
    matchLabels:
      app: report-service
  template:
    metadata:
      labels:
        app: report-service
    spec:
      containers:
        - name: report-service
          image: environmenttech/report-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: mongodb-uri
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: report-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: report-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 7.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run E2E tests
        run: npm run test:e2e

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    strategy:
      matrix:
        service:
          - citizen-web
          - authority-dashboard
          - report-service
          - user-service
          - ai-service
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            kubernetes/
          images: |
            ${{ env.REGISTRY }}/${{ github.repository }}/report-service:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ github.repository }}/user-service:${{ github.sha }}
```

### 7.5 Multi-City / Multi-Tenant Architecture

```typescript
// Tenant Configuration
interface TenantConfig {
  id: string;
  name: string;                   // "Mumbai Municipal Corporation"
  subdomain: string;              // "mumbai"
  customDomain?: string;          // "cleancity.mmc.gov.in"
  
  branding: {
    logo: string;
    primaryColor: string;
    appName: string;
  };
  
  features: {
    anonymousReporting: boolean;
    voiceNotes: boolean;
    gamification: boolean;
    publicDashboard: boolean;
  };
  
  slaConfig: {
    [severity: string]: {
      targetHours: number;
      escalationRules: EscalationRule[];
    };
  };
  
  integrations: {
    mapProvider: 'mapbox' | 'google';
    smsProvider: 'twilio' | 'msg91';
    storageProvider: 's3' | 'gcs' | 'azure';
  };
  
  limits: {
    maxReportsPerDay: number;
    maxImageSize: number;
    maxWorkers: number;
  };
}
```

### 7.6 Environment Configuration

```bash
# .env.production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/environmenttech
POSTGRES_URL=postgresql://user:pass@host:5432/analytics
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=<secure-secret>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# External Services
MAPBOX_ACCESS_TOKEN=pk.xxx
FIREBASE_PROJECT_ID=environmenttech-prod
FIREBASE_PRIVATE_KEY=<key>
SENDGRID_API_KEY=SG.xxx
TWILIO_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# AI Services
OPENAI_API_KEY=sk-xxx
GOOGLE_CLOUD_VISION_KEY=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=environmenttech-images
AWS_REGION=ap-south-1
CDN_URL=https://cdn.environmenttech.io

# Feature Flags
FEATURE_GAMIFICATION=true
FEATURE_VOICE_NOTES=true
FEATURE_AI_ANALYSIS=true
```

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-3)
- Project setup & monorepo structure
- Database schemas & migrations
- Auth service & JWT implementation
- Basic API Gateway

### Phase 2: Core Features (Weeks 4-6)
- Report Service CRUD
- Citizen App screens
- Image upload & storage
- Basic map integration

### Phase 3: AI & Automation (Weeks 7-8)
- AI image analysis
- Duplicate detection
- Auto-categorization

### Phase 4: Authority Features (Weeks 9-10)
- Authority dashboard
- Task assignment
- Field worker app

### Phase 5: Analytics & Polish (Weeks 11-12)
- Analytics dashboards
- Public transparency portal
- Performance optimization
- Security hardening
