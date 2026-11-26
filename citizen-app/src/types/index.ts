// Report Types
export type ReportStatus = 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';

export type WasteCategory =
  | 'illegal_dumping'
  | 'overflowing_bin'
  | 'littering'
  | 'construction_debris'
  | 'e_waste'
  | 'organic_waste';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type VolumeEstimate = 'small' | 'medium' | 'large';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  locality?: string;
  city?: string;
}

export interface ReportImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
  aiAnalysis?: {
    wasteType: WasteCategory;
    volume: VolumeEstimate;
    confidence: number;
    detectedObjects: string[];
  };
}

export interface StatusHistoryItem {
  status: ReportStatus;
  timestamp: string;
  changedBy?: string;
  notes?: string;
}

export interface Report {
  id: string;
  reportId: string;
  location: Location;
  images: ReportImage[];
  category: WasteCategory;
  severity: Severity;
  estimatedVolume: VolumeEstimate;
  description?: string;
  reporterId?: string;
  isAnonymous: boolean;
  status: ReportStatus;
  pointsAwarded?: boolean;
  requiresReview?: boolean;
  rejectionReason?: string;
  statusHistory: StatusHistoryItem[];
  assignedTo?: {
    departmentId: string;
    departmentName: string;
    workerId?: string;
    workerName?: string;
    assignedAt: string;
  };
  resolution?: {
    beforeImages: string[];
    afterImages: string[];
    notes: string;
    completedAt: string;
    completedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

// User Types
export type UserRole = 'citizen' | 'field_worker' | 'authority' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    preferredLanguage: string;
  };
  role: UserRole;
  engagement: {
    totalReports: number;
    resolvedReports: number;
    badges: string[];
    points: number;
    rank: string;
    trustScore?: number;
    falseReportsCount?: number;
  };
  preferences: {
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
    darkMode: boolean;
    locationSharing: boolean;
  };
  isVerified: boolean;
  createdAt: string;
}

// Stats Types
export interface CityStats {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolutionRate: number;
  averageResolutionHours: number;
  cleanlinessScore: number;
}

// Category Metadata - Using Lucide icon names
export const WASTE_CATEGORIES: Record<WasteCategory, { label: string; iconName: string; color: string }> = {
  illegal_dumping: { label: 'Illegal Dumping', iconName: 'Trash2', color: '#ef4444' },
  overflowing_bin: { label: 'Overflowing Bin', iconName: 'PackageOpen', color: '#f59e0b' },
  littering: { label: 'Littering', iconName: 'Wind', color: '#eab308' },
  construction_debris: { label: 'Construction', iconName: 'HardHat', color: '#6b7280' },
  e_waste: { label: 'E-Waste', iconName: 'Cpu', color: '#3b82f6' },
  organic_waste: { label: 'Organic', iconName: 'Leaf', color: '#10b981' },
};

export const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  submitted: { label: 'Submitted', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  under_review: { label: 'Under Review', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  assigned: { label: 'Assigned', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  resolved: { label: 'Resolved', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  closed: { label: 'Closed', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
};

const EXTRA_CATEGORY_META: Record<string, { label: string; iconName: string; color: string }> = {
  sewage_overflow: { label: 'Sewage Overflow', iconName: 'Droplets', color: '#06b6d4' },
  dead_animal: { label: 'Dead Animal', iconName: 'Bug', color: '#84cc16' },
  burning_waste: { label: 'Burning Waste', iconName: 'Flame', color: '#dc2626' },
  abandoned_vehicle: { label: 'Abandoned Vehicle', iconName: 'Car', color: '#6366f1' },
  hazardous_material: { label: 'Hazardous Material', iconName: 'AlertTriangle', color: '#eab308' },
  hazardous_waste: { label: 'Hazardous Waste', iconName: 'AlertTriangle', color: '#eab308' },
  electrical_hazard: { label: 'Electrical Hazard', iconName: 'Zap', color: '#f43f5e' },
};

export function getWasteCategoryMeta(category?: string | null): { label: string; iconName: string; color: string } {
  if (!category) return { label: 'Waste Issue', iconName: 'Trash2', color: '#10b981' };
  const primary = (WASTE_CATEGORIES as Record<string, { label: string; iconName: string; color: string }>)[category];
  if (primary) return primary;
  if (EXTRA_CATEGORY_META[category]) return EXTRA_CATEGORY_META[category];
  return {
    label: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    iconName: 'Trash2',
    color: '#6b7280',
  };
}

export function getStatusMeta(status?: string | null): { label: string; color: string; bgColor: string } {
  if (!status) return STATUS_CONFIG.submitted;
  const known = (STATUS_CONFIG as Record<string, { label: string; color: string; bgColor: string }>)[status];
  if (known) return known;
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.12)',
  };
}
