import React from 'react';

interface LoadingSpinnerProps {
    size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40 }) => {
    return (
        <div className="relative animate-in fade-in duration-300" style={{ width: size, height: size }}>
            <div
                className="absolute inset-0 rounded-full border-4 border-purple-500/10"
            />
            <div
                className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"
            />
        </div>
    );
};