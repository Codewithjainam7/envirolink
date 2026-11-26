'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BootScreen from '@/components/BootScreen';
import Sidebar from '@/components/Sidebar';

function isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('admin_session');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return parsed?.role === 'admin' && Boolean(parsed?.username);
    } catch {
        return false;
    }
}

export default function BootAppWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [showBoot, setShowBoot] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);

    const handleBootComplete = useCallback(() => {
        setShowBoot(false);
    }, []);

    useEffect(() => {
        const authed = isAdminAuthenticated();
        setIsAuthed(authed);
        setAuthChecked(true);

        if (!authed && pathname !== '/login') {
            router.replace('/login');
        } else if (authed && pathname === '/login') {
            router.replace('/');
        }
    }, [pathname, router]);

    const isLoginPage = pathname === '/login';

    return (
        <>
            {showBoot && <BootScreen onComplete={handleBootComplete} />}
            <div style={{ opacity: showBoot ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                {!authChecked || (!isAuthed && !isLoginPage) ? (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isLoginPage ? (
                    <main className="min-h-screen">
                        {children}
                    </main>
                ) : (
                    <>
                        <Sidebar />
                        <main className="main-content">
                            {children}
                        </main>
                    </>
                )}
            </div>
        </>
    );
}
