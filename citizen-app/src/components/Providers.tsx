'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import BootScreen from './BootScreen';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const pathname = usePathname();
    const [showBoot, setShowBoot] = useState(false);
    const [hasBooted, setHasBooted] = useState(true);

    useEffect(() => {
        const booted = sessionStorage.getItem('hasBooted');
        const isLandingRoute = pathname === '/' || pathname === '/home';
        if (!booted && isLandingRoute) {
            setHasBooted(false);
            setShowBoot(true);
        } else {
            sessionStorage.setItem('hasBooted', 'true');
            setShowBoot(false);
            setHasBooted(true);
        }
    }, [pathname]);

    const handleBootComplete = () => {
        setShowBoot(false);
        setHasBooted(true);
        sessionStorage.setItem('hasBooted', 'true');
    };

    return (
        <AuthProvider>
            {showBoot && !hasBooted && (
                <BootScreen onComplete={handleBootComplete} variant="citizen" />
            )}
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#1f2937',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </AuthProvider>
    );
}
