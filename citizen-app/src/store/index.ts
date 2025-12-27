import { create } from 'zustand';
import { Report, User, CityStats, WasteCategory, Location } from '@/types';

// Mock data for reports
const mockReports: Report[] = [
    {
        id: '1',
        reportId: 'RPT-2024-000001',
        location: {
            latitude: 19.076,
            longitude: 72.8777,
            address: '123 Marine Drive',
            locality: 'Churchgate',
            city: 'Mumbai',
        },
        images: [],
        category: 'illegal_dumping',
        severity: 'high',
        estimatedVolume: 'large',
        description: 'Large pile of construction waste dumped illegally',
        isAnonymous: false,
        status: 'in_progress',
        statusHistory: [
            { status: 'submitted', timestamp: '2024-12-24T10:30:00Z' },
            { status: 'under_review', timestamp: '2024-12-24T11:00:00Z' },
            { status: 'assigned', timestamp: '2024-12-24T14:00:00Z', notes: 'Assigned to SWM Team-A' },
            { status: 'in_progress', timestamp: '2024-12-25T09:00:00Z' },
        ],
        assignedTo: {
            departmentId: 'dept-1',
            departmentName: 'Solid Waste Management',
            workerId: 'worker-1',
            workerName: 'Rajesh Kumar',
            assignedAt: '2024-12-24T14:00:00Z',
        },
        createdAt: '2024-12-24T10:30:00Z',
        updatedAt: '2024-12-25T09:00:00Z',
    },
    {
        id: '2',
        reportId: 'RPT-2024-000002',
        location: {
            latitude: 19.082,
            longitude: 72.881,
            address: '45 Linking Road',
            locality: 'Bandra',
            city: 'Mumbai',
        },
        images: [],
        category: 'overflowing_bin',
        severity: 'medium',
        estimatedVolume: 'medium',
        description: 'Community bin overflowing for 2 days',
        isAnonymous: true,
        status: 'submitted',
        statusHistory: [
            { status: 'submitted', timestamp: '2024-12-25T08:00:00Z' },
        ],
        createdAt: '2024-12-25T08:00:00Z',
        updatedAt: '2024-12-25T08:00:00Z',
    },
    {
        id: '3',
        reportId: 'RPT-2024-000003',
        location: {
            latitude: 19.065,
            longitude: 72.865,
            address: '78 Colaba Causeway',
            locality: 'Colaba',
            city: 'Mumbai',
        },
        images: [],
        category: 'littering',
        severity: 'low',
        estimatedVolume: 'small',
        isAnonymous: false,
        status: 'resolved',
        statusHistory: [
            { status: 'submitted', timestamp: '2024-12-20T15:00:00Z' },
            { status: 'assigned', timestamp: '2024-12-20T16:00:00Z' },
            { status: 'in_progress', timestamp: '2024-12-21T09:00:00Z' },
            { status: 'resolved', timestamp: '2024-12-21T11:00:00Z' },
        ],
        resolution: {
            beforeImages: [],
            afterImages: [],
            notes: 'Area cleaned successfully',
            completedAt: '2024-12-21T11:00:00Z',
            completedBy: 'Amit Shah',
        },
        createdAt: '2024-12-20T15:00:00Z',
        updatedAt: '2024-12-21T11:00:00Z',
    },
];

const mockUser: User = {
    id: 'user-1',
    email: 'rahul@example.com',
    phone: '+91-9876543210',
    profile: {
        firstName: 'Rahul',
        lastName: 'Sharma',
        avatar: '/images/avatar.jpg',
        preferredLanguage: 'en',
    },
    role: 'citizen',
    engagement: {
        totalReports: 15,
        resolvedReports: 12,
        badges: ['first_report', 'community_hero', 'streak_7'],
        points: 250,
        rank: 'Silver Reporter',
    },
    preferences: {
        notifications: { push: true, email: true, sms: false },
        darkMode: false,
        locationSharing: true,
    },
    isVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
};

const mockStats: CityStats = {
    totalReports: 12345,
    resolvedReports: 11892,
    pendingReports: 321,
    inProgressReports: 132,
    resolutionRate: 96.3,
    averageResolutionHours: 18,
    cleanlinessScore: 85,
};

// App Store
interface AppState {
    // User
    user: User | null;
    isAuthenticated: boolean;

    // Reports
    reports: Report[];
    userReports: Report[];
    selectedReport: Report | null;

    // City Stats
    cityStats: CityStats;

    // UI State
    isLoading: boolean;
    isReportSheetOpen: boolean;

    // New Report Form
    newReport: {
        images: string[];
        location: Location | null;
        category: WasteCategory | null;
        description: string;
        isAnonymous: boolean;
    };

    // Actions
    setUser: (user: User | null) => void;
    setReports: (reports: Report[]) => void;
    setSelectedReport: (report: Report | null) => void;
    setIsLoading: (loading: boolean) => void;
    setIsReportSheetOpen: (open: boolean) => void;
    updateNewReport: (data: Partial<AppState['newReport']>) => void;
    resetNewReport: () => void;
    submitReport: () => Promise<void>;
    fetchReports: () => Promise<void>;
    fetchUserReports: () => Promise<void>;
}

const initialNewReport = {
    images: [],
    location: null,
    category: null,
    description: '',
    isAnonymous: false,
};

// LocalStorage helpers for persistence
const STORAGE_KEY = 'envirolink_reports';

const saveToLocalStorage = (reports: Report[]) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        } catch (e) {
            console.error('Failed to save reports to localStorage:', e);
        }
    }
};

const loadFromLocalStorage = (): Report[] | null => {
    if (typeof window !== 'undefined') {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load reports from localStorage:', e);
        }
    }
    return null;
};

// Get initial reports - from localStorage if available, otherwise mock data
const getInitialReports = (): Report[] => {
    const stored = loadFromLocalStorage();
    return stored && stored.length > 0 ? stored : mockReports;
};

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State
    user: mockUser,
    isAuthenticated: true,
    reports: typeof window !== 'undefined' ? getInitialReports() : mockReports,
    userReports: typeof window !== 'undefined' ? getInitialReports().filter(r => !r.isAnonymous) : mockReports.filter(r => !r.isAnonymous),
    selectedReport: null,
    cityStats: mockStats,
    isLoading: false,
    isReportSheetOpen: false,
    newReport: initialNewReport,

    // Actions
    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setReports: (reports) => {
        saveToLocalStorage(reports);
        set({ reports });
    },

    setSelectedReport: (report) => set({ selectedReport: report }),

    setIsLoading: (isLoading) => set({ isLoading }),

    setIsReportSheetOpen: (isReportSheetOpen) => set({ isReportSheetOpen }),

    updateNewReport: (data) => set((state) => ({
        newReport: { ...state.newReport, ...data },
    })),

    resetNewReport: () => set({ newReport: initialNewReport }),

    submitReport: async () => {
        const { newReport, reports, user } = get();
        set({ isLoading: true });

        const newReportData: Report = {
            id: `${Date.now()}`,
            reportId: `RPT-2025-${String(reports.length + 1).padStart(6, '0')}`,
            location: newReport.location!,
            images: newReport.images.map((url, i) => ({
                id: `img-${Date.now()}-${i}`,
                url,
                thumbnailUrl: url,
                uploadedAt: new Date().toISOString(),
            })),
            category: newReport.category!,
            severity: 'medium',
            estimatedVolume: 'medium',
            description: newReport.description,
            reporterId: newReport.isAnonymous ? undefined : user?.id,
            isAnonymous: newReport.isAnonymous,
            status: 'submitted',
            statusHistory: [
                { status: 'submitted', timestamp: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedReports = [newReportData, ...reports];
        saveToLocalStorage(updatedReports);

        // Sync to shared file via API for admin dashboard
        try {
            await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: newReportData.location,
                    category: newReportData.category,
                    severity: newReportData.severity,
                    description: newReportData.description,
                    isAnonymous: newReportData.isAnonymous,
                    reporterName: newReport.isAnonymous ? undefined : `${user?.profile?.firstName} ${user?.profile?.lastName}`,
                }),
            });
        } catch (e) {
            console.log('Failed to sync with shared storage:', e);
        }

        set({
            reports: updatedReports,
            userReports: newReport.isAnonymous ? get().userReports : [newReportData, ...get().userReports],
            newReport: initialNewReport,
            isReportSheetOpen: false,
            isLoading: false,
        });
    },

    fetchReports: async () => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({ reports: mockReports, isLoading: false });
    },

    fetchUserReports: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({
            userReports: mockReports.filter(r => !r.isAnonymous),
            isLoading: false
        });
    },
}));
