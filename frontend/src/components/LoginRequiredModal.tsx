'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginRequiredModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0b1220] rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-2">Inloggen vereist</h3>
        <p className="text-sm text-theme-muted mb-4">Je moet ingelogd zijn om dit bericht te liken.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-zinc-800">Sluiten</button>
          <Link href="/login" className="px-4 py-2 rounded-md bg-gradient-theme text-white">Inloggen</Link>
        </div>
      </div>
    </div>
  );
}
