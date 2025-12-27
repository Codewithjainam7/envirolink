'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'flat' | 'elevated';
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            hoverable = false,
            padding = 'md',
            className,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all duration-200';

        const variants = {
            default: 'shadow-sm',
            flat: 'shadow-none',
            elevated: 'shadow-lg',
        };

        const paddings = {
            none: '',
            sm: 'p-3',
            md: 'p-4',
            lg: 'p-6',
        };

        const hoverStyles = hoverable
            ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            : '';

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    paddings[padding],
                    hoverStyles,
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
