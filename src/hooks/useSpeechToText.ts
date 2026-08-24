import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechToTextOptions {
    /** Appelé à chaque mise à jour du transcript ; `isFinal` indique un segment définitif. */
    onResult?: (transcript: string, isFinal: boolean) => void;
    onEnd?: () => void;
    onError?: (event: any) => void;
    lang?: string;
}

export const useSpeechToText = (options: UseSpeechToTextOptions = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    // Vrai dès que le moteur natif a démarré (onstart) jusqu'à onend/onerror — plus fiable que
    // `isListening` (state React, mis à jour de façon asynchrone) pour empêcher un double
    // `.start()` qui lève une InvalidStateError si un appel précédent est encore en cours.
    const isActiveRef = useRef(false);

    // Callbacks toujours à jour via ref, SANS jamais faire partie des dépendances de l'effet
    // ci-dessous : les passer directement en dépendance (comme avant) recréait le moteur de
    // reconnaissance à CHAQUE rendu du composant appelant (un objet `{ onResult, ... }` littéral
    // est une référence neuve à chaque render). Comme `interimResults` déclenche `onresult` en
    // continu pendant que l'utilisateur parle, chaque mot mettait à jour un state, ce qui
    // provoquait un nouveau rendu, qui recréait le moteur EN PLEIN MILIEU DE L'ÉCOUTE — c'était
    // la cause du bug "n'entend pas correctement".
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // s'arrête automatiquement quand l'utilisateur se tait
        recognition.interimResults = true; // retour en temps réel
        recognition.maxAlternatives = 1;
        recognition.lang = options.lang || 'fr-FR';

        recognition.onstart = () => {
            isActiveRef.current = true;
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
                if (event.results[i].isFinal) isFinal = true;
            }
            setTranscript(currentTranscript);
            optionsRef.current.onResult?.(currentTranscript, isFinal);
        };

        recognition.onerror = (event: any) => {
            isActiveRef.current = false;
            setError(event.error);
            setIsListening(false);
            optionsRef.current.onError?.(event);
        };

        recognition.onend = () => {
            isActiveRef.current = false;
            setIsListening(false);
            optionsRef.current.onEnd?.();
        };

        recognitionRef.current = recognition;

        return () => {
            // Détache les handlers puis coupe le moteur natif — évite qu'une instance abandonnée
            // continue d'écouter en arrière-plan ou déclenche des callbacks sur un composant démonté.
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try { recognition.abort(); } catch { /* déjà arrêté */ }
            recognitionRef.current = null;
        };
        // Ne recrée le moteur que si la langue change réellement — jamais à cause des callbacks.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.lang]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isActiveRef.current) return;
        setTranscript('');
        setError(null);
        try {
            recognitionRef.current.start();
        } catch (err: any) {
            // Peut arriver si un start() concurrent a déjà mis à jour l'état natif juste avant.
            if (err?.name !== 'InvalidStateError') {
                console.error('Speech Recognition Error:', err);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isActiveRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return {
        isListening,
        transcript,
        isSupported,
        error,
        startListening,
        stopListening,
    };
};
