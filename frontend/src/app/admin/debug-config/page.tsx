'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, RefreshCw, Server, ShieldAlert } from 'lucide-react';

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
            }`}>
            {active ? 'Configured' : 'Missing'}
        </span>
    );
}

export default function DebugConfigPage() {
    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ['debug-config'],
        queryFn: async () => {
            const res = await fetch('/api/admin/debug-config');
            if (!res.ok) throw new Error('Failed to fetch config status');
            return res.json();
        }
    });

    if (isLoading) return <div className="p-6 text-gray-500">Loading server status...</div>;
    if (error) return <div className="p-6 text-red-500">Error loading status: {error.message}</div>;

    const env = data?.environment;

    return (
        <main className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Server className="w-6 h-6" />
                    Server Configuration Status
                </h1>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Status
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Node Environment</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-200">
                            {env?.nodeEnv || 'Unknown'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">DIRECTUS_URL</span>
                        <div className="text-right">
                            <StatusBadge active={env?.directusUrlConfigured} />
                            {env?.directusUrlConfigured && (
                                <p className="text-xs mt-1 text-gray-500 font-mono">{env.directusUrlValue}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                API_SERVICE_TOKEN
                                {env?.apiServiceTokenConfigured ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                            </span>
                            <p className="text-sm text-gray-500 max-w-md">
                                Required for Admin Proxy Bypass (e.g. Site Settings).
                                Must be set in Portainer/Docker Env.
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <StatusBadge active={env?.apiServiceTokenConfigured} />
                            {env?.apiServiceTokenConfigured ? (
                                <p className="text-xs text-green-600 font-mono">
                                    Token found ({env.apiServiceTokenLength} chars)
                                </p>
                            ) : (
                                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">
                                    CRITICAL: NOT SET
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!env?.apiServiceTokenConfigured && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        Action Required
                    </h2>
                    <p className="mt-2 text-red-700 dark:text-red-300">
                        The <strong>API_SERVICE_TOKEN</strong> is missing. This causes 403 Forbidden errors when accessing protected settings.
                    </p>
                    <ol className="list-decimal list-inside mt-4 space-y-2 text-sm text-red-700 dark:text-red-300 bg-white/50 dark:bg-black/20 p-4 rounded-md">
                        <li>Go to <strong>Portainer</strong> or your Docker management console.</li>
                        <li>Select the <strong>Frontend Container</strong> (e.g. <code>salvemundi-frontend</code>).</li>
                        <li>Go to <strong>Env</strong> / <strong>Environment variables</strong> tab.</li>
                        <li>Add a new variable: <code>DIRECTUS_API_TOKEN</code> (or <code>DIRECTUS_API_KEY</code>).</li>
                        <li>Set the value to a valid Directus Admin Token.</li>
                        <li><strong>Deploy/Restart</strong> the container.</li>
                        <li>Refresh this page.</li>
                    </ol>
                </div>
            )}
        </main>
    );
}
