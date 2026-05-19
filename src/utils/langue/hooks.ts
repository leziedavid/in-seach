"use client";

import { useI18nInternal } from "./provider";

export const useI18n = () => {
    const { language, setLanguage, t } = useI18nInternal();
    return {
        language,
        setLanguage,
        t,
        isFr: language === "fr",
        isEn: language === "en",
    };
};

export const useTranslation = useI18n; // Alias as requested
