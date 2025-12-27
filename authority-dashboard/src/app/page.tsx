'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  ChevronRight, Filter, Search, Bell, MoreVertical, MapPin, Truck, Users,
  Activity, Zap, Target, Phone, Shield, RefreshCw,
  Trash2, Package, Recycle, Construction, Cpu, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
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

// Mock Data
const mockStats: DashboardStats = {
  totalReports: 1234,
  newReports: 45,
  inProgress: 123,
  resolved: 890,
  slaBreach: 12,
  resolutionRate: 96.3,
  avgResolutionHours: 18,
};

const mockReports: Report[] = [
  {
    id: '1',
    reportId: 'RPT-2024-001',
    location: { latitude: 19.076, longitude: 72.877, address: '123 Marine Drive', locality: 'Churchgate', city: 'Mumbai' },
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
    reportId: 'RPT-2024-002',
    location: { latitude: 19.118, longitude: 72.905, address: '45 Linking Road', locality: 'Bandra', city: 'Mumbai' },
    category: 'overflowing_bin',
    severity: 'medium',
    status: 'in_progress',
    isAnonymous: true,
    assignedTo: { departmentId: 'd1', departmentName: 'SWM', workerId: 'w1', workerName: 'Amit K.' },
    slaHours: 48,
    slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isSlaBreach: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    reportId: 'RPT-2024-003',
    location: { latitude: 19.040, longitude: 72.865, address: '78 Colaba', locality: 'Colaba', city: 'Mumbai' },
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
  {
    id: '4',
    reportId: 'RPT-2024-004',
    location: { latitude: 19.180, longitude: 72.955, address: '21 Juhu Beach', locality: 'Juhu', city: 'Mumbai' },
    category: 'littering',
    severity: 'low',
    status: 'resolved',
    isAnonymous: false,
    reporterName: 'Vikram S.',
    slaHours: 72,
    slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    isSlaBreach: false,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const chartData = [
  { date: 'Mon', reports: 65, resolved: 58 },
  { date: 'Tue', reports: 78, resolved: 70 },
  { date: 'Wed', reports: 45, resolved: 48 },
  { date: 'Thu', reports: 92, resolved: 85 },
  { date: 'Fri', reports: 68, resolved: 72 },
  { date: 'Sat', reports: 55, resolved: 50 },
  { date: 'Sun', reports: 40, resolved: 42 },
];

const pieData = [
  { name: 'Resolved', value: 890, color: '#10b981' },
  { name: 'In Progress', value: 123, color: '#f59e0b' },
  { name: 'Open', value: 45, color: '#ef4444' },
];

// Live vehicles mock data
const vehicles = [
  { id: 'V001', driver: 'Ramesh K.', status: 'active', location: 'Bandra West', speed: 25 },
  { id: 'V002', driver: 'Suresh P.', status: 'active', location: 'Andheri East', speed: 18 },
  { id: 'V003', driver: 'Mahesh T.', status: 'idle', location: 'Juhu', speed: 0 },
  { id: 'V004', driver: 'Dinesh R.', status: 'active', location: 'Colaba', speed: 22 },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalReports: 0, newReports: 0, inProgress: 0, resolved: 0,
    slaBreach: 0, resolutionRate: 0, avgResolutionHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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
    { label: 'New Reports', value: dashboardStats.newReports, icon: FileText, color: 'bg-blue-500', change: '+12%', positive: true },
    { label: 'In Progress', value: dashboardStats.inProgress, icon: Clock, color: 'bg-amber-500', change: '-5%', positive: true },
    { label: 'Resolved Today', value: dashboardStats.resolved, icon: CheckCircle, color: 'bg-emerald-500', change: '+18%', positive: true },
    { label: 'SLA Breach', value: dashboardStats.slaBreach, icon: AlertTriangle, color: 'bg-red-500', change: '+3', positive: false },
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
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-100 shadow-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </motion.button>
          <button className="relative p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 shadow-sm">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
          <button className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all">
            <FileText size={16} className="inline mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid - Landing Page Style */}
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
            {/* Icon + Label on same row */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <p className="text-base font-bold text-gray-700">{stat.label}</p>
            </div>
            {/* Value + Change */}
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.positive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                {stat.positive ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                {stat.change}
              </span>
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
              <p className="text-xs text-gray-500">{mockReports.length} active reports</p>
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
            <button className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
              <Filter size={12} /> Filter
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
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
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="reports" stroke="#3b82f6" fill="url(#colorReportsAdmin)" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolvedAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Live Vehicle Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck size={18} className="text-blue-500" />
              Live Vehicles
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-semibold">
              {vehicles.filter(v => v.status === 'active').length} Active
            </span>
          </div>
          <div className="space-y-3">
            {vehicles.map((vehicle, i) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vehicle.status === 'active' ? 'bg-emerald-100' : 'bg-gray-200'
                    }`}>
                    <Truck size={18} className={vehicle.status === 'active' ? 'text-emerald-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{vehicle.id} - {vehicle.driver}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} /> {vehicle.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${vehicle.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                    }`}>
                    {vehicle.status === 'active' ? `${vehicle.speed} km/h` : 'Idle'}
                  </span>
                </div>
              </motion.div>
            ))}
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

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Report ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Severity</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SLA</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const category = WASTE_CATEGORIES[report.category];
              const status = STATUS_CONFIG[report.status];
              const severity = SEVERITY_CONFIG[report.severity];

              return (
                <tr key={report.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{report.reportId}</td>
                  <td className="px-5 py-4">
                    <p className="text-gray-900 font-medium">{report.location.locality}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{report.location.address}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                        {/* Dynamic Icon Rendering */}
                        {(() => {
                          const IconComponent = { Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle }[category.icon] || Trash2;
                          return <IconComponent size={16} style={{ color: category.color }} />;
                        })()}
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
                  <td className="px-5 py-4">
                    {report.isSlaBreach ? (
                      <span className="text-red-500 text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} /> Breached
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        {Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h left
                      </span>
                    )}
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
      </motion.div>
    </div>
  );
}
