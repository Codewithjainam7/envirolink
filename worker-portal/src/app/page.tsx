'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  ClipboardList, MapPin, Clock, AlertTriangle,
  User, Wallet, Bell, Navigation, ChevronRight, Star, Leaf, CheckCircle
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import ActionSlider from '@/components/ActionSlider';

// Mock worker data (Fallback)
const WORKER_FALLBACK = {
  name: 'Worker',
  id: 'WK-XXXX',
  zone: 'Zone --',
  rating: 4.8,
  tasksToday: 3,
  tasksCompleted: 2,
  earnings: {
    today: 450,
    week: 3200,
    month: 12500,
  },
};

// Mock assigned tasks
const ASSIGNED_TASKS = [
  {
    id: 'RPT-2025-0123',
    type: 'Overflowing Bin',
    location: 'Lokhandwala Complex, Gate 2',
    distance: '0.8 km',
    reportedAt: '10 mins ago',
    urgency: 'high',
    status: 'assigned',
    reward: 150,
  },
  {
    id: 'RPT-2025-0124',
    type: 'Illegal Dumping',
    location: 'Link Road, Near Infinity Mall',
    distance: '1.2 km',
    reportedAt: '25 mins ago',
    urgency: 'medium',
    status: 'in_progress',
    reward: 200,
  },
  {
    id: 'RPT-2025-0125',
    type: 'Littering',
    location: 'Oshiwara Garden',
    distance: '2.1 km',
    reportedAt: '1 hour ago',
    urgency: 'low',
    status: 'assigned',
    reward: 100,
  },
];

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState(ASSIGNED_TASKS);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else {
        // Fetch extra profile data if needed, for now just using metadata
        setUser(user);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase]);

  const handleAcceptTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress' } : t
    ));
  };

  const handleRejectTask = (taskId: string) => {
    alert('Warning: Repeatedly rejecting tasks may affect your rating and future assignments.');
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    alert('Task completed! Reward added to your wallet.');
  };

  if (loading) return null; // Or a loading spinner

  const displayName = user?.user_metadata?.first_name || WORKER_FALLBACK.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative pb-20">
      <FloatingBlobs />

      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6 pb-24 relative overflow-hidden rounded-b-[2.5rem] shadow-xl">
        {/* Background decoration */}
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
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">{WORKER_FALLBACK.zone}</p>
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
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold shadow-sm">2</span>
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
              { value: WORKER_FALLBACK.tasksToday, label: 'Tasks Today', icon: ClipboardList },
              { value: WORKER_FALLBACK.tasksCompleted, label: 'Completed', icon: CheckCircle },
              { value: WORKER_FALLBACK.rating, label: 'Rating', icon: Star, isStar: true },
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
                <p className="text-3xl font-extrabold text-gray-900">₹{WORKER_FALLBACK.earnings.today}</p>
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
              <p className="text-xl font-bold text-gray-900">₹{WORKER_FALLBACK.earnings.week.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">This Month</p>
              <p className="text-xl font-bold text-gray-900">₹{WORKER_FALLBACK.earnings.month.toLocaleString()}</p>
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${task.urgency === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                        task.urgency === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                        {task.urgency} Priority
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{task.type}</h3>
                  </div>
                  <div className="text-right bg-emerald-50 px-3 py-2 rounded-xl">
                    <p className="text-lg font-extrabold text-emerald-700">₹{task.reward}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Reward</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin size={16} className="text-emerald-500" />
                    {task.distance}
                  </span>
                  <div className="w-px h-4 bg-gray-300" />
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={16} className="text-emerald-500" />
                    {task.reportedAt}
                  </span>
                </div>

                <p className="text-gray-600 mb-5 flex items-center gap-2 text-sm pl-1">
                  <Leaf size={16} className="text-emerald-400 shrink-0" />
                  {task.location}
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
                  <div className="flex gap-3 mt-4">
                    <div className="flex-1">
                      <ActionSlider
                        label="Slide to Complete"
                        completedLabel="Completed!"
                        color="blue"
                        onComplete={() => {
                          setTimeout(() => handleCompleteTask(task.id), 800);
                        }}
                      />
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
              <p className="text-gray-500 max-w-xs mx-auto">You've completed all assigned tasks. Enjoy your break!</p>
            </motion.div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
