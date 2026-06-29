# CivicResolve FastAPI Backend

A high-performance FastAPI backend for the **CivicResolve: Community Issue Reporting and Resolution Platform**. This backend handles secure JWT authentication, Firestore document read/writes, AI-driven computer vision and predictive analytics, and gamified civic achievements.

---

## 🛠️ Architecture & Folder Structure

The backend follows clean, modular Domain-Driven Design principles:

```text
/backend
├── requirements.txt         # Package dependencies
├── README.md                # Deployment and setup guide
└── app
    ├── __init__.py          # Core package declaration
    ├── main.py              # FastAPI app initialization & routing
    ├── config.py            # Environment-aware settings manager
    ├── auth.py              # Password hashing & JWT token validation
    ├── db.py                # Firestore SDK initialization & fallback engine
    ├── models.py            # Pydantic data schemas & input validations
    ├── routes
    │   ├── __init__.py      # Routes package declaration
    │   ├── auth_routes.py   # JWT registration & profile operations
    │   ├── issue_routes.py  # Issue CRUD & report ingest
    │   ├── verify_routes.py # Community verification upvotes & milestone awards
    │   ├── authority_routes.py # Authority work orders & proof logging
    │   ├── gamification_routes.py # Interactive quiz logging & rewards
    │   ├── dashboard_routes.py # AI admin summaries and metrics
    │   └── prediction_routes.py # Seasonal recurrence hot-spot forecasting
    └── utils
        ├── __init__.py      # Utilities package declaration
        └── gemini_service.py # Gemini AI structured JSON orchestrator
```

---

## ⚙️ Prerequisites & Setup

Ensure you have **Python 3.10+** installed on your workstation or server environment.

### 1. Install Dependencies
Create a virtual environment and install the required modules:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create or update your `.env` file at the root of the project with the following parameters:

```env
# Server Bind Properties
HOST=0.0.0.0
PORT=8000

# Security Credentials
JWT_SECRET=YOUR_SECURE_JWT_SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Configuration (Optional but recommended for full computer vision and forecasting)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Cloud Firestore Configuration
# (If omitted, the server automatically starts in Sandbox Mode with an In-Memory seed database!)
FIREBASE_PROJECT_ID=your-gcp-project-id
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
```

---

## 🚀 Running the Server

Start the development server with **Uvicorn** (includes hot-reloading on changes):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

-   **Interactive OpenAPI Specs (Swagger UI):** Visit `http://localhost:8000/docs`
-   **ReDoc Documentation:** Visit `http://localhost:8000/redoc`
-   **Health Check Endpoint:** `http://localhost:8000/api/health`

---

## 🔒 Firestore Setup & Production Deployment

To connect this FastAPI backend to your live Google Cloud Firestore project:

1.  Go to the **Google Cloud Console** or **Firebase Console**.
2.  Enable **Firestore Database** in Native Mode.
3.  Go to **Project Settings > Service Accounts**.
4.  Generate a new Private Key and save the JSON file.
5.  Set `FIREBASE_CREDENTIALS_PATH` in your `.env` to point to the saved JSON file.
6.  Set `FIREBASE_PROJECT_ID` to your GCP project ID.

### Deploying to Google Cloud Run
This backend is fully containerized and ready to deploy:

```bash
# Build the container via Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/civicresolve-backend

# Deploy the container to Cloud Run
gcloud run deploy civicresolve-backend \
  --image gcr.io/YOUR_PROJECT_ID/civicresolve-backend \
  --platform managed \
  --port 8000 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=YOUR_KEY,JWT_SECRET=YOUR_SECRET"
```

---

## 🧠 Key Features Implemented

1.  **Dual Storage Engine:** Operates seamlessly with live Google Cloud Firestore. If credentials are not loaded, it starts immediately using an elegant **In-Memory Mock Firestore** seeded with high-fidelity civic issues.
2.  **Structured AI Vision:** Uses `gemini-2.5-flash` with JSON output schemas to automatically extract titles, correct categories (pothole, leakage, road_damage, streetlight, garbage, other), severities, and assign appropriate municipal departments from citizen reports.
3.  **Active Hotspot Forecasting:** Feeds spatial telemetry to Gemini AI to forecast seasonal community risk points.
4.  **Full Auth Flow:** Secures endpoints with industry-standard bcrypt passwords and signed JWT tokens, while maintaining backward-compatible endpoints for current frontend configurations.
5.  **Interactive Gamification Hooks:** Powers point logs, simulation outcomes, and rewards citizen verification with "Civic Guardian" badges.
