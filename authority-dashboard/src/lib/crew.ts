export interface CrewWorkerSummary {
    id: string;
    first_name: string;
    last_name?: string | null;
}

export function encodeCrewIds(workerIds: string[]): string {
    const unique = Array.from(new Set(workerIds.map((id) => id.trim()).filter(Boolean)));
    return unique.length > 0 ? `crew:${unique.join(',')}` : 'dept-1';
}

export function parseCrewIds(assignedDepartmentId?: string | null, leadWorkerId?: string | null): string[] {
    const ids: string[] = [];
    if (leadWorkerId) ids.push(leadWorkerId);
    if (assignedDepartmentId && assignedDepartmentId.startsWith('crew:')) {
        assignedDepartmentId
            .slice(5)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((id) => {
                if (!ids.includes(id)) ids.push(id);
            });
    }
    return ids;
}

export function formatCrewDepartmentName(workerCount: number): string {
    return workerCount > 1 ? `Sanitation Crew (${workerCount} workers)` : 'Sanitation Department';
}

export function parseBackupRequest(
    assignedDepartmentName?: string | null
): { count: number; reason: string } | null {
    if (!assignedDepartmentName) return null;
    const match = assignedDepartmentName.match(/^Backup Requested \(\+(\d+)\)(?:\s*·\s*(.+))?$/i);
    if (!match) return null;
    return {
        count: Math.max(1, Number(match[1]) || 1),
        reason: match[2]?.trim() || 'Additional workers requested on site',
    };
}

export function formatBackupDepartmentName(requestedCount: number, reason: string): string {
    const cleanReason = reason.trim() || 'Additional workers needed';
    return `Backup Requested (+${requestedCount}) · ${cleanReason}`;
}
