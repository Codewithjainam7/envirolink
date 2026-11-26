'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, UserPlus, Loader2, CheckCircle, AlertTriangle,
    MapPin, Clock, User, Users, Check, ArrowRight, RefreshCw, Bot
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import { createClient } from '@/lib/supabase';
import { encodeCrewIds, parseCrewIds, formatCrewDepartmentName, parseBackupRequest } from '@/lib/crew';

interface PendingReport {
    id: string;
    report_id: string;
    category: string;
    address: string;
    locality: string;
    latitude: number;
    longitude: number;
    created_at: string;
    severity: string;
}

interface BackupReport extends PendingReport {
    status: string;
    assigned_worker_id: string | null;
    assigned_worker_name: string | null;
    assigned_department_id: string | null;
    assigned_department_name: string | null;
}

interface AvailableWorker {
    id: string;
    first_name: string;
    last_name: string;
    zone: string;
    phone: string;
    status: string;
}

export default function AIAssignmentPage() {
    const supabase = createClient();
    const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
    const [backupReports, setBackupReports] = useState<BackupReport[]>([]);
    const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    const [assignedCount, setAssignedCount] = useState(0);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [selectedCrewByReport, setSelectedCrewByReport] = useState<Record<string, string[]>>({});
    const [backupPickerId, setBackupPickerId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    // Settings toggles
    const [autoAssignOnSubmit, setAutoAssignOnSubmit] = useState(false);
    const [workerProximity, setWorkerProximity] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch pending/submitted reports - these are reports waiting for assignment
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('id, report_id, category, address, locality, latitude, longitude, created_at, severity, status')
                .eq('status', 'submitted')
                .order('created_at', { ascending: false });

            if (reportsError) {
                console.error('Error fetching reports:', reportsError);
                throw reportsError;
            }
            console.log('Fetched pending reports:', reportsData?.length || 0);
            setPendingReports(reportsData || []);

            // Fetch active reports where a field worker requested backup crew
            const { data: activeReportsData } = await supabase
                .from('reports')
                .select('id, report_id, category, address, locality, latitude, longitude, created_at, severity, status, assigned_worker_id, assigned_worker_name, assigned_department_id, assigned_department_name')
                .in('status', ['assigned', 'in_progress'])
                .ilike('assigned_department_name', 'Backup Requested%')
                .order('created_at', { ascending: false });
            setBackupReports((activeReportsData || []) as BackupReport[]);

            // Fetch available workers (newest first so newly added workers appear at the top)
            const { data: workersData, error: workersError } = await supabase
                .from('workers')
                .select('id, first_name, last_name, zone, phone, status, joined_at')
                .in('status', ['approved', 'active', 'available'])
                .order('joined_at', { ascending: false });

            if (workersError) {
                console.error('Error fetching workers:', workersError);
                throw workersError;
            }
            console.log('Fetched available workers:', workersData?.length || 0);
            setAvailableWorkers(workersData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    // AI Auto-assign all pending reports (high/critical automatically get a 2-worker crew when available)
    const handleAutoAssignAll = async () => {
        if (pendingReports.length === 0 || availableWorkers.length === 0) return;

        setIsAutoAssigning(true);
        setAssignedCount(0);

        try {
            for (let i = 0; i < pendingReports.length; i++) {
                const report = pendingReports[i];
                const isHeavy = ['high', 'critical'].includes((report.severity || '').toLowerCase());
                const lead = availableWorkers[i % availableWorkers.length];
                const crewList =
                    isHeavy && availableWorkers.length >= 2
                        ? [lead, availableWorkers[(i + 1) % availableWorkers.length]]
                        : [lead];
                const uniqueCrew = Array.from(new Map(crewList.map((w) => [w.id, w])).values());
                const names = uniqueCrew.map((w) => `${w.first_name} ${w.last_name}`.trim()).join(', ');

                await supabase
                    .from('reports')
                    .update({
                        status: 'assigned',
                        assigned_worker_id: uniqueCrew[0].id,
                        assigned_worker_name: names,
                        assigned_department_id: encodeCrewIds(uniqueCrew.map((w) => w.id)),
                        assigned_department_name: formatCrewDepartmentName(uniqueCrew.length),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', report.id);

                setAssignedCount(i + 1);
                await new Promise(r => setTimeout(r, 350));
            }

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Error auto-assigning:', error);
        } finally {
            setIsAutoAssigning(false);
            setAssignedCount(0);
        }
    };

    const toggleWorkerForReport = (reportId: string, workerId: string) => {
        setSelectedCrewByReport((prev) => {
            const current = prev[reportId] || [];
            const next = current.includes(workerId)
                ? current.filter((id) => id !== workerId)
                : [...current, workerId];
            return { ...prev, [reportId]: next };
        });
    };

    // Assign 1 or multiple workers to a pending report
    const handleAssignCrew = async (reportId: string) => {
        const pickedIds = selectedCrewByReport[reportId] || [];
        const chosen = availableWorkers.filter((w) => pickedIds.includes(w.id));
        if (chosen.length === 0) return;

        setSavingId(reportId);
        try {
            const names = chosen.map((w) => `${w.first_name} ${w.last_name}`.trim()).join(', ');
            await supabase
                .from('reports')
                .update({
                    status: 'assigned',
                    assigned_worker_id: chosen[0].id,
                    assigned_worker_name: names,
                    assigned_department_id: encodeCrewIds(chosen.map((w) => w.id)),
                    assigned_department_name: formatCrewDepartmentName(chosen.length),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', reportId);

            setPendingReports(prev => prev.filter(r => r.id !== reportId));
            setSelectedReport(null);
            setSelectedCrewByReport((prev) => {
                const copy = { ...prev };
                delete copy[reportId];
                return copy;
            });
        } catch (error) {
            console.error('Error assigning crew:', error);
        } finally {
            setSavingId(null);
        }
    };

    // Append backup workers to an active report without removing current crew
    const handleDispatchBackup = async (report: BackupReport, addWorkerIds: string[]) => {
        const existingIds = parseCrewIds(report.assigned_department_id, report.assigned_worker_id);
        const combinedIds = Array.from(new Set([...existingIds, ...addWorkerIds]));
        const combinedWorkers = combinedIds
            .map((id) => availableWorkers.find((w) => w.id === id))
            .filter(Boolean) as AvailableWorker[];

        // Preserve already-assigned names even if lead worker status changed
        const existingNameFallback = report.assigned_worker_name
            ? report.assigned_worker_name.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
        const addedNames = addWorkerIds
            .map((id) => availableWorkers.find((w) => w.id === id))
            .filter(Boolean)
            .map((w) => `${w!.first_name} ${w!.last_name}`.trim());
        const finalNames = combinedWorkers.length === combinedIds.length
            ? combinedWorkers.map((w) => `${w.first_name} ${w.last_name}`.trim())
            : Array.from(new Set([...existingNameFallback, ...addedNames]));

        setSavingId(report.id);
        try {
            await supabase
                .from('reports')
                .update({
                    assigned_worker_id: report.assigned_worker_id || combinedIds[0] || null,
                    assigned_worker_name: finalNames.join(', '),
                    assigned_department_id: encodeCrewIds(combinedIds),
                    assigned_department_name: formatCrewDepartmentName(combinedIds.length),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', report.id);

            setBackupReports((prev) => prev.filter((r) => r.id !== report.id));
            setBackupPickerId(null);
        } catch (error) {
            console.error('Error dispatching backup crew:', error);
        } finally {
            setSavingId(null);
        }
    };

    const handleAutoAddBackup = async (report: BackupReport) => {
        const req = parseBackupRequest(report.assigned_department_name);
        const needed = req?.count || 1;
        const existingIds = parseCrewIds(report.assigned_department_id, report.assigned_worker_id);
        const candidates = availableWorkers.filter((w) => !existingIds.includes(w.id));
        if (candidates.length === 0) return;
        const toAdd = candidates.slice(0, needed).map((w) => w.id);
        await handleDispatchBackup(report, toAdd);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative pb-8">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Bot size={28} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">AI Assignment</h1>
                        </div>
                        <p className="text-gray-500 font-medium">Automatically assign reports to nearest available workers</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAutoAssignAll}
                        disabled={isAutoAssigning || pendingReports.length === 0 || availableWorkers.length === 0}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 font-semibold rounded-2xl transition-all border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 shadow-sm"
                    >
                        {isAutoAssigning ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                Assigning... ({assignedCount}/{pendingReports.length})
                            </>
                        ) : (
                            <>
                                <Sparkles size={22} />
                                Auto-Assign All ({pendingReports.length})
                            </>
                        )}
                    </motion.button>
                </div>

                {/* AI Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-emerald-500/20"
                >
                    <div className="grid md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-emerald-400/30">
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">{pendingReports.length}</p>
                            <p className="text-emerald-100 font-medium">Pending Reports</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">{availableWorkers.length}</p>
                            <p className="text-emerald-100 font-medium">Available Workers</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">-</p>
                            <p className="text-emerald-100 font-medium">Avg. Distance</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">~15 min</p>
                            <p className="text-emerald-100 font-medium">Est. Response</p>
                        </div>
                    </div>
                </motion.div>

                {/* Backup Requests Section (from on-site field workers) */}
                {backupReports.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="text-amber-500" size={20} />
                            Backup Crew Requests ({backupReports.length})
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {backupReports.map((bReport) => {
                                const req = parseBackupRequest(bReport.assigned_department_name);
                                const existingIds = parseCrewIds(bReport.assigned_department_id, bReport.assigned_worker_id);
                                const candidates = availableWorkers.filter((w) => !existingIds.includes(w.id));
                                const picked = selectedCrewByReport[bReport.id] || [];
                                const isPickerOpen = backupPickerId === bReport.id;

                                return (
                                    <div
                                        key={bReport.id}
                                        className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-5 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                                                        +{req?.count || 1} Backup Needed
                                                    </span>
                                                    <span className="font-mono text-xs text-gray-600">{bReport.report_id}</span>
                                                </div>
                                                <p className="font-bold text-gray-900">
                                                    {bReport.category?.replace(/_/g, ' ') || 'Waste Cleanup'} · {bReport.locality}
                                                </p>
                                                <p className="text-xs text-amber-900 font-medium mt-1">
                                                    Reason: {req?.reason}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Current Crew ({existingIds.length}): {bReport.assigned_worker_name || 'Assigned worker'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <button
                                                type="button"
                                                disabled={savingId === bReport.id || candidates.length === 0}
                                                onClick={() => handleAutoAddBackup(bReport)}
                                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                <Sparkles size={14} />
                                                {savingId === bReport.id ? 'Adding...' : `1-Click Auto-Add +${req?.count || 1}`}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBackupPickerId(isPickerOpen ? null : bReport.id)}
                                                className="px-3.5 py-2 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 transition"
                                            >
                                                {isPickerOpen ? 'Hide List' : 'Pick Workers Manually'}
                                            </button>
                                        </div>

                                        {isPickerOpen && (
                                            <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
                                                {candidates.length === 0 ? (
                                                    <p className="text-xs text-gray-600">All approved workers are already assigned to this job.</p>
                                                ) : (
                                                    <>
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                            {candidates.map((w) => {
                                                                const checked = picked.includes(w.id);
                                                                return (
                                                                    <button
                                                                        key={w.id}
                                                                        type="button"
                                                                        onClick={() => toggleWorkerForReport(bReport.id, w.id)}
                                                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition ${
                                                                            checked
                                                                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                                                                : 'bg-white border-gray-200 text-gray-700'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                                                                            {checked && <Check size={11} />}
                                                                        </span>
                                                                        <span className="font-bold">{w.first_name} {w.last_name}</span>
                                                                        <span className="text-gray-500 ml-auto">{w.zone}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={picked.length === 0 || savingId === bReport.id}
                                                            onClick={() => handleDispatchBackup(bReport, picked)}
                                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                                                        >
                                                            Add {picked.length} Helper(s) to Crew
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Pending Reports */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-emerald-500" size={20} />
                            Pending Reports
                        </h2>

                        {pendingReports.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border-2 border-emerald-100"
                            >
                                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-500">All reports have been assigned to workers.</p>
                            </motion.div>
                        ) : (
                            <motion.div layout className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {pendingReports.map((report, i) => (
                                        <motion.div
                                            layout
                                            key={report.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                            transition={{ delay: Math.min(i * 0.05, 0.2), layout: { type: 'spring', stiffness: 320, damping: 28 } }}
                                            className={`bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg border-2 transition-colors cursor-pointer ${selectedReport === report.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-50/50 hover:border-emerald-200'
                                                }`}
                                            onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                            report.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {(report.severity || 'medium').toUpperCase()}
                                                        </span>
                                                        <span className="text-gray-400 text-sm font-mono">{report.report_id}</span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{report.category?.replace(/_/g, ' ') || 'Waste Report'}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={14} className="text-emerald-500" />
                                                            {report.locality || report.address?.slice(0, 30) || 'Unknown location'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} className="text-emerald-500" />
                                                            {formatTimeAgo(report.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedReport(selectedReport === report.id ? null : report.id);
                                                    }}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                                >
                                                    <UserPlus size={18} />
                                                    {selectedReport === report.id ? 'Close' : 'Assign'}
                                                </motion.button>
                                            </div>

                                            {/* Multi-Worker Crew Selection (animated expand & spring checkboxes) */}
                                            <AnimatePresence>
                                                {selectedReport === report.id && availableWorkers.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.22 }}
                                                        className="mt-4 pt-4 border-t border-gray-100 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                                <Users size={14} className="text-emerald-500" />
                                                                Select 1 or More Workers ({(selectedCrewByReport[report.id] || []).length} selected)
                                                            </p>
                                                            {['high', 'critical'].includes((report.severity || '').toLowerCase()) && (
                                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                    2+ Crew Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                            {availableWorkers.map((worker) => {
                                                                const crewList = selectedCrewByReport[report.id] || [];
                                                                const selIdx = crewList.indexOf(worker.id);
                                                                const isChecked = selIdx !== -1;
                                                                return (
                                                                    <motion.button
                                                                        key={worker.id}
                                                                        type="button"
                                                                        whileTap={{ scale: 0.985 }}
                                                                        onClick={() => toggleWorkerForReport(report.id, worker.id)}
                                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
                                                                            isChecked
                                                                                ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400/30'
                                                                                : 'bg-gray-50/80 hover:bg-emerald-50/50 border-transparent hover:border-emerald-200'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300'}`}>
                                                                            {isChecked && (
                                                                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 480, damping: 22 }}>
                                                                                    <Check size={12} strokeWidth={3} />
                                                                                </motion.span>
                                                                            )}
                                                                        </span>
                                                                        <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-bold text-emerald-600 shadow-sm shrink-0">
                                                                            {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                                        </div>
                                                                        <div className="flex-1 text-left min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-bold text-gray-900 truncate">{worker.first_name} {worker.last_name}</p>
                                                                                {isChecked && (
                                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                                                                                        {selIdx === 0 ? 'Lead' : `Crew #${selIdx + 1}`}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs font-semibold text-gray-500">{worker.zone || 'Unassigned'} • {worker.phone || 'No phone'}</p>
                                                                        </div>
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.01 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            type="button"
                                                            disabled={(selectedCrewByReport[report.id] || []).length === 0 || savingId === report.id}
                                                            onClick={() => handleAssignCrew(report.id)}
                                                            className="mt-3 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            {savingId === report.id ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    Dispatching Crew...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Users size={16} />
                                                                    {(selectedCrewByReport[report.id] || []).length > 1
                                                                        ? `Assign Crew (${(selectedCrewByReport[report.id] || []).length} Workers)`
                                                                        : 'Assign Selected Worker'}
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>

                    {/* Recent Assignments & Settings */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCw className="text-emerald-500" size={20} />
                            Assignment Settings
                        </h2>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-emerald-50 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Configuration</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">Auto-assign on submit</p>
                                            <p className="text-sm text-gray-500">Automatically assign when report is submitted</p>
                                        </div>
                                        <button
                                            onClick={() => setAutoAssignOnSubmit(!autoAssignOnSubmit)}
                                            className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${autoAssignOnSubmit ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${autoAssignOnSubmit ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">Worker proximity</p>
                                            <p className="text-sm text-gray-500">Assign to nearest worker by default</p>
                                        </div>
                                        <button
                                            onClick={() => setWorkerProximity(!workerProximity)}
                                            className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${workerProximity ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${workerProximity ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Available Workers ({availableWorkers.length})</h3>
                                {availableWorkers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No workers available</p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {availableWorkers.map(worker => (
                                            <div key={worker.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700">
                                                    {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{worker.first_name} {worker.last_name}</p>
                                                    <p className="text-sm text-gray-500">{worker.zone || 'No zone'}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                    {worker.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
