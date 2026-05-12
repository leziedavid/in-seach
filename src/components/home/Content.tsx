"use client";

import AppTabs from "./AppTabs";
import HomeSlider from "./HomeSlider";

export default function Content() {
    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex w-full justify-center mt-8 px-4">
                <HomeSlider />
            </div>

            <div className="md:px-20 w-full mb-20 md:mb-0">
                <AppTabs />
            </div>
        </div>
    );
}