import Link from 'next/link';

export default function Page() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-blue-900">Hello World</h1>
            <p className="text-xl text-gray-600 mb-8">Route: /(public)/reis</p>

            <div className="mt-8 w-full max-w-xl text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Sub-Routes</h2>
                <div className="grid grid-cols-1 gap-4">
                    <Link href="/reis/inschrijven" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                        <h3 className="font-semibold text-blue-800">/reis/inschrijven</h3>
                        <p className="text-sm text-gray-500 mt-1">Reis Inschrijving Start</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
