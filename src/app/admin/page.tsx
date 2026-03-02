'use client';

import React from 'react';
import { Users, Briefcase, CreditCard, Settings, Search, MoreVertical, BadgeCheck, AlertCircle, Terminal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminPage() {
    const stats = [
        { label: 'Utilisateurs', value: '1,240', icon: Users, color: 'text-indigo-600' },
        { label: 'Services Actifs', value: '458', icon: Briefcase, color: 'text-green-600' },
        { label: 'Abonnements', value: '89', icon: CreditCard, color: 'text-orange-600' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300">
            {/* Admin Sidebar */}
            <div className="flex">
                <aside className="w-72 bg-slate-950 h-screen sticky top-0 border-r border-slate-800 p-8 flex flex-col">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">S</div>
                        <span className="text-2xl font-black text-white">AdminHub</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {[
                            { label: 'Overview', icon: Settings, href: '/admin', active: true },
                            { label: 'Users', icon: Users, href: '/admin/users', active: false },
                            { label: 'Services', icon: Briefcase, href: '/admin/services', active: false },
                            { label: 'Payments', icon: CreditCard, href: '/admin/payments', active: false },
                            { label: 'System Logs', icon: Terminal, href: '/logs', active: false },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                href={item.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all cursor-pointer ${item.active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 text-slate-500'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Admin Content */}
                <main className="flex-1 p-12 overflow-y-auto">
                    <header className="flex items-center justify-between mb-16">
                        <div>
                            <h1 className="text-4xl font-black text-white mb-2">Backoffice</h1>
                            <p className="text-slate-500 font-medium">Contrôlez l'ensemble de votre écosystème SaaS.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-2xl border border-slate-700">
                            <Search className="text-slate-500 ml-2" />
                            <input
                                type="text"
                                placeholder="Global search..."
                                className="bg-transparent outline-none border-none text-white font-medium p-2"
                            />
                        </div>
                    </header>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl">
                                <div className={`${stat.color} mb-6`}>
                                    <stat.icon className="w-10 h-10" />
                                </div>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">{stat.label}</p>
                                <h3 className="text-5xl font-black text-white">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-slate-800 rounded-[3rem] border border-slate-700 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white">Flux d'activités</h2>
                            <button className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm">Refresh</button>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 font-bold text-sm uppercase tracking-widest border-b border-slate-700">
                                        <th className="p-6">Utilisateur</th>
                                        <th className="p-6">Action</th>
                                        <th className="p-6">Date</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {[
                                        { user: 'thomas@test.com', action: 'Upgrade to Premium', date: '2 min ago', status: 'SUCCESS', icon: BadgeCheck, statusColor: 'text-green-400' },
                                        { user: 'marc@pro.fr', action: 'Nouveau Service', date: '45 min ago', status: 'PENDING', icon: AlertCircle, statusColor: 'text-orange-400' },
                                        { user: 'alice@gmail.com', action: 'Réservation', date: '2 hours ago', status: 'SUCCESS', icon: BadgeCheck, statusColor: 'text-green-400' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-900 transition-colors">
                                            <td className="p-6 font-bold text-white">{row.user}</td>
                                            <td className="p-6 font-medium">{row.action}</td>
                                            <td className="p-6 text-slate-500">{row.date}</td>
                                            <td className="p-6 flex items-center gap-2">
                                                <row.icon className={`w-4 h-4 ${row.statusColor}`} />
                                                <span className={`font-black text-xs tracking-tighter ${row.statusColor}`}>{row.status}</span>
                                            </td>
                                            <td className="p-6 text-right cursor-pointer text-slate-600 hover:text-white transition-colors">
                                                <MoreVertical className="w-5 h-5 ml-auto" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
