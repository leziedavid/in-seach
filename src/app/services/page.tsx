'use client';

import React, { useState } from 'react';
import { Search, MapPin, Filter, Star, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/api/api';

export default function ServicesPage() {
    const [query, setQuery] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    const { data: servicesRes, isLoading } = useQuery({
        queryKey: ['services', query, lat, lng],
        queryFn: () => getServices({ search: query, page: 1, limit: 10 })
    });

    const services = servicesRes?.data?.data || [];

    const handleGeolocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            {/* Search Bar & Filters */}
            <div className="py-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full bg-white rounded-2xl flex items-center px-5 py-3 border border-slate-100 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
                        <Search className="text-slate-400 w-5 h-5 mr-3" />
                        <input type="text" placeholder="Rechercher un service (ex: plombier, électricien...)" className="bg-transparent outline-none w-full font-medium text-slate-700 text-sm md:text-base" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={handleGeolocation} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm ${lat ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}>
                            <MapPin className="w-5 h-5" />
                            <span className="text-sm">{lat ? 'Ma position activée' : 'Me géolocaliser'}</span>
                        </button>
                        <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-primary hover:border-primary transition-all shadow-sm">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900">
                        {isLoading ? 'Recherche en cours...' : `${services?.length || 0} experts disponibles`}
                    </h2>
                    {/* {!isLoading && isFallback && (
                         <div className="bg-primary/5 border border-primary/10 p-4 md:p-6 rounded-3xl flex items-start gap-4">
                             <div className="p-2 bg-white rounded-xl shadow-sm">
                                 <MapPin className="text-primary w-5 h-5" />
                             </div>
                             <div>
                                 <p className="text-slate-900 font-bold text-sm md:text-base">
                                     Aucun résultat à proximité immédiate.
                                 </p>
                                 <p className="text-slate-500 text-xs md:text-sm font-medium">
                                     Voici d'autres prestataires qui pourraient vous intéresser dans d'autres zones.
                                 </p>
                             </div>
                         </div>
                     )} */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                {/* List Body */}
                <div className="lg:col-span-8 overflow-y-auto pb-12">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" />
                            <p className="font-medium">Chargement des meilleurs profils...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                            {services?.map((service: any) => (
                                <div key={service.id} className="group bg-white rounded-3xl p-3 md:p-5 border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-2xl bg-slate-50">
                                        <Image src={(service.files?.[0]?.url && service.files?.[0]?.url !== "") ? service.files[0].url : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={service.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-black text-slate-900 shadow-sm uppercase tracking-tighter">
                                            {service.categoryLabel || 'Service'}
                                        </div>
                                    </div>

                                    <h3 className="text-[13px] md:text-base font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors px-2">
                                        {service.title}
                                    </h3>

                                    <div className="flex items-center gap-1 text-primary mb-3">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-[10px] md:text-xs font-bold">4.9</span>
                                    </div>

                                    <div className="w-full pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <div className="text-left">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">À partir de</p>
                                            <p className="text-secondary font-black text-sm md:text-lg -mt-1">
                                                {service.price} <span className="text-[8px] md:text-[10px] font-medium text-slate-400">CFA</span>
                                            </p>
                                        </div>
                                        <button className="bg-slate-900 text-white p-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-primary transition-all shadow-md">
                                            Réserver
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map Sidebar */}
                <div className="hidden lg:block lg:col-span-4 sticky top-0 h-fit">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/50">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <MapPin className="text-primary w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2 text-xl italic">Carte Interactive</h4>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            Visualisez les experts disponibles autour de vous en temps réel.
                        </p>
                        <div className="relative h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2048!3i1344!2m3!1e0!2sm!3i420120488!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1f2!6m8!1e1!6m1!1zU2hvdyBwaG90b3M!6m1!1zU2hvdyByZXZpZXdz')] bg-cover"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-3 h-3 bg-primary rounded-full animate-ping mb-2"></div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Localisation...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
