import BackButton from '@/components/ui/navigation/BackButton';

export default function Page() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center space-y-6">
            <BackButton href="/profiel" text="Terug naar profiel" />
            <h1 className="text-4xl font-bold text-blue-900">Hello World</h1>
            <p className="text-xl text-gray-600">Route: /(secure)/profiel/lidmaatschap</p>

            <div className="w-full max-w-xl text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Sub-Routes</h2>
                <div className="grid grid-cols-1 gap-4">
                    <a href="/profiel/lidmaatschap/verlengen" className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                        <h3 className="font-semibold text-blue-800">/profiel/lidmaatschap/verlengen</h3>
                        <p className="text-sm text-gray-500 mt-1">Contributie Verlengen</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
