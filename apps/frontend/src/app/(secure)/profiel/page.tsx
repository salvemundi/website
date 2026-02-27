import Link from 'next/link';

export default function ProfielPage() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Logged in (Secure) Routes</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profiel/lidmaatschap" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/profiel/lidmaatschap</h2>
                    <p className="text-sm text-gray-500">Lidmaatschap Inzien</p>
                </Link>
                <Link href="/profiel/transacties" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/profiel/transacties</h2>
                    <p className="text-sm text-gray-500">Mollie Betaalhistorie</p>
                </Link>
                <Link href="/profiel/tickets" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/profiel/tickets</h2>
                    <p className="text-sm text-gray-500">QR Tickets Inzien</p>
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-12 border-b pb-4">Actieve Reizen</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/reis/dashboard" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/reis/dashboard</h2>
                    <p className="text-sm text-gray-500">Persoonlijke Reis Status</p>
                </Link>
                <Link href="/reis/activiteiten" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/reis/activiteiten</h2>
                    <p className="text-sm text-gray-500">Excursies Keuzemenu</p>
                </Link>
                <Link href="/reis/betalen/aanbetaling" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/reis/betalen/aanbetaling</h2>
                    <p className="text-sm text-gray-500">Aanbetaling Reis</p>
                </Link>
                <Link href="/reis/betalen/restbetaling" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                    <h2 className="font-semibold text-blue-800">/reis/betalen/restbetaling</h2>
                    <p className="text-sm text-gray-500">Restbetaling Reis</p>
                </Link>
            </div>
        </div>
    );
}
