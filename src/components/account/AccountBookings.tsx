'use client';

import { Booking } from "@/types/interface";
import BookingsPage from "../bookings/BookingsPage";

interface AccountBookingsProps {
    type: 'active' | 'history';
    data?: Booking[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
}

export default function AccountBookings({ type, data, page, limit, total, totalPages, loading, onPageChange }: AccountBookingsProps) {

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
                bookingType="SERVICE"
            />
        </div>
    );
}
