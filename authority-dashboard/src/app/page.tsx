'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  ChevronRight, Filter, Search, Bell, MoreVertical, MapPin, Users,
  Activity, Zap, Target, Phone, Shield, RefreshCw, Download, Eye, X,
  Trash2, Package, Recycle, Construction, Cpu, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { Report, DashboardStats, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG } from '@/types';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import FloatingBlobs from '@/components/FloatingBlobs';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Dynamic import for map
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
});

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalReports: 0, newReports: 0, inProgress: 0, resolved: 0,
    slaBreach: 0, resolutionRate: 0, avgResolutionHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pieData, setPieData] = useState([
    { name: 'Resolved', value: 0, color: '#10b981' },
    { name: 'In Progress', value: 0, color: '#f59e0b' },
    { name: 'Open', value: 0, color: '#ef4444' },
  ]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; reports: number; resolved: number }[]>([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch reports from Supabase
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: imagesData } = await supabase.from('report_images').select('*');

      // Fetch worker count
      const { data: workersData } = await supabase
        .from('workers')
        .select('id')
        .in('status', ['approved', 'active']);
      setWorkerCount(workersData?.length || 0);

      const mappedReports: Report[] = (reportsData || []).map((r: any) => ({
        id: r.id,
        reportId: r.report_id,
        location: { latitude: r.latitude, longitude: r.longitude, address: r.address, locality: r.locality, city: r.city },
        category: r.category,
        severity: r.severity,
        status: r.status,
        description: r.description,
        reporterName: 'Anonymous',
        isAnonymous: r.is_anonymous,
        assignedTo: r.assigned_department_id ? { departmentId: r.assigned_department_id, departmentName: r.assigned_department_name, workerId: r.assigned_worker_id, workerName: r.assigned_worker_name } : undefined,
        slaHours: r.sla_hours,
        slaDueAt: r.sla_due_at,
        isSlaBreach: r.is_sla_breach,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        images: imagesData?.filter((img: any) => img.report_id === r.id).map((img: any) => ({ id: img.id, url: img.url })) || []
      }));

      setReports(mappedReports);

      // Calculate real stats
      const total = mappedReports.length;
      const newCount = mappedReports.filter(r => r.status === 'submitted').length;
      const inProgressCount = mappedReports.filter(r => ['under_review', 'assigned', 'in_progress'].includes(r.status)).length;
      const resolvedCount = mappedReports.filter(r => ['resolved', 'closed'].includes(r.status)).length;
      const breachCount = mappedReports.filter(r => r.isSlaBreach).length;

      setDashboardStats({
        totalReports: total,
        newReports: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        slaBreach: breachCount,
        resolutionRate: total > 0 ? Math.round((resolvedCount / total) * 100 * 10) / 10 : 0,
        avgResolutionHours: 18,
      });

      // Update pie chart data dynamically
      setPieData([
        { name: 'Resolved', value: resolvedCount, color: '#10b981' },
        { name: 'In Progress', value: inProgressCount, color: '#f59e0b' },
        { name: 'Open', value: newCount, color: '#ef4444' },
      ]);

      // Calculate weekly data from actual reports
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weeklyStats: { day: string; reports: number; resolved: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];

        const dayReports = mappedReports.filter(r => r.createdAt?.startsWith(dateStr));
        const dayResolved = dayReports.filter(r => r.status === 'resolved' || r.status === 'closed');

        weeklyStats.push({
          day: dayName,
          reports: dayReports.length,
          resolved: dayResolved.length
        });
      }

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
    setIsLoading(false);
  };

  // Export Dashboard PDF - Same design as Reports page
  const exportDashboardPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more space
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with gradient effect
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo/Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EnviroLink', 14, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Dashboard Report', 14, 26);

    // Report info box
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, 42, pageWidth - 28, 20, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Summary', 20, 50);

    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPPP')} at ${format(new Date(), 'pp')}`, 20, 56);
    doc.text(`Total Reports: ${dashboardStats.totalReports}`, 150, 50);
    doc.text(`SLA Breaches: ${dashboardStats.slaBreach}`, 150, 56);
    doc.text(`New Reports: ${dashboardStats.newReports}`, 200, 50);
    doc.text(`Resolved: ${dashboardStats.resolved}`, 200, 56);
    doc.text(`Workers: ${workerCount}`, 250, 50);
    doc.text(`Rate: ${dashboardStats.resolutionRate}%`, 250, 56);

    // Table data
    const tableData = reports.slice(0, 20).map(report => {
      const category = WASTE_CATEGORIES[report.category] || { label: report.category };
      const status = STATUS_CONFIG[report.status] || { label: report.status };
      const severity = SEVERITY_CONFIG[report.severity] || { label: report.severity };

      return [
        report.reportId,
        `${report.location.locality || 'Unknown'}\n${report.location.city || 'Mumbai'}`,
        category.label,
        severity.label.toUpperCase(),
        status.label,
        report.assignedTo?.workerName || 'Unassigned',
        format(new Date(report.createdAt), 'MMM d, yyyy\nh:mm a')
      ];
    });

    autoTable(doc, {
      head: [['Report ID', 'Location', 'Category', 'Severity', 'Status', 'Assigned To', 'Reported']],
      body: tableData,
      startY: 68,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 25 },
        5: { cellWidth: 40 },
        6: { cellWidth: 35 },
      },
      didParseCell: (data: any) => {
        // Color severity cells
        if (data.column.index === 3 && data.section === 'body') {
          const val = data.cell.raw?.toString().toLowerCase();
          if (val === 'critical') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'high') {
            data.cell.styles.textColor = [234, 88, 12];
          } else if (val === 'medium') {
            data.cell.styles.textColor = [202, 138, 4];
          }
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${pageCount} | EnviroLink Dashboard - ${format(new Date(), 'yyyy-MM-dd')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`EnviroLink-Dashboard-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Fetch reports on mount and every 30 seconds
    fetchReports();
    const reportTimer = setInterval(fetchReports, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(reportTimer);
    };
  }, []);

  if (!mounted) return null;

  // Filter reports based on search
  const filteredReports = reports.filter(r =>
    !searchQuery ||
    r.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get new reports for notifications
  const newReportsList = reports.filter(r => r.status === 'submitted').slice(0, 5);

  const stats = [
    { label: 'New Reports', value: dashboardStats.newReports, icon: FileText, color: 'bg-blue-500', change: '', positive: true },
    { label: 'In Progress', value: dashboardStats.inProgress, icon: Clock, color: 'bg-amber-500', change: '', positive: true },
    { label: 'Resolved', value: dashboardStats.resolved, icon: CheckCircle, color: 'bg-emerald-500', change: '', positive: true },
    { label: 'Active Workers', value: workerCount, icon: Users, color: 'bg-purple-500', change: '', positive: true },
  ];

  return (
    <div className="space-y-6 pb-8 relative">
      <FloatingBlobs />

      {/* Report Detail Modal */}
      <AnimatePresence>
        {showReportDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReportDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                  <p className="text-sm text-gray-500 font-mono">{showReportDetail.reportId}</p>
                </div>
                <button onClick={() => setShowReportDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-bold" style={{
                    backgroundColor: STATUS_CONFIG[showReportDetail.status]?.bgColor,
                    color: STATUS_CONFIG[showReportDetail.status]?.color
                  }}>
                    {STATUS_CONFIG[showReportDetail.status]?.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-bold border" style={{
                    backgroundColor: `${SEVERITY_CONFIG[showReportDetail.severity]?.color}10`,
                    color: SEVERITY_CONFIG[showReportDetail.severity]?.color
                  }}>
                    {SEVERITY_CONFIG[showReportDetail.severity]?.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900">{showReportDetail.location.locality || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{showReportDetail.location.address}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{WASTE_CATEGORIES[showReportDetail.category]?.label}</p>
                </div>

                {showReportDetail.description && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{showReportDetail.description}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Reported</p>
                  <p className="font-medium text-gray-900">{format(new Date(showReportDetail.createdAt), 'PPpp')}</p>
                </div>

                {showReportDetail.assignedTo && (
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Assigned To</p>
                    <p className="font-medium text-gray-900">{showReportDetail.assignedTo.workerName}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowReportDetail(null);
                    router.push('/reports');
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  View in Reports
                </button>
                <button
                  onClick={() => setShowReportDetail(null)}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {newReportsList.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No new notifications</p>
                </div>
              ) : (
                newReportsList.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowReportDetail(report);
                      setShowNotifications(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">New Report: {report.reportId}</p>
                        <p className="text-xs text-gray-500 truncate">{report.location.locality || report.location.address}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {newReportsList.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push('/reports');
                  }}
                  className="w-full py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View All Reports
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Live Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={28} className="text-emerald-500" />
            Control Room Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Live monitoring • Last updated: {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-100 shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all"
          >
            <Bell size={20} className="text-gray-600" />
            {dashboardStats.newReports > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg">
                {dashboardStats.newReports}
              </span>
            )}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportDashboardPDF}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <p className="text-base font-bold text-gray-700">{stat.label}</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map and Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-500" />
                Live Report Map
              </h3>
              <p className="text-xs text-gray-500">{reports.length} total reports</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Open</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Progress</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Resolved</span>
            </div>
          </div>
          <div className="h-[320px]">
            <MapWrapper
              reports={reports}
              onReportClick={(report) => setShowReportDetail(report)}
              center={reports[0] ? [reports[0].location.latitude, reports[0].location.longitude] : undefined}
            />
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Target size={18} className="text-emerald-500" />
            Report Status
          </h3>
          {pieData.every(d => d.value === 0) ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Target size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reports yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-col gap-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Weekly Trend</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          {weeklyData.every(d => d.reports === 0) ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorReportsAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolvedAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="reports" stroke="#3b82f6" fill="url(#colorReportsAdmin)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolvedAdmin)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center justify-center gap-6 mt-4">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 bg-blue-500 rounded" /> Reports Filed
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 bg-emerald-500 rounded" /> Resolved
            </span>
          </div>
        </motion.div>

        {/* Quick Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Zap size={18} className="text-amber-500" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div>
                <p className="text-sm text-gray-500">Resolution Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{dashboardStats.resolutionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div>
                <p className="text-sm text-gray-500">SLA Breaches</p>
                <p className="text-2xl font-bold text-amber-600">{dashboardStats.slaBreach}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Reports</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
            <button
              onClick={() => router.push('/reports')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No reports found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Report ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.slice(0, 10).map((report) => {
                const category = WASTE_CATEGORIES[report.category] || { label: 'Other', color: '#666', icon: 'Trash2' };
                const status = STATUS_CONFIG[report.status] || { label: 'Unknown', bgColor: '#eee', color: '#999' };
                const severity = SEVERITY_CONFIG[report.severity] || { label: 'Unknown', color: '#999' };

                return (
                  <tr key={report.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{report.reportId}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900 font-medium">{report.location.locality || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{report.location.address}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                          <Trash2 size={16} style={{ color: category.color }} />
                        </span>
                        <span className="text-gray-700">{category.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{ backgroundColor: `${severity.color}15`, color: severity.color }}
                      >
                        {severity.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: status.bgColor, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setShowReportDetail(report)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 mx-auto"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
