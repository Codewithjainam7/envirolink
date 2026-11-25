'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  ClipboardList, MapPin, Clock, AlertTriangle,
  User, Wallet, Bell, Navigation, ChevronRight, Star, Leaf, CheckCircle,
  Camera, X, Loader2, Upload
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import ActionSlider from '@/components/ActionSlider';

interface Task {
  id: string;
  report_id: string;
  category: string;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  created_at: string;
  severity: string;
  status: string;
  description: string;
  images: string[];
}

interface WorkerProfile {
  id: string;
  first_name: string;
  last_name: string;
  zone: string;
  email: string;
  phone: string;
}

interface Earnings {
  today: number;
  week: number;
  month: number;
}

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, week: 0, month: 0 });
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [showProofModal, setShowProofModal] = useState<Task | null>(null);
  const [proofMode, setProofMode] = useState<'resolved' | 'nothing_found'>('resolved');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [workerCoords, setWorkerCoords] = useState<{ lat: number; lng: number; distanceMeters: number } | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nothingFoundReason, setNothingFoundReason] = useState('No waste found at pinned location upon arrival');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch worker profile cleanly (citizen sessions on localhost also share Supabase cookies)
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .ilike('email', user.email || '')
        .maybeSingle();

      if (workerError || !workerData) {
        console.warn('No worker profile for session email; redirecting to worker login.');
        router.replace('/login?error=no-worker-profile');
        return;
      }

      if (workerData.status === 'pending_approval') {
        router.replace('/login?error=pending-approval');
        return;
      }

      if (workerData.status === 'rejected') {
        router.replace('/login?error=rejected');
        return;
      }

      if (workerData.status !== 'approved' && workerData.status !== 'active') {
        router.replace('/login?error=invalid-status');
        return;
      }

      setWorker(workerData);

      // Fetch assigned tasks
      const { data: tasksData } = await supabase
        .from('reports')
        .select('*')
        .eq('assigned_worker_id', workerData.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      // Fetch images for each report
      const tasksWithImages = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { data: imagesData } = await supabase
            .from('report_images')
            .select('url')
            .eq('report_id', task.id);
          return {
            ...task,
            images: imagesData?.map((img: any) => img.url) || []
          };
        })
      );

      setTasks(tasksWithImages);

      // Fetch completed tasks count
      const { count: completedCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_worker_id', workerData.id)
        .eq('status', 'resolved');

      setTasksCompleted(completedCount || 0);

      // Calculate earnings (assuming 100-200 per task based on severity)
      const baseReward = 100;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setMonth(monthStart.getMonth() - 1);

      const { data: completedTasks } = await supabase
        .from('reports')
        .select('created_at, severity')
        .eq('assigned_worker_id', workerData.id)
        .eq('status', 'resolved');

      let todayEarnings = 0, weekEarnings = 0, monthEarnings = 0;
      (completedTasks || []).forEach(task => {
        const reward = task.severity === 'critical' ? 200 : task.severity === 'high' ? 150 : baseReward;
        const taskDate = new Date(task.created_at);
        if (taskDate >= todayStart) todayEarnings += reward;
        if (taskDate >= weekStart) weekEarnings += reward;
        if (taskDate >= monthStart) monthEarnings += reward;
      });

      setEarnings({ today: todayEarnings, week: weekEarnings, month: monthEarnings });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await supabase
        .from('reports')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t));
    } catch (error) {
      console.error('Error accepting task:', error);
    }
  };

  const handleRejectTask = async (taskId: string) => {
    if (!confirm('Warning: Repeatedly rejecting tasks may affect your rating. Continue?')) return;

    try {
      await supabase
        .from('reports')
        .update({
          status: 'submitted',
          assigned_worker_id: null,
          assigned_worker_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  const checkWorkerProximity = (task: Task) => {
    if (!navigator.geolocation) {
      setLocationError('GPS geolocation is not supported on this device.');
      return;
    }
    setCheckingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          task.latitude,
          task.longitude
        );
        setWorkerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, distanceMeters: dist });
        if (dist > 100) {
          setLocationError(`You are ${Math.round(dist)}m away. Move within 100m of the report pin to submit "Nothing Found".`);
        }
        setCheckingLocation(false);
      },
      (err) => {
        setLocationError(`Unable to verify live GPS (${err.message}). Enable location access.`);
        setCheckingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openProofModal = (task: Task, mode: 'resolved' | 'nothing_found') => {
    setProofMode(mode);
    setProofImage(null);
    setVerificationResult(null);
    setWorkerCoords(null);
    setLocationError(null);
    setNothingFoundReason('No waste found at pinned location upon arrival');
    setShowProofModal(task);
    if (mode === 'nothing_found') {
      checkWorkerProximity(task);
    }
  };

  const verifyCompletion = async (task: Task) => {
    if (!proofImage) {
      alert('Please upload a proof image first');
      return;
    }

    if (proofMode === 'nothing_found') {
      if (!workerCoords || workerCoords.distanceMeters > 100) {
        setVerificationResult({
          success: false,
          message: locationError || 'Live GPS verification within 100m of the report pin is required.',
        });
        return;
      }
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Call AI to verify completion or empty-spot photo
      const response = await fetch('/api/verify-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImage: task.images[0] || null,
          proofImage: proofImage,
          category: task.category,
          description: task.description,
          mode: proofMode,
        })
      });

      const result = await response.json();

      if (result.isResolved) {
        if (proofMode === 'nothing_found') {
          const distMeters = Math.round(workerCoords?.distanceMeters || 0);
          await supabase
            .from('reports')
            .update({
              status: 'rejected',
              rejection_reason: `${nothingFoundReason} (Worker GPS verified ${distMeters}m from pin)`,
              rejected_by_worker_id: worker?.id || null,
              verification_status: 'false_report',
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          setVerificationResult({
            success: true,
            message: 'Empty spot verified. Report closed as rejected (no waste found).',
          });

          setTimeout(() => {
            setTasks(tasks.filter(t => t.id !== task.id));
            setShowProofModal(null);
            setProofImage(null);
            setVerificationResult(null);
          }, 2000);
          return;
        }

        // Mark task as resolved
        await supabase
          .from('reports')
          .update({
            status: 'resolved',
            updated_at: new Date().toISOString(),
            verification_status: 'verified',
            verified_at: new Date().toISOString()
          })
          .eq('id', task.id);

        // Add earnings record (optional - if earnings table exists)
        const reward = task.severity === 'critical' ? 200 : task.severity === 'high' ? 150 : 100;

        setVerificationResult({ success: true, message: `Task completed! ₹${reward} added to your earnings.` });

        setTimeout(() => {
          setTasks(tasks.filter(t => t.id !== task.id));
          setShowProofModal(null);
          setProofImage(null);
          setVerificationResult(null);
          setTasksCompleted(prev => prev + 1);
          setEarnings(prev => ({ ...prev, today: prev.today + reward }));
        }, 2000);
      } else {
        setVerificationResult({
          success: false,
          message: result.message || 'Verification failed. Please ensure the photo clearly shows the site.'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ success: false, message: 'Verification failed. Please try again.' });
    } finally {
      setVerifying(false);
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

  const getRewardForTask = (severity: string) => {
    return severity === 'critical' ? 200 : severity === 'high' ? 150 : 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const displayName = worker?.first_name || user?.user_metadata?.first_name || 'Worker';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative pb-20">
      <FloatingBlobs />

      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6 pb-24 relative overflow-hidden rounded-b-[2.5rem] shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.img
                src="/images/envirolink-icon.png"
                alt="ENVIROLINK"
                className="w-10 h-10 object-contain"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Hello, {displayName}!</h1>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">{worker?.zone || 'Zone --'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/notifications">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition border border-white/10"
                >
                  <Bell size={20} />
                  {tasks.filter(t => t.status === 'assigned').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold shadow-sm">
                      {tasks.filter(t => t.status === 'assigned').length}
                    </span>
                  )}
                </motion.button>
              </Link>
              <Link href="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-lg border border-white/30 text-emerald-50 shadow-sm"
                >
                  {displayName[0]}
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: tasks.length, label: 'Tasks Today', icon: ClipboardList },
              { value: tasksCompleted, label: 'Completed', icon: CheckCircle },
              { value: '4.8', label: 'Rating', icon: Star, isStar: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 shadow-lg shadow-emerald-900/10"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {stat.isStar && <Star size={18} className="text-yellow-300" fill="#fde047" />}
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <p className="text-xs text-emerald-100 font-medium uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10 space-y-6">
        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-emerald-100 transition-colors" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center shadow-inner">
                <Wallet size={28} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">Today's Earnings</p>
                <p className="text-3xl font-extrabold text-gray-900">₹{earnings.today}</p>
              </div>
            </div>
            <Link href="/earnings">
              <motion.button
                whileHover={{ x: 4 }}
                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition"
              >
                <ChevronRight size={20} />
              </motion.button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">This Week</p>
              <p className="text-xl font-bold text-gray-900">₹{earnings.week.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">This Month</p>
              <p className="text-xl font-bold text-gray-900">₹{earnings.month.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Active Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-bold text-gray-900">Assigned Tasks</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              {tasks.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
                className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${task.severity === 'critical' || task.severity === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                          task.severity === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                        {task.severity || 'medium'} Priority
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {task.status === 'in_progress' ? 'In Progress' : 'New'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {task.category?.replace(/_/g, ' ') || 'Waste Report'}
                    </h3>
                  </div>
                  <div className="text-right bg-emerald-50 px-3 py-2 rounded-xl">
                    <p className="text-lg font-extrabold text-emerald-700">₹{getRewardForTask(task.severity)}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Reward</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin size={16} className="text-emerald-500" />
                    {task.locality || 'Unknown'}
                  </span>
                  <div className="w-px h-4 bg-gray-300" />
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={16} className="text-emerald-500" />
                    {formatTimeAgo(task.created_at)}
                  </span>
                </div>

                <p className="text-gray-600 mb-5 flex items-center gap-2 text-sm pl-1">
                  <Leaf size={16} className="text-emerald-400 shrink-0" />
                  {task.address?.slice(0, 60) || task.locality || 'Location not specified'}
                </p>

                {task.status === 'assigned' ? (
                  <div className="mt-4">
                    <ActionSlider
                      label="Slide to Accept Task"
                      completedLabel="Task Accepted!"
                      color="emerald"
                      onComplete={() => {
                        setTimeout(() => handleAcceptTask(task.id), 800);
                      }}
                    />
                    <button
                      onClick={() => handleRejectTask(task.id)}
                      className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                    >
                      Decline Assignment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 mt-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openProofModal(task, 'resolved')}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                        >
                          <Camera size={20} />
                          Complete Task
                        </motion.button>
                      </div>
                      <Link href="/map">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-5 py-3 bg-white border-2 border-emerald-100 text-emerald-600 font-bold rounded-full hover:bg-emerald-50 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Navigation size={20} />
                        </motion.button>
                      </Link>
                    </div>
                    <button
                      onClick={() => openProofModal(task, 'nothing_found')}
                      className="w-full py-2.5 rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <AlertTriangle size={14} />
                      Nothing Found at Spot (GPS + Photo Proof)
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-lg p-10 text-center border border-emerald-100"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle size={48} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500 max-w-xs mx-auto">No tasks assigned yet. New tasks will appear here when assigned.</p>
            </motion.div>
          )}
        </div>

        <BottomNav />
      </div>

      {/* Proof Upload Modal */}
      <AnimatePresence>
        {showProofModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !verifying && setShowProofModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {proofMode === 'nothing_found' ? 'Report Nothing Found' : 'Complete Task'}
                </h3>
                <button
                  onClick={() => !verifying && setShowProofModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  disabled={verifying}
                >
                  <X size={20} />
                </button>
              </div>

              {proofMode === 'nothing_found' && (
                <div className="mb-4 space-y-3">
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
                      checkingLocation
                        ? 'bg-gray-50 border-gray-200 text-gray-600'
                        : workerCoords && workerCoords.distanceMeters <= 100
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0" />
                      {checkingLocation
                        ? 'Checking live GPS distance to pin...'
                        : workerCoords && workerCoords.distanceMeters <= 100
                        ? `GPS Verified (${Math.round(workerCoords.distanceMeters)}m from report pin)`
                        : locationError || 'GPS proximity check required (within 100m).'}
                    </span>
                    <button
                      type="button"
                      onClick={() => showProofModal && checkWorkerProximity(showProofModal)}
                      className="underline font-bold shrink-0"
                    >
                      Retry
                    </button>
                  </div>

                  <input
                    type="text"
                    value={nothingFoundReason}
                    onChange={(e) => setNothingFoundReason(e.target.value)}
                    placeholder="Reason (e.g., No waste found at spot)"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 text-gray-800"
                  />
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  {proofMode === 'nothing_found'
                    ? 'Take a clear photo of the empty/clean spot at the pin. AI + GPS will verify no waste is present.'
                    : 'Upload a photo showing the completed work. Our AI will verify if the issue has been resolved.'}
                </p>

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                  {proofImage ? (
                    <div className="relative">
                      <img src={proofImage} alt="Proof" className="max-h-48 mx-auto rounded-xl" />
                      <button
                        onClick={() => setProofImage(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        disabled={verifying}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 font-medium">Click to upload proof image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {verificationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl mb-4 ${verificationResult.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                  <p className="font-medium">{verificationResult.message}</p>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => verifyCompletion(showProofModal)}
                disabled={
                  !proofImage ||
                  verifying ||
                  (proofMode === 'nothing_found' && (!workerCoords || workerCoords.distanceMeters > 100))
                }
                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  proofMode === 'nothing_found'
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                }`}
              >
                {verifying ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {proofMode === 'nothing_found' ? 'Verify Empty Spot & Reject' : 'Verify & Complete'}
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
