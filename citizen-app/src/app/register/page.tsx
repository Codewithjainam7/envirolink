'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Register page now redirects to login since we use Google-only auth
export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100/80 via-gray-100 to-emerald-50">
            <p className="text-gray-500">Redirecting to login...</p>
        </div>
    );
}
