'use client';

import { Booking } from "@/types/interface";
import BookingsPage from "@/components/bookings/sections/BookingsPage";

interface AccountBookingsProps {
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
}

export default function AccountBookings({ type, data, page, limit, total, totalPages, loading, onPageChange, onSuccess, scope }: AccountBookingsProps) {

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
                bookingType="SERVICE"
                scope={scope}
            />
        </div>
    );
}
