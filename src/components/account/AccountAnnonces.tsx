'use client';

import { Annonce } from "@/types/interface";
import AnnoncesCard from "../service/AnnoncesCard";

interface AccountAnnoncesProps {
    data?: Annonce[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function AccountAnnonces({ data = [], page = 1, limit = 6, total = 0, totalPages = 0, loading = false, onPageChange, onSuccess }: AccountAnnoncesProps) {
    return (
        <div className="w-full mx-auto py-4">
            <AnnoncesCard
                data={data}
                page={page}
                limit={limit}
                total={total}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onSuccess={onSuccess}
            />
        </div>
    );
}
