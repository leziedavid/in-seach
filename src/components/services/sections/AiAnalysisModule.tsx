'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { analyzeImage } from '@/api/api';

export default function AiAnalysisModule() {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState('');

    const handleAnalysis = async () => {
        if (!imageUrl) return;
        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('imageUrl', imageUrl);
            const res = await analyzeImage(formData);
            if (res.statusCode === 200 || res.statusCode === 201) {
                setResult(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Icon icon="solar:stars-bold-duotone" className="w-6 h-6 text-indigo-200" />
                        </div>
                        <span className="font-black tracking-widest uppercase text-indigo-100 text-sm">Assistant IA Intelligent</span>
                    </div>

                    <h2 className="text-4xl font-extrabold mb-6">
                        Laissez l'IA <span className="text-indigo-200">estimer</span> votre intervention.
                    </h2>
                    <p className="text-indigo-100 mb-8 text-lg font-medium opacity-90">
                        Téléchargez une photo du problème (fuite, serrure cassée...) et notre IA vous suggèrera la meilleure catégorie et un prix juste.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Collez l'URL d'une image..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 outline-none focus:border-white transition-all placeholder:text-indigo-300 font-medium"
                        />
                        <button
                            onClick={handleAnalysis}
                            disabled={analyzing || !imageUrl}
                            className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20 disabled:opacity-50"
                        >
                            {analyzing ? <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" /> : 'Analyser maintenant'}
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-80 h-96 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col">
                    {result ? (
                        <div className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white/20 p-4 rounded-2xl border border-white/20">
                                <div className="flex items-center gap-2 text-indigo-100 text-xs font-black uppercase mb-2">
                                    <Icon icon="solar:tag-bold-duotone" className="w-3.5 h-3.5" /> Catégorie suggérée
                                </div>
                                <div className="text-2xl font-black">{result.suggestedCategory}</div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-2xl border border-white/20">
                                <div className="flex items-center gap-2 text-indigo-100 text-xs font-black uppercase mb-2">
                                    <Icon icon="solar:dollar-bold-duotone" className="w-3.5 h-3.5" /> Estimation prix
                                </div>
                                <div className="text-2xl font-black">{result.estimatedPriceRange}</div>
                            </div>
                            <div className="flex items-center gap-2 text-green-300 font-bold text-sm">
                                <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5" /> Analyse terminée avec succès
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                            <Icon icon="solar:camera-bold-duotone" className="w-16 h-16 mb-4 stroke-1" />
                            <p className="font-bold">Aucune image analysée</p>
                            <p className="text-xs text-indigo-200 mt-2 px-6">Les résultats s'afficheront ici après l'analyse.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
