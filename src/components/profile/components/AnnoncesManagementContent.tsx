"use client"

import { Annonce } from "@/types/interface"
import AnnoncesCard from "@/components/annonces/sections/AnnoncesCard"
import BoostedContentTabs from "@/components/boost/BoostedContentTabs"

interface AnnoncesManagementContentProps {
    data?: Annonce[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function AnnoncesManagementContent({ data, page, limit, total, totalPages, loading, onPageChange, onSuccess }: AnnoncesManagementContentProps) {
    return (
        <BoostedContentTabs entityType="ANNONCE" entityLabel="annonce" entityLabelPlural="Annonces" iconMine="solar:lightbulb-bolt-bold-duotone">
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
        </BoostedContentTabs>
    );
}
