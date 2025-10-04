import { Spinner } from '@heroui/react';

export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center py-8">
            <div className="text-center">
                <Spinner
                    size="lg"
                    classNames={{
                        base: "text-primary",
                        circle1: "border-b-primary",
                        circle2: "border-b-primary"
                    }}
                />
                <p className="mt-4 text-gray-600">Mencari transaksi...</p>
            </div>
        </div>
    );
}