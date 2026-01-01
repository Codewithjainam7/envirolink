import { create } from 'zustand';
import { Report, User, CityStats, WasteCategory, Location } from '@/types';
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
    initializeAuth: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const initialNewReport = {
    images: [],
    location: null,
    category: null,
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
                    set({ user: null, isAuthenticated: false });
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
                                reports_resolved: 0
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
                        points: profileData?.points || 0,
                        rank: 'New Reporter',
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
            };

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                processSession(session);
            });

            // Initial session check
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await processSession(session);
            }

        } catch (error) {
            console.error('Failed to initialize auth:', error);
        }
    },

    // Submit report to Supabase
    submitReport: async () => {
        const { newReport, user, reports } = get();
        set({ isLoading: true });

        try {
            const supabase = getSupabase();

            console.log('Submitting report:', {
                category: newReport.category,
                location: newReport.location,
                hasImages: newReport.images.length
            });

            // Anti-abuse checks removed as per user request



            // Insert report to Supabase
            const { data: reportData, error: reportError } = await supabase.from('reports').insert({
                user_id: newReport.isAnonymous ? null : user?.id,
                category: newReport.category,
                severity: 'medium',
                status: 'submitted',
                description: newReport.description || 'No description',
                latitude: newReport.location?.latitude || 0,
                longitude: newReport.location?.longitude || 0,
                address: newReport.location?.address || 'Unknown location',
                locality: newReport.location?.locality || 'Unknown',
                city: newReport.location?.city || 'Mumbai',
                is_anonymous: newReport.isAnonymous,
                sla_hours: 24,
                sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            } as any)
                .select()
                .single();

            if (reportError) {
                console.error('Report insert error:', reportError);
                throw reportError;
            }

            console.log('Report created:', reportData);

            // Upload images if any (wrapped in try/catch - don't fail submission if images fail)
            if (newReport.images.length > 0 && reportData) {
                try {
                    for (let i = 0; i < newReport.images.length; i++) {
                        const imageUrl = newReport.images[i];

                        // If it's a base64 image, upload to Supabase storage
                        if (imageUrl.startsWith('data:')) {
                            const base64Data = imageUrl.split(',')[1];
                            const fileName = `${(reportData as any).id}/${Date.now()}-${i}.jpg`;

                            // Convert base64 to Uint8Array (browser-compatible)
                            const binaryString = atob(base64Data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let j = 0; j < binaryString.length; j++) {
                                bytes[j] = binaryString.charCodeAt(j);
                            }

                            console.log('Uploading image to storage:', fileName);

                            const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('report-images')
                                .upload(fileName, bytes, {
                                    contentType: 'image/jpeg'
                                });

                            if (uploadError) {
                                console.error('Image upload error:', uploadError);
                            } else if (uploadData) {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('report-images')
                                    .getPublicUrl(fileName);

                                console.log('Image uploaded, saving to DB:', publicUrl);

                                // @ts-ignore - Supabase types not generated
                                await supabase.from('report_images').insert({
                                    report_id: (reportData as any).id,
                                    url: publicUrl,
                                    storage_path: fileName,
                                });
                            }
                        }
                    }
                } catch (imgError) {
                    console.error('Image upload failed (non-fatal):', imgError);
                }
            }

            // Update user stats if logged in (non-fatal if fails) - Award 20 points per report
            if (user && !newReport.isAnonymous) {
                try {
                    console.log('Attempting to update points for user:', user.id);

                    // First, try to get existing profile
                    // @ts-ignore - Supabase types not generated
                    const { data: currentProfile, error: fetchError } = await supabase
                        .from('profiles')
                        .select('points, reports_submitted')
                        .eq('id', user.id)
                        .single();

                    console.log('Current profile fetch result:', { currentProfile, fetchError });

                    let newPoints: number;
                    let newReportsCount: number;

                    if (currentProfile && !fetchError) {
                        // Profile exists - update it
                        const currentDbPoints = (currentProfile as any)?.points || 0;
                        const currentDbReports = (currentProfile as any)?.reports_submitted || 0;
                        newPoints = currentDbPoints + 20;
                        newReportsCount = currentDbReports + 1;

                        console.log('Updating existing profile:', { currentDbPoints, newPoints, newReportsCount });

                        // @ts-ignore - Supabase types not generated
                        const { error: updateError } = await (supabase
                            .from('profiles') as any)
                            .update({
                                points: newPoints,
                                reports_submitted: newReportsCount
                            })
                            .eq('id', user.id);

                        if (updateError) {
                            console.error('Profile update error:', updateError);
                            toast.error('Failed to update points');
                        } else {
                            console.log('Profile updated successfully, new points:', newPoints);
                            toast.success(`You earned 20 points! Total: ${newPoints}`, { duration: 4000, icon: '🎉' });
                        }
                    } else {
                        // Profile doesn't exist - create it with initial 20 points
                        newPoints = 20;
                        newReportsCount = 1;

                        console.log('Creating new profile with points:', newPoints);

                        // @ts-ignore - Supabase types not generated
                        const { error: insertError } = await (supabase
                            .from('profiles') as any)
                            .insert({
                                id: user.id,
                                first_name: user.profile?.firstName || '',
                                last_name: user.profile?.lastName || '',
                                avatar_url: user.profile?.avatar || '',
                                points: newPoints,
                                reports_submitted: newReportsCount,
                                reports_resolved: 0
                            });

                        if (insertError) {
                            console.error('Profile insert error:', insertError);
                            toast.error('Failed to initialize points');
                        } else {
                            console.log('Profile created successfully with points:', newPoints);
                            toast.success(`You earned your first 20 points! 🎉`, { duration: 4000 });
                        }
                    }

                    // Update local user state immediately for real-time UI update
                    set({
                        user: {
                            ...user,
                            engagement: {
                                ...user.engagement,
                                points: newPoints,
                                totalReports: newReportsCount,
                                resolvedReports: user.engagement?.resolvedReports || 0,
                                badges: user.engagement?.badges || [],
                                rank: user.engagement?.rank || 'New Reporter',
                            }
                        }
                    });
                } catch (profileError) {
                    console.error('Profile update failed:', profileError);
                }
            }

            // Refresh reports
            await get().fetchReports();

            // Refresh profile points and user reports
            await get().refreshProfile();
            await get().fetchUserReports();

            set({
                newReport: initialNewReport,
                isReportSheetOpen: false,
                isLoading: false,
            });

        } catch (error) {
            console.error('Failed to submit report:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    // Fetch all reports from Supabase
    fetchReports: async () => {
        set({ isLoading: true });
        try {
            const supabase = getSupabase();
            const { data: reportsData, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const { data: imagesData } = await supabase.from('report_images').select('*');

            const mappedReports: Report[] = (reportsData || []).map((r: any) => ({
                id: r.id,
                reportId: r.report_id,
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
                statusHistory: [{ status: r.status, timestamp: r.created_at }],
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }));

            // Calculate stats
            const total = mappedReports.length;
            const resolved = mappedReports.filter(r => ['resolved', 'closed'].includes(r.status)).length;
            const pending = mappedReports.filter(r => r.status === 'submitted').length;
            const inProgress = mappedReports.filter(r => ['under_review', 'assigned', 'in_progress'].includes(r.status)).length;

            set({
                reports: mappedReports,
                cityStats: {
                    totalReports: total,
                    resolvedReports: resolved,
                    pendingReports: pending,
                    inProgressReports: inProgress,
                    resolutionRate: total > 0 ? Math.round((resolved / total) * 100 * 10) / 10 : 0,
                    averageResolutionHours: 18,
                    cleanlinessScore: total > 0 ? Math.round(((resolved + (inProgress * 0.5)) / total) * 100) : 0,
                },
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            set({ isLoading: false });
        }
    },

    // Fetch user's reports
    fetchUserReports: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
            const supabase = getSupabase();
            const { data: reportsData, error } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedReports: Report[] = (reportsData || []).map((r: any) => ({
                id: r.id,
                reportId: r.report_id,
                location: {
                    latitude: r.latitude,
                    longitude: r.longitude,
                    address: r.address,
                    locality: r.locality,
                    city: r.city,
                },
                images: [],
                category: r.category,
                severity: r.severity,
                estimatedVolume: 'medium',
                description: r.description,
                isAnonymous: r.is_anonymous,
                status: r.status,
                statusHistory: [{ status: r.status, timestamp: r.created_at }],
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }));

            set({ userReports: mappedReports, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user reports:', error);
            set({ isLoading: false });
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
                .select('points, reports_submitted, reports_resolved, avatar_url')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Failed to fetch profile:', error);
                return;
            }

            if (profileData) {
                console.log('Refreshed profile data:', profileData);

                // Update user state with fresh data from DB
                set({
                    user: {
                        ...user,
                        profile: {
                            ...user.profile,
                            avatar: profileData.avatar_url || user.profile?.avatar || '',
                        },
                        engagement: {
                            ...user.engagement,
                            points: profileData.points || 0,
                            totalReports: profileData.reports_submitted || 0,
                            resolvedReports: profileData.reports_resolved || 0,
                            badges: user.engagement?.badges || [],
                            rank: user.engagement?.rank || 'New Reporter',
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },
}));
