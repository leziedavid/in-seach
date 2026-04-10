"use client";

import React from "react";
import Header from "@/components/home/layout/Header";
import Footer from "@/components/home/layout/Footer";
import BackgroundDecoration from "@/components/layout/BackgroundDecoration";

export default function ComingSoon({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col justify-between bg-background relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none z-0">
                <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(120,120,120,0.05)_0,transparent_40%),radial-gradient(circle_at_80%_60%,rgba(120,120,120,0.05)_0,transparent_40%)]" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <Header />
                <main className="w-full flex-1 flex flex-col md:pt-20 pb-20 md:pb-0">
                    {children}
                </main>
                <Footer />
            </div>

        </div>
    );
}