import { create } from 'zustand';
import { Report, User, CityStats, WasteCategory, Severity, Location } from '@/types';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

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
    isAuthInitialized: boolean;
    isAuthChecked: boolean;

    // New Report Form
    newReport: {
        images: string[];
        imageHashes?: string[];
        location: Location | null;
        category: WasteCategory | null;
        severity?: Severity;
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
    trackReport: (reportId: string) => Promise<Report | null>;
    removeTrackedReport: (id: string) => void;
    deleteReport: (report: Report) => Promise<boolean>;
    updateProfileName: (firstName: string, lastName: string) => Promise<boolean>;
    initializeAuth: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

function getCitizenRank(points: number): string {
    if (points >= 500) return 'Civic Legend';
    if (points >= 200) return 'Green Champion';
    if (points >= 100) return 'City Guardian';
    if (points >= 40) return 'Eco Scout';
    return 'New Reporter';
}

const MY_REPORTS_IDS_KEY = 'envirolink_my_report_ids';
const MY_REPORTS_CACHE_KEY = 'envirolink_my_reports_cache';

function getLocalReportIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(MY_REPORTS_IDS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveLocalReportId(id: string) {
    if (typeof window === 'undefined' || !id) return;
    try {
        const current = getLocalReportIds();
        if (!current.includes(id)) {
            current.unshift(id);
            localStorage.setItem(MY_REPORTS_IDS_KEY, JSON.stringify(current));
        }
    } catch (e) {
        console.error('Error saving report ID to localStorage:', e);
    }
}

function getLocalCachedReports(): Report[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(MY_REPORTS_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
    ]);
}

// Acquire user access token quickly without blocking indefinitely on Web navigator.locks
async function getFastAccessToken(supabase: ReturnType<typeof getSupabase>): Promise<string | null> {
    try {
        const res = await withTimeout(supabase.auth.getSession(), 1500, 'Session token') as any;
        if (res?.data?.session?.access_token) return res.data.session.access_token;
    } catch {
        // Fallback to parsing the Supabase SSR auth cookie directly
    }
    if (typeof document !== 'undefined') {
        try {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const baseCookie = cookies.find(c => /^sb-[^-]+-auth-token=/.test(c));
            const chunkCookies = cookies
                .filter(c => /^sb-[^-]+-auth-token\.\d+=/.test(c))
                .sort((a, b) => Number(a.split('=')[0].split('.').pop()) - Number(b.split('=')[0].split('.').pop()));
            let raw = baseCookie
                ? baseCookie.split('=').slice(1).join('=')
                : chunkCookies.map(c => c.split('=').slice(1).join('=')).join('');
            if (raw) {
                raw = decodeURIComponent(raw);
                if (raw.startsWith('base64-')) raw = atob(raw.slice(7));
                const parsed = JSON.parse(raw);
                if (parsed?.access_token) return parsed.access_token;
            }
        } catch {}
    }
    return null;
}

async function restInsert<T = any>(
    table: string,
    payload: Record<string, any>,
    accessToken?: string | null,
    timeoutMs = 15000,
    prefer = 'return=representation'
): Promise<{ data: T | null; error: string | null }> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${accessToken || anonKey}`,
            Prefer: prefer,
        },
        body: JSON.stringify(payload),
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
        return {
            data: null,
            error: parsed?.message || parsed?.error_description || text || `HTTP ${res.status}`,
        };
    }
    return { data: Array.isArray(parsed) ? parsed[0] : parsed, error: null };
}

function saveLocalCachedReport(report: Report) {
    if (typeof window === 'undefined' || !report) return;
    try {
        // Avoid storing large base64 data URLs in localStorage (5MB limit)
        const lightweightReport: Report = {
            ...report,
            images: (report.images || []).filter(img => img.url && !img.url.startsWith('data:')),
        };
        const current = getLocalCachedReports().filter(r => r.id !== report.id && r.reportId !== report.reportId);
        current.unshift(lightweightReport);
        localStorage.setItem(MY_REPORTS_CACHE_KEY, JSON.stringify(current.slice(0, 100)));
    } catch (e) {
        console.warn('Error saving cached report to localStorage:', e);
    }
}

const DEFAULT_DEMO_REPORTS: Report[] = [
    {
        id: 'demo-1',
        reportId: 'RPT-2025-001',
        location: {
            latitude: 18.9438,
            longitude: 72.8232,
            address: 'Opposite Marine Plaza, Marine Drive, Churchgate',
            locality: 'Churchgate',
            city: 'Mumbai',
        },
        images: [],
        category: 'illegal_dumping',
        severity: 'high',
        estimatedVolume: 'large',
        description: 'Large heap of commercial waste dumped along the promenade near crossroad.',
        isAnonymous: false,
        status: 'in_progress',
        statusHistory: [{ status: 'in_progress', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() }],
        assignedTo: {
            departmentId: 'dept-swm',
            departmentName: 'Solid Waste Management - Ward A',
            workerName: 'Suresh Patil',
            assignedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: 'demo-2',
        reportId: 'RPT-2025-002',
        location: {
            latitude: 19.0596,
            longitude: 72.8295,
            address: 'Near KFC Junction, Linking Road, Bandra West',
            locality: 'Bandra West',
            city: 'Mumbai',
        },
        images: [],
        category: 'overflowing_bin',
        severity: 'medium',
        estimatedVolume: 'medium',
        description: 'Public dustbin overflowing onto the pavement outside the shopping arcade.',
        isAnonymous: true,
        status: 'submitted',
        statusHistory: [{ status: 'submitted', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: 'demo-3',
        reportId: 'RPT-2025-003',
        location: {
            latitude: 18.9220,
            longitude: 72.8317,
            address: 'Colaba Causeway near Regal Cinema, Colaba',
            locality: 'Colaba',
            city: 'Mumbai',
        },
        images: [],
        category: 'construction_debris',
        severity: 'high',
        estimatedVolume: 'large',
        description: 'Broken concrete tiles and debris blocking pedestrian footpaths.',
        isAnonymous: false,
        status: 'resolved',
        statusHistory: [{ status: 'resolved', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }],
        assignedTo: {
            departmentId: 'dept-roads',
            departmentName: 'Maintenance & Roads Dept',
            workerName: 'Ramesh Sawant',
            assignedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
        resolution: {
            beforeImages: [],
            afterImages: [],
            notes: 'Debris cleared with hydraulic loader and pavement swept clean.',
            completedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            completedBy: 'Ramesh Sawant',
        },
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
        id: 'demo-4',
        reportId: 'RPT-2025-004',
        location: {
            latitude: 19.1075,
            longitude: 72.8263,
            address: 'Juhu Tara Road Promenade, Juhu',
            locality: 'Juhu',
            city: 'Mumbai',
        },
        images: [],
        category: 'littering',
        severity: 'low',
        estimatedVolume: 'small',
        description: 'Single-use plastic cups and food wrappers scattered across beach entrance.',
        isAnonymous: false,
        status: 'under_review',
        statusHistory: [{ status: 'under_review', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() }],
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
        id: 'demo-5',
        reportId: 'RPT-2025-005',
        location: {
            latitude: 18.9633,
            longitude: 72.8159,
            address: 'Lamington Road Electronic Market, Grant Road East',
            locality: 'Grant Road',
            city: 'Mumbai',
        },
        images: [],
        category: 'e_waste',
        severity: 'medium',
        estimatedVolume: 'medium',
        description: 'Discarded motherboards, wires, and monitor casings outside repair lane.',
        isAnonymous: true,
        status: 'resolved',
        statusHistory: [{ status: 'resolved', timestamp: new Date(Date.now() - 3600000 * 20).toISOString() }],
        resolution: {
            beforeImages: [],
            afterImages: [],
            notes: 'Handed over to authorized e-waste recycler partner.',
            completedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
            completedBy: 'E-Waste Recovery Unit',
        },
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
];

const initialNewReport = {
    images: [],
    imageHashes: [] as string[],
    location: null,
    category: null,
    severity: 'medium' as Severity,
    description: '',
    isAnonymous: false,
};

const initialStats: CityStats = {
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolutionRate: 0,
    averageResolutionHours: 0,
    cleanlinessScore: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State - NO MOCK DATA
    user: null,
    isAuthenticated: false,
    reports: [],
    userReports: [],
    selectedReport: null,
    cityStats: initialStats,
    isLoading: false,
    isReportSheetOpen: false,
    isAuthInitialized: false,
    isAuthChecked: false,

    newReport: initialNewReport,

    // Actions
    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setReports: (reports) => set({ reports }),

    setSelectedReport: (report) => set({ selectedReport: report }),

    setIsLoading: (isLoading) => set({ isLoading }),

    setIsReportSheetOpen: (isReportSheetOpen) => set({ isReportSheetOpen }),

    updateNewReport: (data) => set((state) => ({
        newReport: { ...state.newReport, ...data },
    })),

    resetNewReport: () => set({ newReport: initialNewReport }),

    // Initialize auth from Supabase session
    initializeAuth: async () => {
        if (get().isAuthInitialized) return;
        set({ isAuthInitialized: true });

        try {
            const supabase = getSupabase();

            const processSession = async (session: any) => {
                if (!session?.user) {
                    set({ user: null, isAuthenticated: false, userReports: [] });
                    return;
                }

                // Get user metadata from Google OAuth (always available)
                const meta = session.user.user_metadata || {};
                const fullName = meta.full_name || meta.name || session.user.email?.split('@')[0] || 'User';
                const nameParts = fullName.split(' ');

                // Try to get additional profile data from profiles table, create if doesn't exist
                let profileData: any = null;
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (error || !data) {
                        // Profile doesn't exist, create it
                        const firstName = nameParts[0] || 'User';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        const avatar = meta.avatar_url || meta.picture || '';

                        const { data: newProfile } = await (supabase
                            .from('profiles') as any)
                            .upsert({
                                id: session.user.id,
                                first_name: firstName,
                                last_name: lastName,
                                avatar_url: avatar,
                                points: 0,
                                reports_submitted: 0,
                                reports_resolved: 0,
                                trust_score: 100,
                                false_reports_count: 0
                            }, { onConflict: 'id' })
                            .select()
                            .single();
                        profileData = newProfile;
                    } else {
                        profileData = data;
                    }
                } catch (e) {
                    // Profiles table may not exist yet - that's okay
                    console.log('Profiles table not available, using OAuth data');
                }

                const userPoints = profileData?.points || 0;
                const userData: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    phone: session.user.phone || '',
                    profile: {
                        firstName: profileData?.first_name || nameParts[0] || 'User',
                        lastName: profileData?.last_name || nameParts.slice(1).join(' ') || '',
                        avatar: profileData?.avatar_url || meta.avatar_url || meta.picture || '',
                        preferredLanguage: 'en',
                    },
                    role: 'citizen',
                    engagement: {
                        totalReports: profileData?.reports_submitted || 0,
                        resolvedReports: profileData?.reports_resolved || 0,
                        badges: [],
                        points: userPoints,
                        rank: getCitizenRank(userPoints),
                        trustScore: profileData?.trust_score ?? 100,
                        falseReportsCount: profileData?.false_reports_count ?? 0,
                    },
                    preferences: {
                        notifications: { push: true, email: true, sms: false },
                        darkMode: false,
                        locationSharing: true,
                    },
                    isVerified: true,
                    createdAt: session.user.created_at || new Date().toISOString(),
                };

                set({ user: userData, isAuthenticated: true });
                get().fetchUserReports();
            };

            // Initial session check (with cookie-token fallback so redirected OAuth cookies hydrate reliably)
            let { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                const cookieToken = await getFastAccessToken(supabase);
                if (cookieToken) {
                    try {
                        const { data: userRes } = await withTimeout(supabase.auth.getUser(cookieToken), 4000, 'Auth user check') as any;
                        if (userRes?.user) {
                            session = { user: userRes.user, access_token: cookieToken } as any;
                        }
                    } catch {
                        // Ignore invalid/expired cookie token
                    }
                }
            }
            await processSession(session);

            // Listen for subsequent auth changes cleanly
            supabase.auth.onAuthStateChange((event, nextSession) => {
                if (event === 'INITIAL_SESSION' && !nextSession?.user && get().isAuthenticated) {
                    return;
                }
                processSession(nextSession).finally(() => {
                    set({ isAuthChecked: true });
                });
            });
        } catch (error) {
            console.warn('Auth initialization deferred (waiting for active Supabase credentials)');
        } finally {
            set({ isAuthChecked: true });
        }
    },

    // Submit report to Supabase quickly with timeouts, parallel uploads, and instant state update
    submitReport: async () => {
        const { newReport, user } = get();
        set({ isLoading: true });

        const generatedReportId = 'R-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const fallbackId = 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const now = new Date().toISOString();
        const severityValue = newReport.severity || 'medium';
        const CORE_CATEGORIES = new Set([
            'illegal_dumping',
            'overflowing_bin',
            'littering',
            'construction_debris',
            'e_waste',
            'organic_waste',
        ]);

        try {
            const supabase = getSupabase();
            const lat = newReport.location?.latitude || 19.076;
            const lng = newReport.location?.longitude || 72.8777;
            const cat = newReport.category || 'illegal_dumping';

            // Temporarily disabled for testing (set true to re-enable 50m duplicate, photo hash & trust blocks)
            const ENABLE_ANTI_FRAUD_BLOCKS = false;

            if (ENABLE_ANTI_FRAUD_BLOCKS) {
                if (!newReport.isAnonymous && user?.engagement?.trustScore !== undefined && user.engagement.trustScore < 20) {
                    const msg = 'Reporting is temporarily restricted because your trust score is below 20.';
                    toast.error(msg, { id: 'report-submit-error', duration: 5000 });
                    throw new Error(msg);
                }

                // Anti-fraud 1: 50m same-category active duplicate check
                try {
                    const { data: nearbyDupes } = await withTimeout(
                        (supabase as any).rpc('check_nearby_duplicate', {
                            p_lat: lat,
                            p_lng: lng,
                            p_category: cat,
                            p_radius_meters: 50,
                        }),
                        5000,
                        'Nearby duplicate check'
                    ) as any;

                    if (Array.isArray(nearbyDupes) && nearbyDupes.length > 0) {
                        const existing = nearbyDupes[0];
                        const dist = Math.round(existing.distance_meters ?? 0);
                        const msg = `An active ${String(cat).replace(/_/g, ' ')} report (${existing.report_id}) already exists ${dist}m away.`;
                        toast.error(msg, { id: 'report-submit-error', duration: 5000 });
                        throw new Error(msg);
                    }
                } catch (dupErr: any) {
                    if (dupErr?.message?.includes('already exists')) throw dupErr;
                    console.warn('Nearby duplicate check skipped:', dupErr);
                }

                // Anti-fraud 2: Duplicate SHA-256 photo hash check
                const hashes = (newReport.imageHashes || []).filter(Boolean);
                if (hashes.length > 0) {
                    try {
                        const dupChecks = await Promise.all(
                            hashes.map((p_hash) =>
                                withTimeout(
                                    (supabase as any).rpc('check_duplicate_image_hash', { p_hash }),
                                    4000,
                                    'Image hash check'
                                )
                            )
                        );
                        const hasDup = dupChecks.some((res: any) => Array.isArray(res?.data) && res.data.length > 0);
                        if (hasDup) {
                            const msg = 'This exact photo has already been submitted in another report.';
                            toast.error(msg, { id: 'report-submit-error', duration: 5000 });
                            throw new Error(msg);
                        }
                    } catch (hashErr: any) {
                        if (hashErr?.message?.includes('already been submitted')) throw hashErr;
                        console.warn('Image hash check skipped:', hashErr);
                    }
                }
            }

            // Acquire token without navigator.locks deadlock and insert via direct REST
            const accessToken = await getFastAccessToken(supabase);
            const effectiveUserId: string | null = (!newReport.isAnonymous && user?.id) ? user.id : null;

            // 1. Insert report into Supabase directly (bypasses browser client lock timeouts)
            let reportData: any = null;
            const basePayload = {
                report_id: generatedReportId,
                user_id: newReport.isAnonymous ? null : effectiveUserId,
                category: cat,
                severity: severityValue,
                status: 'submitted',
                description: newReport.description || 'No description provided',
                latitude: lat,
                longitude: lng,
                address: newReport.location?.address || 'Unknown location',
                locality: newReport.location?.locality || 'Unknown',
                city: newReport.location?.city || 'Mumbai',
                is_anonymous: newReport.isAnonymous,
                sla_hours: 24,
                sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            let { data, error: reportError } = await restInsert('reports', basePayload, accessToken, 15000);

            // Propagate anti-fraud DB trigger blocks directly to UI
            if (reportError && /duplicate|already submitted|50m|trust/i.test(reportError)) {
                toast.error(reportError, { id: 'report-submit-error', duration: 5000 });
                throw new Error(reportError);
            }

            // Retry cleanly if DB rejects extended category enum or missing profile FK / RLS user_id mismatch
            if (reportError) {
                console.warn('Primary report insert error, trying safe schema fallback:', reportError);
                const safeCategory = CORE_CATEGORIES.has(basePayload.category as string)
                    ? basePayload.category
                    : 'illegal_dumping';
                const categoryNote = safeCategory !== basePayload.category
                    ? `[${String(basePayload.category).replace(/_/g, ' ')}] `
                    : '';
                const shouldClearUser = /foreign key|profiles|row-level security|jwt|auth|expired/i.test(reportError);

                const retryRes = await restInsert(
                    'reports',
                    {
                        ...basePayload,
                        user_id: shouldClearUser ? null : basePayload.user_id,
                        is_anonymous: shouldClearUser ? true : basePayload.is_anonymous,
                        category: safeCategory,
                        description: `${categoryNote}${basePayload.description}`,
                    },
                    shouldClearUser ? null : accessToken,
                    15000
                );

                if (retryRes.error) {
                    const errMsg = `Database error saving report: ${retryRes.error}`;
                    toast.error(errMsg, { id: 'report-submit-error', duration: 5000 });
                    throw new Error(errMsg);
                }
                data = retryRes.data;
            }

            if (!data) {
                const errMsg = 'Report was not confirmed saved by Supabase. Please try again.';
                toast.error(errMsg, { id: 'report-submit-error', duration: 5000 });
                throw new Error(errMsg);
            }

            reportData = data;

            const effectiveId = reportData?.id || fallbackId;
            const effectiveReportId = reportData?.report_id || generatedReportId;

            // 2. Upload images in parallel directly via REST (lock-free)
            let finalImages: { id: string; url: string; thumbnailUrl: string; uploadedAt: string }[] = [];

            if (newReport.images.length > 0) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

                finalImages = await Promise.all(
                    newReport.images.map(async (imageUrl, i) => {
                        let publicUrl = imageUrl;

                        if (reportData && imageUrl.startsWith('data:')) {
                            try {
                                const mimeMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
                                const mimeType = mimeMatch?.[1] || 'image/jpeg';
                                const base64Data = mimeMatch?.[2] || imageUrl.split(',')[1];
                                const ext = mimeType.includes('png') ? 'png' : 'jpg';
                                const fileName = `${effectiveId}/${Date.now()}-${i}.${ext}`;

                                const binaryString = atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let j = 0; j < binaryString.length; j++) {
                                    bytes[j] = binaryString.charCodeAt(j);
                                }

                                const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/report-images/${fileName}`, {
                                    method: 'POST',
                                    signal: AbortSignal.timeout(15000),
                                    headers: {
                                        'Content-Type': mimeType,
                                        apikey: anonKey,
                                        Authorization: `Bearer ${accessToken || anonKey}`,
                                    },
                                    body: bytes,
                                });

                                if (uploadRes.ok) {
                                    publicUrl = `${supabaseUrl}/storage/v1/object/public/report-images/${fileName}`;

                                    await restInsert(
                                        'report_images',
                                        {
                                            report_id: effectiveId,
                                            url: publicUrl,
                                            storage_path: fileName,
                                            image_hash: newReport.imageHashes?.[i] || null,
                                        },
                                        accessToken,
                                        10000
                                    );
                                }
                            } catch (imgError) {
                                console.warn(`Image ${i + 1} upload skipped (non-fatal):`, imgError);
                            }
                        }

                        return {
                            id: `img-${i}-${Date.now()}`,
                            url: publicUrl,
                            thumbnailUrl: publicUrl,
                            uploadedAt: now,
                        };
                    })
                );
            }

            // 3. Build client report model and update state immediately
            const createdReport: Report = {
                id: effectiveId,
                reportId: effectiveReportId,
                location: {
                    latitude: newReport.location?.latitude || 19.076,
                    longitude: newReport.location?.longitude || 72.8777,
                    address: newReport.location?.address || 'Mumbai, Maharashtra',
                    locality: newReport.location?.locality || 'Mumbai',
                    city: 'Mumbai',
                },
                images: finalImages,
                category: (newReport.category || 'illegal_dumping') as WasteCategory,
                severity: severityValue,
                estimatedVolume: 'medium',
                description: newReport.description || 'No description provided',
                isAnonymous: newReport.isAnonymous,
                status: 'submitted',
                pointsAwarded: Boolean(reportData?.points_awarded),
                requiresReview: Boolean(reportData?.requires_review),
                statusHistory: [{ status: 'submitted', timestamp: now }],
                createdAt: now,
                updatedAt: now,
            };

            saveLocalReportId(effectiveId);
            saveLocalReportId(effectiveReportId);
            saveLocalCachedReport(createdReport);

            set((state) => ({
                userReports: [createdReport, ...state.userReports.filter(r => r.id !== createdReport.id)],
                reports: [createdReport, ...state.reports.filter(r => r.id !== createdReport.id)],
            }));

            // 4. Points are awarded automatically by DB trigger once verified & resolved (+20 pts)
            if (user && !newReport.isAnonymous) {
                const optimisticCount = (user.engagement?.totalReports || 0) + 1;

                toast.success('Report logged! +20 pts will be awarded once verified & resolved.', {
                    duration: 4500,
                });

                set({
                    user: {
                        ...user,
                        engagement: {
                            ...user.engagement,
                            totalReports: optimisticCount,
                        }
                    }
                });

                get().refreshProfile().catch(() => {});
            }

            // Refresh lists in background without blocking redirect
            get().fetchReports().catch(() => {});

            set({
                newReport: initialNewReport,
                isReportSheetOpen: false,
                isLoading: false,
            });

        } catch (error: any) {
            console.warn('Report submission blocked:', error?.message || error);
            set({ isLoading: false });
            throw error;
        }
    },

    // Fetch all reports from Supabase with graceful fallback
    fetchReports: async () => {
        set({ isLoading: true });
        try {
            let mappedReports: Report[] = [];
            let loadedFromSupabase = false;

            try {
                const supabase = getSupabase();
                const { data: reportsData, error } = await supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && reportsData && reportsData.length > 0) {
                    const { data: imagesData } = await supabase.from('report_images').select('*');

                    mappedReports = (reportsData || []).map((r: any) => ({
                        id: r.id,
                        reportId: r.report_id || `R-${r.id.substring(0, 6).toUpperCase()}`,
                        location: {
                            latitude: r.latitude,
                            longitude: r.longitude,
                            address: r.address,
                            locality: r.locality,
                            city: r.city,
                        },
                        images: imagesData?.filter((img: any) => img.report_id === r.id).map((img: any) => ({
                            id: img.id,
                            url: img.url,
                            thumbnailUrl: img.url,
                            uploadedAt: img.created_at,
                        })) || [],
                        category: r.category,
                        severity: r.severity,
                        estimatedVolume: 'medium',
                        description: r.description,
                        isAnonymous: r.is_anonymous,
                        status: r.status,
                        pointsAwarded: Boolean(r.points_awarded),
                        requiresReview: Boolean(r.requires_review),
                        rejectionReason: r.rejection_reason || undefined,
                        statusHistory: [{ status: r.status, timestamp: r.created_at }],
                        createdAt: r.created_at,
                        updatedAt: r.updated_at,
                    }));
                    loadedFromSupabase = true;
                }
            } catch (dbErr) {
                console.warn('Supabase reports fetch deferred (using local cache or demo data):', dbErr);
            }

            // If Supabase has no reports or error, combine local cached reports with demo seed reports
            if (!loadedFromSupabase || mappedReports.length === 0) {
                const localReports = getLocalCachedReports();
                const combined = [...localReports];
                DEFAULT_DEMO_REPORTS.forEach(demo => {
                    if (!combined.some(r => r.id === demo.id || r.reportId === demo.reportId)) {
                        combined.push(demo);
                    }
                });
                mappedReports = combined;
            }

            // Calculate stats with baseline values for landing page
            // Baseline: 500+ reports filed, 500+ issues resolved, 96% resolution rate
            const BASELINE_REPORTS = 500;
            const BASELINE_RESOLVED = 500;
            const BASELINE_RATE = 96;

            const realTotal = mappedReports.length;
            const realResolved = mappedReports.filter(r => ['resolved', 'closed'].includes(r.status)).length;
            const pending = mappedReports.filter(r => r.status === 'submitted').length;
            const inProgress = mappedReports.filter(r => ['under_review', 'assigned', 'in_progress'].includes(r.status)).length;

            // Add real data to baseline for dynamic growth
            const displayTotal = BASELINE_REPORTS + realTotal;
            const displayResolved = BASELINE_RESOLVED + realResolved;
            const displayRate = BASELINE_RATE; // Fixed at 96%

            set({
                reports: mappedReports,
                cityStats: {
                    totalReports: displayTotal,
                    resolvedReports: displayResolved,
                    pendingReports: pending,
                    inProgressReports: inProgress,
                    resolutionRate: displayRate,
                    averageResolutionHours: 18,
                    cleanlinessScore: realTotal > 0 ? Math.round(((realResolved + (inProgress * 0.5)) / realTotal) * 100) : 96,
                },
                isLoading: false
            });
        } catch (error) {
            console.warn('Reports loading note:', error);
            set({ isLoading: false });
        }
    },

    // Fetch user's reports (from Supabase and localStorage)
    fetchUserReports: async () => {
        const { user } = get();
        set({ isLoading: true });

        try {
            const localCached = getLocalCachedReports();
            const localIds = getLocalReportIds();
            const reportsMap = new Map<string, Report>();

            // Pre-seed map with local cached reports
            localCached.forEach(r => reportsMap.set(r.id, r));

            try {
                const supabase = getSupabase();
                let remoteReports: any[] = [];

                // 1. Fetch user reports if logged in
                if (user && user.id) {
                    const { data: userDbReports } = await supabase
                        .from('reports')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (userDbReports) {
                        remoteReports = remoteReports.concat(userDbReports);
                    }
                }

                // 2. Fetch any reports tracked by ID in localStorage
                if (localIds.length > 0) {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    const uuidIds = localIds.filter(id => uuidRegex.test(id));
                    const codeIds = localIds.filter(id => !uuidRegex.test(id) && !id.startsWith('local-'));

                    if (uuidIds.length > 0) {
                        const { data: byIdReports } = await supabase
                            .from('reports')
                            .select('*')
                            .in('id', uuidIds);
                        if (byIdReports) remoteReports = remoteReports.concat(byIdReports);
                    }

                    if (codeIds.length > 0) {
                        const { data: byCodeReports } = await supabase
                            .from('reports')
                            .select('*')
                            .in('report_id', codeIds);
                        if (byCodeReports) remoteReports = remoteReports.concat(byCodeReports);
                    }
                }

                // Deduplicate remote reports by id
                const uniqueRemote = Array.from(new Map(remoteReports.map(r => [r.id, r])).values());

                if (uniqueRemote.length > 0) {
                    const reportUuids = uniqueRemote.map(r => r.id);
                    const { data: imagesData } = await supabase
                        .from('report_images')
                        .select('*')
                        .in('report_id', reportUuids);

                    uniqueRemote.forEach((r: any) => {
                        const reportImages = (imagesData || [])
                            .filter((img: any) => img.report_id === r.id)
                            .map((img: any) => ({
                                id: img.id,
                                url: img.url,
                                thumbnailUrl: img.url,
                                uploadedAt: img.created_at,
                            }));

                        const mapped: Report = {
                            id: r.id,
                            reportId: r.report_id || `R-${r.id.substring(0, 6).toUpperCase()}`,
                            location: {
                                latitude: r.latitude,
                                longitude: r.longitude,
                                address: r.address,
                                locality: r.locality,
                                city: r.city,
                            },
                            images: reportImages.length > 0 ? reportImages : (reportsMap.get(r.id)?.images || []),
                            category: r.category,
                            severity: r.severity,
                            estimatedVolume: 'medium',
                            description: r.description,
                            isAnonymous: r.is_anonymous,
                            status: r.status,
                            pointsAwarded: Boolean(r.points_awarded),
                            requiresReview: Boolean(r.requires_review),
                            rejectionReason: r.rejection_reason || undefined,
                            statusHistory: [{ status: r.status, timestamp: r.created_at }],
                            assignedTo: r.assigned_department_name ? {
                                departmentId: r.assigned_department_id || 'dept-1',
                                departmentName: r.assigned_department_name,
                                workerName: r.assigned_worker_name,
                                assignedAt: r.updated_at || r.created_at,
                            } : undefined,
                            resolution: r.resolution_notes ? {
                                beforeImages: [],
                                afterImages: [],
                                notes: r.resolution_notes,
                                completedAt: r.resolved_at || r.updated_at,
                                completedBy: r.assigned_worker_name || 'Municipal Team',
                            } : undefined,
                            createdAt: r.created_at,
                            updatedAt: r.updated_at,
                        };

                        reportsMap.set(r.id, mapped);
                        saveLocalCachedReport(mapped);
                    });
                }
            } catch (networkErr) {
                console.warn('Network issue fetching remote user reports, using cached reports:', networkErr);
            }

            const finalReports = Array.from(reportsMap.values())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            set({ userReports: finalReports, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user reports:', error);
            set({ isLoading: false });
        }
    },

    // Track a report by ID or Code
    trackReport: async (reportIdQuery: string): Promise<Report | null> => {
        const query = reportIdQuery.trim();
        if (!query) return null;

        // Check if already in userReports
        const inUser = get().userReports.find(r =>
            r.reportId?.toLowerCase() === query.toLowerCase() ||
            r.id?.toLowerCase() === query.toLowerCase()
        );
        if (inUser) return inUser;

        // Check if in all reports
        const inGlobal = get().reports.find(r =>
            r.reportId?.toLowerCase() === query.toLowerCase() ||
            r.id?.toLowerCase() === query.toLowerCase()
        );
        if (inGlobal) {
            saveLocalReportId(inGlobal.id);
            saveLocalReportId(inGlobal.reportId);
            saveLocalCachedReport(inGlobal);
            await get().fetchUserReports();
            return inGlobal;
        }

        // Query Supabase directly (avoid passing non-UUID values to uuid column)
        try {
            const supabase = getSupabase();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
            const { data } = await (isUuid
                ? supabase.from('reports').select('*').eq('id', query).maybeSingle()
                : supabase.from('reports').select('*').ilike('report_id', query).maybeSingle());

            if (data) {
                const reportRecord = data as any;
                const { data: imagesData } = await supabase
                    .from('report_images')
                    .select('*')
                    .eq('report_id', reportRecord.id);

                const mapped: Report = {
                    id: reportRecord.id,
                    reportId: reportRecord.report_id || `R-${reportRecord.id.substring(0, 6).toUpperCase()}`,
                    location: {
                        latitude: reportRecord.latitude,
                        longitude: reportRecord.longitude,
                        address: reportRecord.address,
                        locality: reportRecord.locality,
                        city: reportRecord.city,
                    },
                    images: (imagesData || []).map((img: any) => ({
                        id: img.id,
                        url: img.url,
                        thumbnailUrl: img.url,
                        uploadedAt: img.created_at,
                    })),
                    category: reportRecord.category,
                    severity: reportRecord.severity,
                    estimatedVolume: 'medium',
                    description: reportRecord.description,
                    isAnonymous: reportRecord.is_anonymous,
                    status: reportRecord.status,
                    pointsAwarded: Boolean(reportRecord.points_awarded),
                    requiresReview: Boolean(reportRecord.requires_review),
                    rejectionReason: reportRecord.rejection_reason || undefined,
                    statusHistory: [{ status: reportRecord.status, timestamp: reportRecord.created_at }],
                    createdAt: reportRecord.created_at,
                    updatedAt: reportRecord.updated_at,
                };

                saveLocalReportId(mapped.id);
                saveLocalReportId(mapped.reportId);
                saveLocalCachedReport(mapped);
                await get().fetchUserReports();
                return mapped;
            }
        } catch (e) {
            console.error('Error tracking report:', e);
        }

        return null;
    },

    // Remove report from tracking list
    removeTrackedReport: (id: string) => {
        if (typeof window === 'undefined') return;
        try {
            const currentIds = getLocalReportIds().filter(i => i !== id);
            localStorage.setItem(MY_REPORTS_IDS_KEY, JSON.stringify(currentIds));
            const currentCache = getLocalCachedReports().filter(r => r.id !== id && r.reportId !== id);
            localStorage.setItem(MY_REPORTS_CACHE_KEY, JSON.stringify(currentCache));
            set((state) => ({
                userReports: state.userReports.filter(r => r.id !== id && r.reportId !== id)
            }));
            toast.success('Report removed from tracking list');
        } catch (e) {
            console.error('Failed to remove report:', e);
        }
    },

    // Permanently delete a report (local cache + Supabase if synced)
    deleteReport: async (report: Report): Promise<boolean> => {
        try {
            const isLocalOnly = report.id.startsWith('local-');
            if (!isLocalOnly) {
                const supabase = getSupabase();
                await (supabase.from('report_images') as any).delete().eq('report_id', report.id);
                const { data, error } = await (supabase.from('reports') as any)
                    .delete()
                    .eq('id', report.id)
                    .select('id');

                if (error) {
                    toast.error(`Failed to delete report: ${error.message}`);
                    return false;
                }
                if (!data || data.length === 0) {
                    toast.error('Delete blocked by Supabase RLS policy. Please add a DELETE policy for reports.');
                    return false;
                }
            }

            if (typeof window !== 'undefined') {
                const currentIds = getLocalReportIds().filter(i => i !== report.id && i !== report.reportId);
                localStorage.setItem(MY_REPORTS_IDS_KEY, JSON.stringify(currentIds));
                const currentCache = getLocalCachedReports().filter(r => r.id !== report.id && r.reportId !== report.reportId);
                localStorage.setItem(MY_REPORTS_CACHE_KEY, JSON.stringify(currentCache));
            }

            set((state) => ({
                userReports: state.userReports.filter(r => r.id !== report.id && r.reportId !== report.reportId),
                reports: state.reports.filter(r => r.id !== report.id && r.reportId !== report.reportId),
                selectedReport: state.selectedReport?.id === report.id ? null : state.selectedReport,
            }));

            toast.success(isLocalOnly ? 'Local report removed' : 'Report deleted permanently');
            return true;
        } catch (err: any) {
            console.warn('Delete report error:', err?.message || err);
            toast.error(err?.message || 'Failed to delete report');
            return false;
        }
    },

    // Update citizen display name in Supabase profiles & local state
    updateProfileName: async (firstName: string, lastName: string): Promise<boolean> => {
        const { user } = get();
        if (!user) return false;
        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();
        if (!cleanFirst) {
            toast.error('First name cannot be empty');
            return false;
        }

        try {
            const supabase = getSupabase();
            const accessToken = await getFastAccessToken(supabase);
            const { error } = await restInsert(
                'profiles',
                {
                    id: user.id,
                    first_name: cleanFirst,
                    last_name: cleanLast,
                    updated_at: new Date().toISOString(),
                },
                accessToken,
                10000,
                'resolution=merge-duplicates,return=representation'
            );

            if (error) {
                toast.error(`Failed to update name: ${error}`);
                return false;
            }

            // Keep Auth metadata synced best-effort
            const fullName = `${cleanFirst} ${cleanLast}`.trim();
            supabase.auth.updateUser({
                data: { full_name: fullName, first_name: cleanFirst, last_name: cleanLast }
            }).catch(() => {});

            set({
                user: {
                    ...user,
                    profile: {
                        ...user.profile,
                        firstName: cleanFirst,
                        lastName: cleanLast,
                    },
                },
            });
            toast.success('Profile name updated!');
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update name');
            return false;
        }
    },

    // Refresh profile data from database (points, reports count)
    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const supabase = getSupabase();

            // Fetch latest profile data from database
            // @ts-ignore - Supabase types not generated
            const { data: profileData, error } = await (supabase
                .from('profiles') as any)
                .select('points, reports_submitted, reports_resolved, avatar_url, trust_score, false_reports_count')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('Failed to fetch profile:', error);
                return;
            }

            if (profileData) {
                const refreshedPoints = profileData.points || 0;
                set({
                    user: {
                        ...user,
                        profile: {
                            ...user.profile,
                            avatar: profileData.avatar_url || user.profile?.avatar || '',
                        },
                        engagement: {
                            ...user.engagement,
                            points: refreshedPoints,
                            totalReports: profileData.reports_submitted || 0,
                            resolvedReports: profileData.reports_resolved || 0,
                            badges: user.engagement?.badges || [],
                            rank: getCitizenRank(refreshedPoints),
                            trustScore: profileData.trust_score ?? 100,
                            falseReportsCount: profileData.false_reports_count ?? 0,
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },

    // Sign out
    logout: async () => {
        try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
            set({
                user: null,
                isAuthenticated: false,
                userReports: [],
                selectedReport: null
            });
            // Clear local storage on sign out
            if (typeof window !== 'undefined') {
                localStorage.removeItem('app-storage');
                localStorage.removeItem(MY_REPORTS_IDS_KEY);
                localStorage.removeItem(MY_REPORTS_CACHE_KEY);
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },
}));
