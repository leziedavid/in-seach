import React from "react";
import PortfolioNavbar from "@/components/portfolio/PortfolioNavbar";
import PortfolioHero from "@/components/portfolio/PortfolioHero";
import PortfolioExpertise from "@/components/portfolio/PortfolioExpertise";
import PortfolioExperience from "@/components/portfolio/PortfolioExperience";
import PortfolioProjects from "@/components/portfolio/PortfolioProjects";
import PortfolioContact from "@/components/portfolio/PortfolioContact";
import { Metadata } from "next";
import PortfolioSidebar from "@/components/portfolio/PortfolioSidebar";

export const metadata: Metadata = {
    title: "TRA BI LEZIE DAVID | Senior Full-Stack & Mobile Engineer",
    description: "Portfolio premium de TRA BI LEZIE DAVID, Ingénieur Full-Stack & Mobile Senior spécialisé en Next.js, NestJS, Flutter et architectures scalables.",
    keywords: ["Portfolio", "Full-Stack", "Mobile", "Next.js", "NestJS", "Abidjan", "Développeur Senior"],
};

export default function PortfolioPage() {
    return (
        <div className="portfolio-bg text-foreground selection:bg-primary selection:text-primary-foreground font-sans relative">
            <PortfolioNavbar />
            <PortfolioSidebar />
            <main className="relative">
                <PortfolioHero />
                <PortfolioExpertise />
                <PortfolioExperience />
                <PortfolioProjects />
                <PortfolioContact />
            </main>
        </div>
    );
}
