export type Severity = 'low' | 'medium' | 'high';

export interface RoadReport {
  id?: string | number;
  hazard_type: string;
  severity: Severity;
  confidence: number;
  description: string;
  ai_analysis: string;
  latitude: number;
  longitude: number;
  upvotes: number;
  timestamp: string;
}

export interface DashboardStats {
  total: number;
  highSeverity: number;
  mostCommon: string;
}

export const HAZARD_TYPES = [
  'pothole',
  'crack',
  'waterlogging',
  'obstacle',
  'debris',
  'damaged road'
];
