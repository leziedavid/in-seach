'use client';
import { Service } from "@/types/interface";
import ServicesCard from "@/components/services/sections/ServicesCard";
import BoostedContentTabs from "@/components/boost/BoostedContentTabs";

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
            <BoostedContentTabs entityType="SERVICE" entityLabel="service" entityLabelPlural="Services" iconMine="solar:hand-stars-bold-duotone">
                <ServicesCard data={data} page={page} limit={limit} total={total} totalPages={totalPages} loading={loading} onPageChange={onPageChange} onSuccess={onSuccess} />
            </BoostedContentTabs>
        </div>
    );
}
