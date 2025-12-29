"use client";

import React from 'react';

interface IconCardProps {
  icon: React.ReactElement;
  children: React.ReactNode;
  className?: string;
}

export default function IconCard({ icon, children, className = '' }: IconCardProps) {
  return (
    <div
      className={`group relative rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-purple/10 text-theme-purple group-hover:bg-gradient-theme group-hover:text-theme-white transition-colors">
        {icon}
      </div>

      <div className="text-theme-muted leading-relaxed">{children}</div>
    </div>
  );
}
