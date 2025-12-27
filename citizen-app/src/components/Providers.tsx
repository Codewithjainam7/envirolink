'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import BootScreen from './BootScreen';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const [showBoot, setShowBoot] = useState(true);
    const [hasBooted, setHasBooted] = useState(false);

    useEffect(() => {
        // Only show boot screen once per session
        const booted = sessionStorage.getItem('hasBooted');
        if (booted) {
            setShowBoot(false);
            setHasBooted(true);
        }
    }, []);

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
