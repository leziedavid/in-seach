'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getServiceById, createBooking } from '@/api/api';
import { MapPin, Star, User, Shield, CheckCircle2, Clock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [bookingLoading, setBookingLoading] = useState(false);

    const { data: serviceRes, isLoading } = useQuery({
        queryKey: ['service', id],
        queryFn: () => getServiceById(id as string)
    });

    const service = serviceRes?.data;

    const handleBook = async () => {
        setBookingLoading(true);
        try {
            const res = await createBooking(id as string);
            if (res.statusCode === 200 || res.statusCode === 201) {
                router.push('/dashboard?booked=true');
            } else {
                alert(res.message || 'Erreur lors de la réservation.');
            }
        } catch (err) {
            alert('Erreur lors de la réservation. Vérifiez votre connexion.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-6xl mx-auto px-8 py-8">
                <Link href="/services" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Retour aux services
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
                            <div className="h-96 relative">
                                <Image
                                    src={(service.imageUrls?.[0] && service.imageUrls?.[0] !== "") ? service.imageUrls[0] : 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop'}
                                    alt={service.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                                <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl text-xs font-black text-indigo-600 shadow-sm uppercase tracking-widest">
                                    {service.status}
                                </div>
                            </div>
                            <div className="p-10">
                                <div className="flex items-center gap-2 text-orange-400 mb-4">
                                    <Star className="w-5 h-5 fill-orange-400" />
                                    <span className="text-lg font-black text-slate-900">4.9</span>
                                    <span className="text-slate-400 font-medium">(24 avis vérifiés)</span>
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 mb-6">{service.title}</h1>
                                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                            <User className="text-slate-500 w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Prestataire</p>
                                            <p className="font-bold text-slate-800">{service.user?.email.split('@')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                            <MapPin className="text-slate-500 w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Localisation</p>
                                            <p className="font-bold text-slate-800">Cotonou, Bénin</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Description du service</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        {service.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-8">
                            <div className="p-4 bg-white/10 rounded-3xl border border-white/20">
                                <Shield className="w-10 h-10 text-indigo-200" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-2">Paiement 100% Sécurisé</h4>
                                <p className="text-indigo-100 opacity-90">Les fonds sont bloqués en séquestre jusqu'à la validation de la fin de l'intervention par vos soins.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Booking Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                            <div className="mb-8">
                                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest block mb-1">À partir de</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">45€</span>
                                    <span className="text-slate-400 font-medium">/intervention</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {[
                                    { icon: CheckCircle2, text: 'Garantie intervention' },
                                    { icon: Clock, text: 'Réponse sous 30 min' },
                                    { icon: Shield, text: 'Expert vérifié' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                        <item.icon className="w-5 h-5 text-green-500" />
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={bookingLoading}
                                className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {bookingLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Réserver maintenant'}
                            </button>

                            <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                                Aucun débit immédiat. Le prestataire doit accepter votre demande.
                            </p>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 text-center">
                            <p className="text-slate-500 font-bold text-sm mb-4">Besoin d'aide ?</p>
                            <button className="text-indigo-600 font-black hover:underline">Contacter le support</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
