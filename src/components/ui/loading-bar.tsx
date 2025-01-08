import React from 'react';

interface LoadingBarProps {
    progress?: number;
    indeterminate?: boolean;
    className?: string;
    color?: string;
}

export function LoadingBar({
    progress = 0,
    indeterminate = false,
    className = '',
    color = 'blue'
}: LoadingBarProps) {
    return (
        <div className={`h-2 w-full bg-transparent rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full bg-${color}-500 rounded-full transition-all duration-500 ease-out
          ${indeterminate ? 'animate-indeterminate' : ''}`}
                style={{
                    width: indeterminate ? '100%' : `${Math.min(Math.max(progress, 0), 100)}%`
                }}
            />
        </div>
    );
}