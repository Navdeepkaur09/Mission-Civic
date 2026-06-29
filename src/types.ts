export type IssueCategory = 'pothole' | 'garbage' | 'leakage' | 'streetlight' | 'road_damage' | 'graffiti' | 'leaves' | 'fallen_tree' | 'other';

export type IssueStatus = 'reported' | 'verifying' | 'verified' | 'in_progress' | 'resolved' | 'community_resolved' | 'failed_verification';

export type IssueSeverity = 'low' | 'medium' | 'high';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: IssueSeverity;
  department: string;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  updatedAt: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  verificationCount: number;
  downvoteCount: number;
  verifications: string[]; // List of user emails who upvoted/verified
  resolutionProofUrl?: string;
  resolutionProofDescription?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  issueDetected?: string;
  priorityScore?: number;
  estimatedResolutionTime?: string;
  assignedWorker?: string;
  assignedWorkerPhone?: string;
  afterImageUrl?: string;
  safetyLevel?: 'safe' | 'unsafe';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  unlockedAt?: string;
  pointsRequired: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'admin';
  department?: string; // e.g., 'Department of Sanitation'
  points: number;
  coins: number;
  badges: string[]; // Badge IDs
  verificationsDone: number;
  reportsFiled: number;
  gameCompletedCount: number;
}

export interface Department {
  name: string;
  code: string;
  manager: string;
  activeStaffCount: number;
}

export interface PredictiveHotspot {
  id: string;
  region: string;
  category: IssueCategory;
  riskScore: number; // 0 - 100
  reasoning: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  predictedTimeline: string; // e.g., "Expected peak in July after heavy rainfall"
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  reportsCount: number;
  role: string;
}
