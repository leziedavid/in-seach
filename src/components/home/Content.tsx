"use client";

import AppTabs from "./AppTabs";
import HomeSlider from "./HomeSlider";
import LiveEntryButton from "./LiveEntryButton";
import LiveFAB from "./LiveFAB";

export default function Content() {
    return (
        <div className="flex flex-col items-center w-full relative">

            {/* Slider */}
            <div className="flex w-full justify-center pt-5 md:pt-5 px-4 z-10">
                <div className="w-full max-w-xl">
                    <HomeSlider />
                </div>
            </div>

            {/* Live — section séparée, au-dessus de AppTabs, alignée à droite */}
            <div className="w-full flex justify-end px-2 sm:px-4 md:px-10 z-10 mt-3" style={{ animation: "live-fab-float 3s ease-in-out infinite" }}>
                {/* <LiveFAB inline /> */}
                <LiveEntryButton />
            </div>

            {/* Tabs */}
            <div className="md:px-10 w-full mb-10 md:mb-0 z-10 ">
                <AppTabs />
            </div>

        </div>
    );
}
