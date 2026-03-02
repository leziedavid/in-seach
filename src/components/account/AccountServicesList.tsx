'use client';
import { Service } from "@/types/interface";
import ServicesCard from "../service/ServicesCard";

interface AccountServicesListProps {
    data?: Service[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function AccountServicesList({ data, page, limit, total, totalPages, loading, onPageChange, onSuccess }: AccountServicesListProps) {
    return (
        <div className="w-full mx-auto py-4">

            <h1 className="text-xl mb-4 font-medium">Mes services</h1>

            <ServicesCard
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
