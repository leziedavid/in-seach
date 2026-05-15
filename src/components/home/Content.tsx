"use client";

import AfricaGlobeWithLocation from "../common/AfricaGlobeWithLocation";
import AppTabs from "./AppTabs";
import HomeSlider from "./HomeSlider";

export default function Content() {
    return (
        <div className="flex flex-col items-center w-full relative">
            {/* Mobile Native App Header Background - Solid Secondary Color */}
            {/* <div className="md:hidden absolute top-0 left-0 w-full h-[233px] bg-primary/50 rounded-b-[20px] -z-10" /> */}

            {/* Simulated Status Bar Space & Logo Area */}
            <div className="flex w-full justify-center pt-5 md:pt-5 px-4 z-10">
                <div className="w-full max-w-xl">
                    <HomeSlider />
                </div>
            </div>
            {/* <AfricaGlobeWithLocation /> */}

            <div className="md:px-10 w-full mb-10 md:mb-0 z-10 mt-4 md:mt-4">
                <AppTabs />
            </div>
        </div>
    );
}