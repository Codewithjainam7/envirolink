import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This API endpoint returns reports from the citizen-app store
// For cross-app communication, we'll read from a shared JSON file

import { promises as fs } from 'fs';
import path from 'path';

const SHARED_DATA_PATH = path.join(process.cwd(), '..', 'shared-data', 'reports.json');

// Default mock reports if no shared data exists
const defaultReports = [
    {
        id: '1',
        reportId: 'RPT-2025-000001',
        location: {
            latitude: 19.076,
            longitude: 72.8777,
            address: '123 Marine Drive',
            locality: 'Churchgate',
            city: 'Mumbai',
        },
        category: 'illegal_dumping',
        severity: 'high',
        status: 'submitted',
        isAnonymous: false,
        reporterName: 'Rahul S.',
        slaHours: 24,
        slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        reportId: 'RPT-2025-000002',
        location: {
            latitude: 19.082,
            longitude: 72.881,
            address: '45 Linking Road',
            locality: 'Bandra',
            city: 'Mumbai',
        },
        category: 'overflowing_bin',
        severity: 'medium',
        status: 'in_progress',
        isAnonymous: true,
        assignedTo: {
            departmentId: 'd1',
            departmentName: 'SWM',
            workerId: 'w1',
            workerName: 'Amit K.',
        },
        slaHours: 48,
        slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        reportId: 'RPT-2025-000003',
        location: {
            latitude: 19.065,
            longitude: 72.865,
            address: '78 Colaba Causeway',
            locality: 'Colaba',
            city: 'Mumbai',
        },
        category: 'construction_debris',
        severity: 'critical',
        status: 'submitted',
        isAnonymous: false,
        reporterName: 'Priya M.',
        slaHours: 6,
        slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: true,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
];

async function getReports() {
    try {
        // Try to read from shared data file
        await fs.mkdir(path.dirname(SHARED_DATA_PATH), { recursive: true });
        const data = await fs.readFile(SHARED_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        // Return default reports if file doesn't exist
        return defaultReports;
    }
}

// Calculate stats from reports
const calculateStats = (reports: any[]) => {
    const newReports = reports.filter(r => r.status === 'submitted').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const slaBreach = reports.filter(r => r.isSlaBreach).length;

    return {
        totalReports: reports.length,
        newReports,
        inProgress,
        resolved,
        slaBreach,
        resolutionRate: reports.length > 0 ? (resolved / reports.length * 100).toFixed(1) : 0,
    };
};

export async function GET(request: NextRequest) {
    const reports = await getReports();

    const response = NextResponse.json({
        reports,
        stats: calculateStats(reports),
        timestamp: new Date().toISOString(),
    });

    // CORS headers for cross-origin requests from admin dashboard
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const reports = await getReports();

        // Add new report
        const newReport = {
            ...body,
            id: `${Date.now()}`,
            reportId: `RPT-${new Date().getFullYear()}-${String(reports.length + 1).padStart(6, '0')}`,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            slaHours: 24,
            slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isSlaBreach: false,
        };

        reports.unshift(newReport);

        // Save to shared file
        await fs.mkdir(path.dirname(SHARED_DATA_PATH), { recursive: true });
        await fs.writeFile(SHARED_DATA_PATH, JSON.stringify(reports, null, 2));

        const response = NextResponse.json({ success: true, report: newReport });
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}
