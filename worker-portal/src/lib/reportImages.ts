import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Batch-fetches report image URLs for a list of report UUIDs,
 * falling back to Supabase Storage public URLs when only storage_path is present.
 */
export async function fetchReportImagesMap(
  supabase: SupabaseClient<any>,
  reportIds: string[]
): Promise<Map<string, string[]>> {
  const imagesByReport = new Map<string, string[]>();
  const uniqueIds = Array.from(new Set(reportIds.filter(Boolean)));
  if (uniqueIds.length === 0) return imagesByReport;

  const { data: imagesData, error: imagesError } = await supabase
    .from('report_images')
    .select('report_id, url, storage_path')
    .in('report_id', uniqueIds);

  if (imagesError) {
    console.warn('Error fetching report images:', imagesError);
    return imagesByReport;
  }

  for (const img of imagesData || []) {
    let resolvedUrl = typeof img.url === 'string' ? img.url.trim() : '';
    if (!resolvedUrl && img.storage_path) {
      const { data: pub } = supabase.storage
        .from('report-images')
        .getPublicUrl(img.storage_path);
      resolvedUrl = pub?.publicUrl || '';
    }
    if (!resolvedUrl) continue;

    const existing = imagesByReport.get(img.report_id) || [];
    if (!existing.includes(resolvedUrl)) {
      existing.push(resolvedUrl);
      imagesByReport.set(img.report_id, existing);
    }
  }

  return imagesByReport;
}
