import { Issue, Badge, UserProfile, Department, PredictiveHotspot, LeaderboardEntry } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { name: 'Department of Transportation', code: 'DOT', manager: 'Sarah Jenkins', activeStaffCount: 14 },
  { name: 'Department of Sanitation & Waste Management', code: 'DSWM', manager: 'Marcus Vance', activeStaffCount: 8 },
  { name: 'Department of Public Utilities (Water & Gas)', code: 'DPU', manager: 'Elena Rostova', activeStaffCount: 11 },
  { name: 'Department of Energy & Lighting', code: 'DEL', manager: 'David Cho', activeStaffCount: 6 },
  { name: 'City Parks & Recreation', code: 'CPR', manager: 'Amanda Grier', activeStaffCount: 5 }
];

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_report',
    name: 'First Responder',
    description: 'Submitted your first community issue report.',
    icon: 'Flag',
    pointsRequired: 0
  },
  {
    id: 'pothole_patrol',
    name: 'Pothole Patrol',
    description: 'Reported 3 or more road hazards or potholes.',
    icon: 'Hammer',
    pointsRequired: 50
  },
  {
    id: 'community_guardian',
    name: 'Civic Guardian',
    description: 'Verified 5 reports submitted by other citizens.',
    icon: 'ShieldCheck',
    pointsRequired: 100
  },
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Successfully reported 3 illegal dumping or sanitation issues.',
    icon: 'Trash2',
    pointsRequired: 150
  },
  {
    id: 'bright_mind',
    name: 'Beacon of Light',
    description: 'Helped resolve or reported 3 faulty streetlights.',
    icon: 'Lightbulb',
    pointsRequired: 200
  },
  {
    id: 'safety_champion',
    name: 'Safety Champion',
    description: 'Completed the safety training mini-game with a perfect score.',
    icon: 'Award',
    pointsRequired: 250
  }
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: 'issue-101',
    title: 'Crater Pothole on Pine Street',
    description: 'Massive pothole in the middle lane of Pine Street, right near the 4th Ave intersection. It has already damaged at least two tires today.',
    category: 'pothole',
    status: 'in_progress',
    severity: 'high',
    department: 'Department of Transportation',
    reporterName: 'Jordan Vance',
    reporterEmail: 'jordan@gmail.com',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    latitude: 47.6101,
    longitude: -122.3368,
    address: '401 Pine St, Seattle, WA 98101',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    verificationCount: 24,
    downvoteCount: 0,
    verifications: ['alice@gmail.com', 'bob@gmail.com', 'clara@gmail.com'],
    aiConfidence: 0.94,
    aiReasoning: 'Visual analysis confirms standard circular asphalt displacement (pothole) measuring approximately 1.5 feet in diameter with deep substrate exposure.'
  },
  {
    id: 'issue-102',
    title: 'Overflowing Trash & Garbage Dumpster',
    description: 'Large piles of household trash bags have been dumped on the sidewalk next to the public park. Stray animals are ripping the bags open, spreading garbage everywhere.',
    category: 'garbage',
    status: 'verified',
    severity: 'medium',
    department: 'Department of Sanitation & Waste Management',
    reporterName: 'Elena Carter',
    reporterEmail: 'elena.c@gmail.com',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    latitude: 47.6152,
    longitude: -122.3215,
    address: '1100 East Olive St, Seattle, WA 98122',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    verificationCount: 15,
    downvoteCount: 1,
    verifications: ['dan@gmail.com', 'fred@gmail.com'],
    aiConfidence: 0.89,
    aiReasoning: 'Visual detection identifies multiple low-density polyethylene garbage bags and bulk domestic refuse accumulated in a non-permitted urban zone.'
  },
  {
    id: 'issue-103',
    title: 'Broken Streetlight - Dark Sidewalk',
    description: 'The double-head streetlamp is completely dark, leaving the entire pedestrian path outside the elementary school pitch black at night. Huge safety risk.',
    category: 'streetlight',
    status: 'reported',
    severity: 'medium',
    department: 'Department of Energy & Lighting',
    reporterName: 'Marcus Brodie',
    reporterEmail: 'marcus.b@gmail.com',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), // 8 hours ago
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    latitude: 47.6035,
    longitude: -122.3112,
    address: '900 Broadway, Seattle, WA 98122',
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=600',
    verificationCount: 4,
    downvoteCount: 0,
    verifications: [],
    aiConfidence: 0.81,
    aiReasoning: 'Detected non-illuminating luminaire housing. Correlated with local sunset schedule to confirm anomaly.'
  },
  {
    id: 'issue-104',
    title: 'Major Water Main Leak',
    description: 'Freshwater is bubbling up rapidly from under the concrete sidewalk, creating a massive puddle and flooding the bike lane. Stream has been constant for 12 hours.',
    category: 'leakage',
    status: 'resolved',
    severity: 'high',
    department: 'Department of Public Utilities (Water & Gas)',
    reporterName: 'Sophia Lin',
    reporterEmail: 'sophia@gmail.com',
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    latitude: 47.5955,
    longitude: -122.3326,
    address: '820 2nd Ave S, Seattle, WA 98104',
    imageUrl: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=600',
    verificationCount: 38,
    downvoteCount: 0,
    verifications: ['alice@gmail.com', 'jordan@gmail.com', 'sophia@gmail.com', 'clara@gmail.com'],
    resolutionProofUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=600',
    resolutionProofDescription: 'Water Utility crew replaced the fractured 4-inch ductile iron valve assembly and patched the sidewalk base.',
    aiConfidence: 0.96,
    aiReasoning: 'Hydrological structural hazard identified. High-pressure water effluent emerging through pavement expansion joints at rate exceeding 10 gallons/minute.'
  }
];

export const PREDICTIVE_HOTSPOTS: PredictiveHotspot[] = [
  {
    id: 'predict-1',
    region: 'Capitol Hill Corridor',
    category: 'pothole',
    riskScore: 88,
    reasoning: 'Combination of intense winter freezes, high-traffic bus routing, and aging 1970s subgrade layers indicates a high probability of structural fatigue. An average of 14 new potholes are predicted in this 0.5-mile zone over the next 30 days.',
    coordinates: { lat: 47.6145, lng: -122.3210 },
    predictedTimeline: 'Expected peak: Late Winter / Early Spring thaw cycle'
  },
  {
    id: 'predict-2',
    region: 'Industrial District South',
    category: 'garbage',
    riskScore: 74,
    reasoning: 'Statistical correlation with historic illegal dumping patterns reveals elevated commercial refuse discharge on bi-weekly weekend cycles. Heavy blind-spot alleys identified near railroad lines.',
    coordinates: { lat: 47.5810, lng: -122.3312 },
    predictedTimeline: 'High probability window: Friday and Saturday nights'
  },
  {
    id: 'predict-3',
    region: 'Waterfront Boulevard Pedestrian Path',
    category: 'leakage',
    riskScore: 65,
    reasoning: 'Underground soil moisture sensor arrays indicate anomalous ground shift and hydraulic pressure spikes, suggesting potential subterranean service pipe erosion.',
    coordinates: { lat: 47.6062, lng: -122.3421 },
    predictedTimeline: 'Preventative inspection recommended before high-demand tourist season (June)'
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Jordan Vance', points: 480, reportsCount: 12, role: 'Civic Sentinel' },
  { rank: 2, name: 'Sophia Lin', points: 390, reportsCount: 9, role: 'Active Neighbor' },
  { rank: 3, name: 'Marcus Brodie', points: 310, reportsCount: 7, role: 'Pathfinder' },
  { rank: 4, name: 'Elena Carter', points: 280, reportsCount: 6, role: 'Local Guardian' },
  { rank: 5, name: 'Toby McArthur', points: 250, reportsCount: 5, role: 'Street Inspector' }
];

export const SYSTEM_STATS = {
  totalIssuesReported: 412,
  activeIssues: 18,
  resolvedIssues: 384,
  citizensRegistered: 1248,
  communityPointsAwarded: 14230,
  averageResolutionTimeHours: 26.4
};
