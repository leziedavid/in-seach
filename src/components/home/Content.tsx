"use client";

import AppTabs from "./AppTabs";
import ThemeImage from "@/components/ui/ThemeImage";

export default function Content() {
    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex w-full justify-center mt-10 md:mt-16 px-4">
                {/* <Image src="/logo.svg" alt="Djamko Watermark" width={100} height={100} className="object-contain w-[50vw] max-w-[750px] h-auto" /> */}

                <ThemeImage lightSrc="/logo.svg" darkSrc="/logo2.svg" alt="Recherche intelligente" width={80} height={10} className="w-full max-w-xl" priority />
            </div>

            <div className="md:px-20 w-full mb-20 md:mb-0">
                <AppTabs />
            </div>
        </div>
    );
}