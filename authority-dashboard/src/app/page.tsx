'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  ChevronRight, Filter, Search, Bell, MoreVertical, MapPin, Users,
  Activity, Zap, Target, Phone, Shield, RefreshCw,
  Trash2, Package, Recycle, Construction, Cpu, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { Report, DashboardStats, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG } from '@/types';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import FloatingBlobs from '@/components/FloatingBlobs';

// Dynamic import for map
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
});

export default function DashboardPage() {
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

  const stats = [
    { label: 'New Reports', value: dashboardStats.newReports, icon: FileText, color: 'bg-blue-500', change: '', positive: true },
    { label: 'In Progress', value: dashboardStats.inProgress, icon: Clock, color: 'bg-amber-500', change: '', positive: true },
    { label: 'Resolved', value: dashboardStats.resolved, icon: CheckCircle, color: 'bg-emerald-500', change: '', positive: true },
    { label: 'Active Workers', value: workerCount, icon: Users, color: 'bg-purple-500', change: '', positive: true },
  ];

  return (
    <div className="space-y-6 pb-8 relative">
      <FloatingBlobs />

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
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-100 shadow-sm"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
          <button className="relative p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 shadow-sm">
            <Bell size={20} className="text-gray-600" />
            {dashboardStats.newReports > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <button className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all">
            <FileText size={16} className="inline mr-2" />
            Export Report
          </button>
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

      {/* Main Grid - Map + Charts */}
      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        {/* Live Map - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-500" />
                Live Report Map
              </h3>
              <p className="text-xs text-gray-500">{reports.length} total reports</p>
            </div>
            <div className="flex gap-2">
              {[
                { color: 'bg-red-500', label: 'Open' },
                { color: 'bg-amber-500', label: 'Progress' },
                { color: 'bg-emerald-500', label: 'Resolved' },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            <MapWrapper reports={reports} zoom={11} />
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 border-emerald-100"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-500" />
            Report Status
          </h3>
          {dashboardStats.totalReports === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Target size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reports yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reports Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
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
                className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
            <button className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium flex items-center gap-2">
              View All <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {reports.length === 0 ? (
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
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map((report) => {
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
                    <td className="px-5 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical size={16} className="text-gray-400" />
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
