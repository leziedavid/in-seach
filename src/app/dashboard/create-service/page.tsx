'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Camera, Plus, Loader2, Image as ImageIcon, Sparkles, MapPin, Tag } from 'lucide-react';
import AiAnalysisModule from '@/components/service/AiAnalysisModule';

export default function CreateServicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'DEPANNAGE',
        categoryId: '',
        latitude: 6.3654,
        longitude: 2.4183, // Mock Cotonou
    });

    const categories = [
        { id: 'cat1', label: 'Plomberie' },
        { id: 'cat2', label: 'Électricité' },
        { id: 'cat3', label: 'Climatisation' },
        { id: 'cat4', label: 'Ménage' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/services', { ...form, imageUrls: [] });
            router.push('/dashboard');
        } catch (err) {
            alert('Erreur: Vérifiez votre abonnement ou les champs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto px-8 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Publier un service</h1>
                    <p className="text-slate-500 font-medium">Remplissez les informations pour attirer vos premiers clients.</p>
                </header>

                <div className="space-y-12">
                    {/* AI Assistance */}
                    <AiAnalysisModule />

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Titre du service</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Réparation de fuite d'eau urgente"
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none rounded-2xl transition-all font-medium text-slate-700"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Catégorie</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <select
                                        required
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none rounded-2xl appearance-none font-medium text-slate-700"
                                        value={form.categoryId}
                                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                    >
                                        <option value="">Sélectionner...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Type de service</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none rounded-2xl appearance-none font-medium text-slate-700"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="DEPANNAGE">Dépannage</option>
                                    <option value="VENTE">Vente</option>
                                    <option value="LOCATION">Location</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Description détaillée</label>
                            <textarea
                                rows={5}
                                required
                                placeholder="Décrivez votre expertise, le matériel utilisé, vos horaires..."
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none rounded-2xl transition-all font-medium text-slate-700"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <MapPin className="text-indigo-600 w-6 h-6" />
                                <div>
                                    <p className="font-bold text-slate-900">Ma position actuelle</p>
                                    <p className="text-sm text-slate-500">Cotonou, Bénin (Detecté automatiquement)</p>
                                </div>
                            </div>
                            <button type="button" className="text-indigo-600 font-bold hover:underline">Modifier</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white rounded-2xl py-6 font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <Plus className="w-6 h-6" />
                                    Publier mon service
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
