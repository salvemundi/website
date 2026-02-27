import { Suspense } from 'react';
import { getHealthStatuses } from '@/server/actions/health.actions';
import Link from 'next/link';

// Force dynamic rendering so it checks status on every request instead of caching at build time

async function ServiceStatusList() {
    const services = await getHealthStatuses();

    return (
        <div className="grid gap-4 mt-8 w-full max-w-2xl">
            {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 bg-white rounded-lg shadow border border-gray-100">
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{service.name}</span>
                        <span className="text-sm text-gray-500 font-mono truncate max-w-[200px] sm:max-w-xs">{service.target}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {service.isOnline ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Online ({service.status})
                            </span>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Offline
                                </span>
                                <span className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={service.error || undefined}>{service.error}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PublicRoutes() {
    return (
        <div className="mt-16 w-full max-w-4xl text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Public Routes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/vereniging" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/vereniging</h3>
                    <p className="text-sm text-gray-500 mt-1">Commissies & Bestuur</p>
                </Link>
                <Link href="/lidmaatschap" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/lidmaatschap</h3>
                    <p className="text-sm text-gray-500 mt-1">Word Lid</p>
                </Link>
                <Link href="/activiteiten" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/activiteiten</h3>
                    <p className="text-sm text-gray-500 mt-1">Kalender</p>
                </Link>
                <Link href="/intro" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/intro</h3>
                    <p className="text-sm text-gray-500 mt-1">Introductieweek Info</p>
                </Link>
                <Link href="/kroegentocht" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/kroegentocht</h3>
                    <p className="text-sm text-gray-500 mt-1">Kroegentocht Flow</p>
                </Link>
                <Link href="/reis" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h3 className="font-semibold text-blue-800">/reis</h3>
                    <p className="text-sm text-gray-500 mt-1">Grote Reis Info</p>
                </Link>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900">
            <div className="flex flex-col items-center mt-8 max-w-4xl text-center w-full">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight text-blue-900">
                    Hello <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">World</span>
                </h1>

                <p className="text-lg text-gray-600 mb-2 leading-relaxed">
                    Netbird VPN Verbinding Test & Route Hub
                </p>

                <div className="inline-block mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Verbonden via Netbird IP: <code className="bg-white px-2 py-0.5 rounded text-blue-700">100.77.182.130</code>
                    </p>
                </div>

                <Suspense fallback={<div className="mt-12 text-gray-400 animate-pulse">Checking connections...</div>}>
                    <ServiceStatusList />
                </Suspense>

                <PublicRoutes />
            </div>
        </main>
    );
}
