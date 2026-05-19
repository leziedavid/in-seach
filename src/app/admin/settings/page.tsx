'use client';

import React from 'react';
import { Settings, Save, Globe, Lock, Bell, Palette, Database, Code, Info, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SeedAdminManager from '@/components/dashboard/admin/SeedAdminManager';
import { useTranslation } from "@/utils/langue/hooks";

interface AdminSettings {
    maintenanceMode: boolean;
    userRegistration: boolean;
    emailNotifications: boolean;
    highPerformanceMode: boolean;
    realtimeLogs: boolean;
    analyticsEnabled: boolean;
}

export default function AdminSettingsPage() {
    const { t } = useTranslation();

    const { addNotification } = useNotification();
    const [settings, setSettings] = React.useState<AdminSettings>({
        maintenanceMode: false,
        userRegistration: true,
        emailNotifications: true,
        highPerformanceMode: true,
        realtimeLogs: false,
        analyticsEnabled: true
    });

    const handleSave = () => {
        addNotification(t("admin.settings.save_success"), "success");
    };

    const sections = [
        {
            title: t("admin.settings.general"),
            icon: Globe,
            items: [
                { id: 'maintenanceMode', label: t("admin.settings.maintenance_mode"), description: t("admin.settings.maintenance_desc"), icon: Lock },
                { id: 'userRegistration', label: t("admin.settings.registrations_open"), description: t("admin.settings.registrations_desc"), icon: ShieldCheck }
            ]
        },
        {
            title: t("admin.settings.system_performance"),
            icon: Activity,
            items: [
                { id: 'highPerformanceMode', label: t("admin.settings.high_performance_mode"), description: t("admin.settings.high_performance_desc"), icon: Zap },
                { id: 'realtimeLogs', label: t("admin.settings.realtime_logs"), description: t("admin.settings.realtime_logs_desc"), icon: Code }
            ]
        },
        {
            title: t("admin.settings.communications"),
            icon: Bell,
            items: [
                { id: 'emailNotifications', label: t("admin.settings.email_notifications"), description: t("admin.settings.email_notifications_desc"), icon: Bell },
                { id: 'analyticsEnabled', label: t("admin.settings.analytics_enabled"), description: t("admin.settings.analytics_desc"), icon: Info }
            ]
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">{t("admin.settings.title")}</h1>
                    <p className="text-muted-foreground font-medium text-sm">{t("admin.settings.subtitle")}</p>
                </div>
                <Button onClick={handleSave} className="rounded-lg font-bold gap-2 px-8" >
                    <Save className="w-4 h-4" />
                    {t("common.save")}
                </Button>
            </header>
            <SeedAdminManager />

        </div>
    );
}
