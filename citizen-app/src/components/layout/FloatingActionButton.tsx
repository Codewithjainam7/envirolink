'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store';

export default function FloatingActionButton() {
    const setIsReportSheetOpen = useAppStore((state) => state.setIsReportSheetOpen);

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsReportSheetOpen(true)}
            className="fixed bottom-24 right-5 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center z-50 border-0 cursor-pointer"
            aria-label="Report waste"
        >
            <Plus size={28} strokeWidth={2.5} />
        </motion.button>
    );
}
