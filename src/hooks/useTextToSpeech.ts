import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechOptions {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onStart?: () => void;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    // Réf toujours à jour, pour que `speak`/`stop` gardent une identité stable (évite de
    // recréer inutilement les callbacks — et donc de re-render les composants qui les
    // utilisent en dépendance — à chaque rendu du composant appelant).
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!synthRef.current) return;
        const options = optionsRef.current;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'fr-FR';
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        utterance.onstart = () => {
            setIsSpeaking(true);
            if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (event: any) => {
            // Ignore errors caused by manual cancellation or interruptions
            if (event.error === 'interrupted' || event.error === 'canceled') {
                return;
            }
            console.error('SpeechSynthesisUtterance error', event);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isSupported: typeof window !== 'undefined' && !!window.speechSynthesis
    };
};
