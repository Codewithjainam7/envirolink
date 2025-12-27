'use client';

import { useState, useCallback } from 'react';
import BootScreen from '@/components/BootScreen';

export default function BootAppWrapper({ children }: { children: React.ReactNode }) {
    const [showBoot, setShowBoot] = useState(true);

    const handleBootComplete = useCallback(() => {
        setShowBoot(false);
    }, []);

    return (
        <>
            {showBoot && <BootScreen onComplete={handleBootComplete} />}
            <div style={{ opacity: showBoot ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                {children}
            </div>
        </>
    );
}
