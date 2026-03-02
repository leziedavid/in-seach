"use client"

import React, { useEffect, useState } from "react"

export interface TitlePageProps {
    part1: string
    highlight: string
    part2: string
    isSearching?: boolean
}

export default function TitlePage({ part1, highlight, part2, isSearching = false, }: TitlePageProps) {
    // State pour déclencher l'animation du highlight
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        // On déclenche l'animation après le montage
        const timer = setTimeout(() => setAnimate(true), 100)
        return () => clearTimeout(timer)
    }, [])

    return (
        <h2 className={` text-4xl md:text-6xl font-light  max-w-4xl max-auto  leading-[1.1] text-slate-900 mb-8 transition-all duration-500  px-2  ${isSearching ? "text-3xl md:text-4xl mb-6" : ""} `}  >
            {part1}{" "}
            <span className={` font-bold text-secondary italic inline-block transition-all duration-500 ease-out ${animate ? "opacity-100 scale-100" : "opacity-0 scale-90"} `} >
                {highlight}
            </span>{" "}
            {part2}
        </h2>
    )
}
