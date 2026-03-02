'use client';

import React from 'react';
import { LayoutDashboard, Briefcase, Calendar, Star, TrendingUp, Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getMe, getMyBookings } from '@/api/api';

export default function DashboardPage() {
    const { data: bookingsRes, isLoading: bookingsLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => getMyBookings({ page: 1, limit: 10 }),
    });

    const { data: userRes, isLoading: userLoading } = useQuery({
        queryKey: ['me'],
        queryFn: getMe
    });

    const bookingsData = bookingsRes?.data;
    const bookings = bookingsData?.data || [];
    const totalBookings = bookingsData?.total || 0;
    const user = userRes?.data;

    const stats = [
        { label: 'Interv.', value: totalBookings, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Note', value: '4.8', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Crédits', value: user?.credits || '0', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    if (userLoading || bookingsLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col">
                <div className="p-8 pb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">ServiceMarket</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { label: 'Tableau de bord', icon: LayoutDashboard, active: true, link: '/dashboard' },
                        { label: 'Publier', icon: Briefcase, active: false, link: '/dashboard/create-service' },
                        { label: 'Réservations', icon: Calendar, active: false, link: '#' },
                        { label: 'Avis', icon: Star, active: false, link: '#' },
                    ].map((item, i) => (
                        <Link
                            key={i}
                            href={item.link}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${item.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Bienvenue, {user?.email?.split('@')[0]} !</h1>
                        <p className="text-slate-500 font-medium">Voici ce qui se passe sur votre espace aujourd'hui.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden relative">
                            {user?.id && (
                                <Image
                                    src={`https://i.pravatar.cc/150?u=${user.id}`}
                                    alt="avatar"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">{stat.label}</p>
                            <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Bookings Section */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Réservations récentes</h2>
                        <button className="text-indigo-600 font-bold text-sm hover:underline">Voir tout</button>
                    </div>

                    <div className="space-y-4">
                        {bookings?.length === 0 && <p className="text-slate-400 font-medium py-10 text-center">Aucune réservation pour le moment.</p>}
                        {bookings?.map((booking: any, i: number) => (
                            <div key={i} className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:border-indigo-200">
                                    {booking.client?.email?.[0].toUpperCase()}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="font-bold text-slate-900">{booking.service?.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium">Client: {booking.client?.email} • {new Date(booking.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="font-black text-slate-900">{booking.price || 'À déf'}€</span>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
