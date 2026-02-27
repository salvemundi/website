export default function Page() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-blue-900 border-b pb-4">Auth Error</h1>
            <p className="text-gray-600 mb-8">
                Er is een fout opgetreden tijdens het inloggen. Probeer het opnieuw of neem contact op met de ICT-commissie.
            </p>
            <a href="/api/auth/signin" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Terug naar inloggen</a>
        </div>
    );
}
