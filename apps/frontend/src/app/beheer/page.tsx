import Link from 'next/link';

export default function BeheerPage() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Beheer (Admin) Routes</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/beheer" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer</h2>
                    <p className="text-sm text-gray-500">Omzet & Ledental Stats</p>
                </Link>
                <Link href="/beheer/leden" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/leden</h2>
                    <p className="text-sm text-gray-500">Ledenbeheer (CRUD)</p>
                </Link>
                <Link href="/beheer/impersonate" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/impersonate</h2>
                    <p className="text-sm text-gray-500">Inloggen als ander lid</p>
                </Link>
                <Link href="/beheer/activiteiten" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/activiteiten</h2>
                    <p className="text-sm text-gray-500">Aanmaken/wijzigen events</p>
                </Link>
                <Link href="/beheer/intro" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/intro</h2>
                    <p className="text-sm text-gray-500">Introductieweek Beheer</p>
                </Link>
                <Link href="/beheer/reis" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/reis</h2>
                    <p className="text-sm text-gray-500">Deelnemerslijsten & status</p>
                </Link>
                <Link href="/beheer/vereniging" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/vereniging</h2>
                    <p className="text-sm text-gray-500">Commissies & historie</p>
                </Link>
                <Link href="/beheer/coupons" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/beheer/coupons</h2>
                    <p className="text-sm text-gray-500">Kortingscodes beheren</p>
                </Link>
            </div>
        </div>
    );
}
