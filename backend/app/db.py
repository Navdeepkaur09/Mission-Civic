import logging
import firebase_admin
from firebase_admin import credentials, firestore
from backend.app.config import settings

logger = logging.getLogger("db")
logging.basicConfig(level=logging.INFO)

# --- Drop-in Mock Firestore for offline sandbox mode ---
class MockDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data or {}

class MockDocument:
    def __init__(self, collection, doc_id):
        self.collection = collection
        self.id = doc_id

    def get(self):
        data = self.collection.store.get(self.id)
        return MockDocumentSnapshot(self.id, data)

    def set(self, data, merge=True):
        if merge and self.id in self.collection.store:
            self.collection.store[self.id].update(data)
        else:
            self.collection.store[self.id] = dict(data)
        return self

    def update(self, data):
        if self.id in self.collection.store:
            self.collection.store[self.id].update(data)
        else:
            self.collection.store[self.id] = dict(data)
        return self

    def delete(self):
        if self.id in self.collection.store:
            del self.collection.store[self.id]

class MockCollection:
    def __init__(self, name, store):
        self.name = name
        self.store = store

    def document(self, doc_id):
        return MockDocument(self, doc_id)

    def stream(self):
        for doc_id, data in list(self.store.items()):
            yield MockDocumentSnapshot(doc_id, data)

class MockFirestoreClient:
    def __init__(self):
        self._stores = {}
        logger.info("Initialized In-Memory Mock Firestore Client.")

    def collection(self, name):
        if name not in self._stores:
            self._stores[name] = {}
        return MockCollection(name, self._stores[name])


# --- Initialize Firestore or Fallback ---
_db_client = None

def get_db():
    global _db_client
    if _db_client is not None:
        return _db_client

    # Check for credentials
    cred = None
    try:
        if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            logger.info(f"Loading Firebase credentials from {settings.FIREBASE_CREDENTIALS_PATH}")
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        elif settings.FIREBASE_PROJECT_ID:
            logger.info(f"Using Firebase with project ID: {settings.FIREBASE_PROJECT_ID}")
            cred = credentials.ApplicationDefault()
        
        # Try initializing App
        if cred:
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID or None
                })
            _db_client = firestore.client()
            logger.info("Successfully connected to live Cloud Firestore database.")
            return _db_client
    except Exception as e:
        logger.warning(f"Failed to initialize real Firebase Client: {e}. Falling back to sandbox memory storage.")
    
    # Fallback
    _db_client = MockFirestoreClient()
    _seed_mock_database(_db_client)
    return _db_client


def _seed_mock_database(mock_db):
    """Seed the mock database with initial data matching src/data.ts."""
    from datetime import datetime, timedelta
    
    # User profiles seed
    users = {
        'nav090105@gmail.com': {
            'name': 'Nav',
            'email': 'nav090105@gmail.com',
            'role': 'citizen',
            'points': 120,
            'coins': 250,
            'badges': ['first_report', 'pothole_patrol'],
            'verificationsDone': 3,
            'reportsFiled': 4,
            'gameCompletedCount': 1
        },
        'authority@city.gov': {
            'name': 'Officer Davis',
            'email': 'authority@city.gov',
            'role': 'authority',
            'department': 'Department of Transportation',
            'points': 0,
            'coins': 0,
            'badges': [],
            'verificationsDone': 0,
            'reportsFiled': 0,
            'gameCompletedCount': 0
        },
        'admin@city.gov': {
            'name': 'Admin Director Sarah',
            'email': 'admin@city.gov',
            'role': 'admin',
            'points': 0,
            'coins': 0,
            'badges': [],
            'verificationsDone': 0,
            'reportsFiled': 0,
            'gameCompletedCount': 0
        }
    }
    
    for email, profile in users.items():
        mock_db.collection('users').document(email).set(profile)

    # Issues seed
    issues = [
        {
            'id': 'issue-1',
            'title': 'Deep Asphalt Pothole on Broad St',
            'description': 'Significant road cavity on Broad St near Pike Market causing severe vehicle swerving. Deep structure exposed.',
            'category': 'pothole',
            'status': 'in_progress',
            'severity': 'high',
            'department': 'Department of Transportation',
            'reporterName': 'Sarah K.',
            'reporterEmail': 'sarah@example.com',
            'createdAt': (datetime.utcnow() - timedelta(days=5)).isoformat() + "Z",
            'updatedAt': (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
            'latitude': 47.6097,
            'longitude': -122.3421,
            'address': '85 Broad St, Seattle, WA',
            'imageUrl': 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
            'verificationCount': 5,
            'downvoteCount': 0,
            'verifications': ['nav090105@gmail.com', 'user2@example.com'],
            'aiConfidence': 0.94,
            'aiReasoning': 'AI detected highly dangerous asphalt displacement with 94% confidence. Immediate dispatch warranted.'
        },
        {
            'id': 'issue-2',
            'title': 'Leaking Fire Hydrant',
            'description': 'Municipal water main hydrant bubbling steadily, wasting gallons of clean public water near Pine Street.',
            'category': 'leakage',
            'status': 'reported',
            'severity': 'medium',
            'department': 'Department of Public Utilities (Water & Gas)',
            'reporterName': 'Nav',
            'reporterEmail': 'nav090105@gmail.com',
            'createdAt': (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
            'updatedAt': (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
            'latitude': 47.6101,
            'longitude': -122.3364,
            'address': '501 Pine St, Seattle, WA',
            'imageUrl': 'https://images.unsplash.com/photo-1599740831464-5aefe11fca9a?auto=format&fit=crop&q=80&w=600',
            'verificationCount': 2,
            'downvoteCount': 0,
            'verifications': ['user3@example.com'],
            'aiConfidence': 0.81,
            'aiReasoning': 'Visual diagnostic indicates high water volume pressure leak. Low immediate structural risk but high utility waste.'
        },
        {
            'id': 'issue-3',
            'title': 'Illegal Commercial Refuse Pile',
            'description': 'Large stacks of wooden pallets and plastics blocking the public sidewalk and accessibility lane on 5th Ave.',
            'category': 'garbage',
            'status': 'resolved',
            'severity': 'medium',
            'department': 'Department of Sanitation & Waste Management',
            'reporterName': 'Marcus Thompson',
            'reporterEmail': 'marcus@example.com',
            'createdAt': (datetime.utcnow() - timedelta(days=10)).isoformat() + "Z",
            'updatedAt': (datetime.utcnow() - timedelta(days=4)).isoformat() + "Z",
            'latitude': 47.6045,
            'longitude': -122.3302,
            'address': '1205 5th Ave, Seattle, WA',
            'imageUrl': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600',
            'verificationCount': 8,
            'downvoteCount': 0,
            'verifications': [],
            'aiConfidence': 0.89,
            'aiReasoning': 'Identified bulky commercial waste obstruction. Walkway blockage confirmed.',
            'resolutionProofUrl': 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=600',
            'resolutionProofDescription': 'Sanitation crew dispatched with flatbed vehicle. PALLETS REMOVED, sidewalk clean-swept.'
        }
    ]
    
    for issue in issues:
        mock_db.collection('issues').document(issue['id']).set(issue)
