export interface Location {
    latitude: number;
    longitude: number;
    address: string;
    locality: string;
    city: string;
}

export interface Report {
    id: string;
    reportId: string;
    location: Location;
    category: string;
    severity: string;
    status: string;
    description?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: {
        departmentId: string;
        departmentName: string;
        workerId: string;
        workerName: string;
    };
    reward?: number; // Worker specific field
}

export const WASTE_CATEGORIES: Record<string, { label: string; icon?: any; color?: string }> = {
    illegal_dumping: { label: 'Illegal Dumping', color: '#ef4444' },
    overflowing_bin: { label: 'Overflowing Bin', color: '#f59e0b' },
    construction_debris: { label: 'Construction Debris', color: '#6366f1' },
    littering: { label: 'Littering', color: '#8b5cf6' },
    organic_waste: { label: 'Organic Waste', color: '#10b981' },
    hazardous_waste: { label: 'Hazardous Waste', color: '#dc2626' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    submitted: { label: 'Submitted', color: 'text-red-600', bgColor: 'bg-red-100' },
    assigned: { label: 'Assigned', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    resolved: { label: 'Resolved', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    closed: { label: 'Closed', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};
