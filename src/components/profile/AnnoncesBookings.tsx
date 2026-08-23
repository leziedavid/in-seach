'use client';

import { Booking } from "@/types/interface";
import BookingsPage from "@/components/bookings/sections/BookingsPage";

interface AnnoncesBookingsProps {
    type: 'active' | 'history';
    data?: Booking[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
    scope?: 'recues' | 'passees';
    onBack: () => void;
}

export default function AnnoncesBookings({ type, data, page, limit, total, totalPages, loading, onPageChange, onSuccess, scope, onBack }: AnnoncesBookingsProps) {

    return (
        <div>
            <BookingsPage
                data={data}
                page={page}
                limit={limit}
                total={total}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onSuccess={onSuccess}
                bookingType="ANNONCE"
                scope={scope}
                onBack={onBack}
            />
        </div>
    );
}
