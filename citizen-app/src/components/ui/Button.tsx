'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl border-none cursor-pointer transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5',
            secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
            ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800',
            danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg rounded-3xl',
        };

        const {
            onDrag,
            onDragStart,
            onDragEnd,
            onDragOver,
            onAnimationStart,
            ...buttonProps
        } = props;

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || isLoading}
                {...buttonProps}
            >
                {isLoading ? (
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                ) : (
                    <>
                        {leftIcon}
                        {children}
                        {rightIcon}
                    </>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
