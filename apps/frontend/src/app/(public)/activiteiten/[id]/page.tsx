export default function PageActivityId() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-blue-900">Hello World</h1>
            <p className="text-xl text-gray-600">Route: /(public)/activiteiten/[id]</p>
            <p className="mt-4 text-sm text-gray-500">This is a dynamic route for a specific activity.</p>
        </div>
    );
}
