import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechToTextOptions {
    onResult?: (transcript: string) => void;
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

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Auto-stop when user stops speaking
        recognition.interimResults = true; // Real-time feedback
        recognition.lang = options.lang || 'fr-FR';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
            if (options.onResult && event.results[0].isFinal) {
                options.onResult(currentTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            setError(event.error);
            setIsListening(false);
            if (options.onError) options.onError(event);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (options.onEnd) options.onEnd();
        };

        recognitionRef.current = recognition;
    }, [options]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error("Speech Recognition Error:", err);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        isSupported,
        error,
        startListening,
        stopListening
    };
};
