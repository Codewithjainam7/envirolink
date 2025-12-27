'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Report, ReportInsert, ReportImage, CityStats } from '@/types/database';
import toast from 'react-hot-toast';

// Hook to fetch reports
export function useReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = getSupabase();

    const fetchReports = useCallback(async (filters?: {
        status?: Report['status'];
        category?: Report['category'];
        city?: string;
        limit?: number;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }
            if (filters?.city) {
                query = query.eq('city', filters.city);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            setReports(data || []);
            return data;
        } catch (err: any) {
            const message = err.message || 'Failed to fetch reports';
            setError(message);
            toast.error(message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUserReports = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch your reports');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { reports, isLoading, error, fetchReports, fetchUserReports };
}

// Hook to create a new report
export function useCreateReport() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = getSupabase();

    const createReport = useCallback(async (
        reportData: Omit<ReportInsert, 'id' | 'report_id' | 'created_at' | 'updated_at'>,
        images?: File[]
    ) => {
        setIsSubmitting(true);

        try {
            // Insert report
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .insert(reportData as any)
                .select()
                .single();

            if (reportError) throw reportError;

            // Cast report to proper type for TypeScript
            const typedReport = report as Report;

            // Upload images if provided
            if (images && images.length > 0 && typedReport) {
                for (const image of images) {
                    const fileName = `${typedReport.id}/${Date.now()}-${image.name}`;

                    // Upload to storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('report-images')
                        .upload(fileName, image);

                    if (uploadError) {
                        console.error('Image upload error:', uploadError);
                        continue;
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('report-images')
                        .getPublicUrl(fileName);

                    // Insert image record
                    await supabase.from('report_images').insert({
                        report_id: typedReport.id,
                        url: publicUrl,
                        storage_path: fileName,
                    } as any);
                }
            }

            toast.success('Report submitted successfully!');
            return typedReport;
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit report');
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { createReport, isSubmitting };
}

// Hook to update report status (for authorities)
export function useUpdateReport() {
    const [isUpdating, setIsUpdating] = useState(false);
    const supabase = getSupabase();

    const updateReport = useCallback(async (
        reportId: string,
        updates: Partial<Report>
    ) => {
        setIsUpdating(true);

        try {
            const { data, error } = await supabase
                .from('reports')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', reportId)
                .select()
                .single();

            if (error) throw error;
            toast.success('Report updated successfully!');
            return data;
        } catch (err: any) {
            toast.error(err.message || 'Failed to update report');
            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    return { updateReport, isUpdating };
}

// Hook to fetch city statistics
export function useCityStats() {
    const [stats, setStats] = useState<CityStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = getSupabase();

    const fetchStats = useCallback(async (city: string = 'Mumbai') => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('city_stats')
                .select('*')
                .eq('city', city)
                .single();

            if (error) throw error;
            setStats(data);
            return data;
        } catch (err: any) {
            console.error('Failed to fetch city stats:', err);
            // Return default stats if not found
            return {
                total_reports: 0,
                resolved_reports: 0,
                active_reports: 0,
                resolution_rate: 0,
                avg_resolution_hours: 0,
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { stats, isLoading, fetchStats };
}

// Hook to fetch report images
export function useReportImages() {
    const [images, setImages] = useState<ReportImage[]>([]);
    const supabase = getSupabase();

    const fetchImages = useCallback(async (reportId: string) => {
        try {
            const { data, error } = await supabase
                .from('report_images')
                .select('*')
                .eq('report_id', reportId);

            if (error) throw error;
            setImages(data || []);
            return data;
        } catch (err: any) {
            console.error('Failed to fetch images:', err);
            return [];
        }
    }, []);

    return { images, fetchImages };
}
