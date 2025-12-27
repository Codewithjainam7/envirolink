// Shared Types with Citizen App
export type ReportStatus = 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type WasteCategory = 'illegal_dumping' | 'overflowing_bin' | 'littering' | 'construction_debris' | 'e_waste' | 'organic_waste' | 'hazardous_waste';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Location {
    latitude: number;
    longitude: number;
    address: string;
    locality?: string;
    city?: string;
}

export interface Report {
    id: string;
    reportId: string;
    location: Location;
    images?: { id: string; url: string; thumbnailUrl?: string }[];
    category: WasteCategory;
    severity: Severity;
    status: ReportStatus;
    description?: string;
    reporterName?: string;
    isAnonymous: boolean;
    assignedTo?: {
        departmentId: string;
        departmentName: string;
        workerId?: string;
        workerName?: string;
    };
    slaHours: number;
    slaDueAt: string;
    isSlaBreach: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
    totalReports: number;
    newReports: number;
    inProgress: number;
    resolved: number;
    slaBreach: number;
    resolutionRate: number;
    avgResolutionHours: number;
}

export interface Worker {
    id: string;
    name: string;
    department: string;
    activeTasksCount: number;
    completedToday: number;
    status: 'online' | 'offline' | 'busy';
}

export const WASTE_CATEGORIES: Record<WasteCategory, { label: string; icon: string; color: string }> = {
    illegal_dumping: { label: 'Illegal Dumping', icon: 'Trash2', color: '#ef4444' },
    overflowing_bin: { label: 'Overflowing Bin', icon: 'Package', color: '#f97316' },
    littering: { label: 'Littering', icon: 'Recycle', color: '#22c55e' },
    construction_debris: { label: 'Construction', icon: 'Construction', color: '#eab308' },
    e_waste: { label: 'E-Waste', icon: 'Cpu', color: '#8b5cf6' },
    organic_waste: { label: 'Organic', icon: 'Leaf', color: '#10b981' },
    hazardous_waste: { label: 'Hazardous', icon: 'AlertTriangle', color: '#dc2626' },
};

export const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: string; color: string; bgColor: string }> = {
    submitted: { label: 'New', variant: 'open', color: '#ef4444', bgColor: '#fee2e2' },
    under_review: { label: 'Review', variant: 'open', color: '#f97316', bgColor: '#ffedd5' },
    assigned: { label: 'Assigned', variant: 'progress', color: '#eab308', bgColor: '#fef9c3' },
    in_progress: { label: 'In Progress', variant: 'progress', color: '#3b82f6', bgColor: '#dbeafe' },
    resolved: { label: 'Resolved', variant: 'resolved', color: '#10b981', bgColor: '#d1fae5' },
    closed: { label: 'Closed', variant: 'resolved', color: '#6b7280', bgColor: '#f3f4f6' },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
    low: { label: 'Low', color: '#22c55e' },
    medium: { label: 'Medium', color: '#eab308' },
    high: { label: 'High', color: '#f97316' },
    critical: { label: 'Critical', color: '#ef4444' },
};
