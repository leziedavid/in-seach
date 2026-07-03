'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMe, verifyChatCode, createChatConversation, uploadChatFiles, getUserConversations, markChatAsRead } from '@/api/api';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { io, Socket } from 'socket.io-client';
import { getUserId, getToken } from '@/lib/auth';
import AudioMessage from '@/components/ui/AudioMessage';

interface Conversation {
    id: string;
    bookingId?: string;
    otherParticipant: {
        id: string;
        fullName: string;
        role: string;
        avatar?: string;
    };
    lastMessage: Message | null;
    unreadCount: number;
    updatedAt: string;
}

interface Message {
    id: string;
    senderId: string;
    content: string;
    fileUrl?: string;
    fileType?: 'image' | 'audio' | 'file';
    fileName?: string;
    createdAt: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
}

export default function ChatIAPage() {
    const { addNotification } = useNotification();
    const [me, setMe] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [step, setStep] = useState<'BOT_GREETING' | 'WAITING_CODE' | 'HUMAN_CHAT'>('BOT_GREETING');
    const [isRecording, setIsRecording] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [bookingCode, setBookingCode] = useState('');
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    // Refs to avoid stale closures in socket handlers
    const selectedConvRef = useRef<Conversation | null>(null);
    const meRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keep refs in sync
    useEffect(() => { selectedConvRef.current = selectedConversation; }, [selectedConversation]);
    useEffect(() => { meRef.current = me; }, [me]);

    useEffect(() => {
        fetchMe();
        fetchConversations();
        const s = setupSocket();
        return () => { s.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setupSocket = () => {
        const userId = getUserId();
        const token = getToken();
        const s = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.djamko.com'}/chat`, {
            query: { userId, token },
        });

        s.on('new_message', (msg: Message) => {
            setMessages((prev) => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            fetchConversations();
        });

        s.on('user_typing', (data: { userId: string; isTyping: boolean; conversationId: string }) => {
            if (data.userId !== userId && data.conversationId === selectedConvRef.current?.id) {
                setIsTyping(data.isTyping);
            }
        });

        s.on('messages_read', (data: { conversationId: string }) => {
            if (data.conversationId === selectedConvRef.current?.id) {
                setMessages(prev => prev.map(m => m.senderId !== userId ? { ...m, status: 'READ' as const } : m));
            }
            fetchConversations();
        });

        s.on('message_edited', (msg: Message) => {
            setMessages((prev) => prev.map(m => m.id === msg.id ? msg : m));
        });

        s.on('message_deleted', (data: { messageId: string }) => {
            setMessages((prev) => prev.filter(m => m.id !== data.messageId));
        });

        setSocket(s);
        return s;
    };

    const fetchMe = async () => {
        try {
            const res = await getMe();
            if (res.statusCode === 200) setMe(res.data);
        } catch (e) { console.error("fetchMe failed:", e); }
    };

    const fetchConversations = async () => {
        try {
            const res = await getUserConversations();
            if (res.statusCode === 200) setConversations(res.data || []);
        } catch (e) { console.error("fetchConversations failed:", e); }
    };

    // Handle pending negotiation from ProductDetailModal
    useEffect(() => {
        if (!me || conversations.length === 0) return;
        const pending = sessionStorage.getItem("pending_negotiation");
        if (pending) {
            try {
                const { conversationId, message } = JSON.parse(pending);
                const conv = conversations.find(c => c.id === conversationId);
                if (conv) { setSelectedConversation(conv); setInputValue(message); }
                sessionStorage.removeItem("pending_negotiation");
            } catch (e) { console.error("Error parsing pending negotiation", e); }
        }
    }, [me, conversations]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [inputValue]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            markAsRead(selectedConversation.id);
            socket?.emit('join_conversation', { conversationId: selectedConversation.id });
            setStep('HUMAN_CHAT');
            if (window.innerWidth < 768) setShowSidebar(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation?.id]);

    const loadMessages = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.djamko.com/api/v1'}/chat/messages/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.statusCode === 200) setMessages(data.data);
        } catch (e) { console.error("loadMessages failed:", e); }
    };

    const markAsRead = async (id: string) => {
        await markChatAsRead(id);
        socket?.emit('mark_as_read', { conversationId: id, userId: me?.id });
    };

    const handleSendMessage = useCallback(async () => {
        const content = inputValue.trim();
        if (!content) return;

        if (step === 'WAITING_CODE') {
            handleVerifyCode(content);
        } else {
            if (!selectedConversation) return;
            if (editingMessage) {
                socket?.emit('edit_message', {
                    conversationId: selectedConversation.id,
                    messageId: editingMessage.id,
                    content,
                    userId: me?.id
                });
                setEditingMessage(null);
            } else {
                socket?.emit('send_message', {
                    conversationId: selectedConversation.id,
                    senderId: me?.id,
                    content,
                    createdAt: new Date().toISOString()
                });
            }
            setInputValue('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue, step, selectedConversation, editingMessage, socket, me]);

    const handleVerifyCode = async (code: string) => {
        setIsVerifyingCode(true);
        try {
            const data = await verifyChatCode(code);
            if (data.statusCode === 201 || (data.statusCode === 200 && data.data)) {
                addNotification("Code validé !", "success");
                const convData = await createChatConversation({ participant2Id: data.data.providerId, bookingId: data.data.id });
                if (convData.statusCode === 201 || (convData.statusCode === 200 && convData.data)) {
                    fetchConversations();
                    setSelectedConversation(convData.data);
                }
            } else {
                addNotification("Code invalide", "error");
            }
        } catch {
            addNotification("Erreur de vérification", "error");
        } finally {
            setIsVerifyingCode(false);
            setBookingCode('');
        }
    };

    const formatMessageTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            if (isToday(date)) return format(date, 'HH:mm');
            if (isYesterday(date)) return 'Hier';
            return format(date, 'dd/MM/yy');
        } catch { return ''; }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !selectedConversation) return;
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        try {
            const data = await uploadChatFiles(formData);
            if (data.statusCode === 200 && data.data) {
                data.data.forEach((file: any) => {
                    socket?.emit('send_message', {
                        conversationId: selectedConversation.id,
                        senderId: me?.id,
                        fileUrl: file.url,
                        fileName: file.name,
                        fileType: file.type.includes('image') ? 'image' : 'file',
                        createdAt: new Date().toISOString()
                    });
                });
            }
        } catch { addNotification("Erreur envoi fichier", "error"); }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('files', audioBlob, 'voice-message.wav');
                try {
                    const data = await uploadChatFiles(formData);
                    if (data.statusCode === 200 && data.data?.[0] && selectedConversation) {
                        socket?.emit('send_message', {
                            conversationId: selectedConversation.id,
                            senderId: me?.id,
                            fileUrl: data.data[0].url,
                            fileType: 'audio',
                            createdAt: new Date().toISOString()
                        });
                    }
                } catch { addNotification("Erreur envoi vocal", "error"); }
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch { addNotification("Micro refusé", "warning"); }
    };

    const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

    // ── Context menu handlers (WhatsApp style) ───────────────────────
    const openContextMenu = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setContextMenu({ msg, x: clientX, y: clientY });
    };

    const handleLongPressStart = (msg: Message) => (e: React.TouchEvent) => {
        longPressRef.current = setTimeout(() => {
            const touch = e.touches[0];
            setContextMenu({ msg, x: touch.clientX, y: touch.clientY });
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressRef.current) clearTimeout(longPressRef.current);
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        addNotification("Message copié", "success");
        closeContextMenu();
    };

    const handleEditMessage = (msg: Message) => {
        setEditingMessage(msg);
        setInputValue(msg.content);
        textareaRef.current?.focus();
        closeContextMenu();
    };

    const handleDeleteMessage = (msg: Message) => {
        if (!selectedConversation) return;
        socket?.emit('delete_message', {
            conversationId: selectedConversation.id,
            messageId: msg.id,
            userId: me?.id,
        });
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        closeContextMenu();
    };

    const goBackToList = () => {
        setShowSidebar(true);
        setSelectedConversation(null);
        setMessages([]);
    };

    return (
        // dvh = dynamic viewport height — s'adapte à la barre d'adresse mobile
        <div className="flex overflow-hidden bg-background" style={{ height: 'calc(100dvh - 64px)' }} onClick={closeContextMenu}>
            <div className="flex w-full max-w-6xl mx-auto h-full overflow-hidden md:mt-4 md:mb-4 md:rounded-3xl md:border md:border-border md:shadow-2xl bg-background">

                {/* ── SIDEBAR ── */}
                <aside className={`
                    ${showSidebar ? 'flex' : 'hidden md:flex'}
                    flex-col w-full md:w-80 shrink-0
                    bg-card border-r border-border
                    transition-all duration-300
                `}>
                    {/* Header sidebar */}
                    <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Messages
                            </h2>
                            <button
                                onClick={() => setStep('WAITING_CODE')}
                                className="p-2 hover:bg-primary/10 rounded-full transition text-primary"
                            >
                                <Icon icon="solar:chat-round-plus-bold-duotone" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Code booking ou recherche */}
                        {step === 'WAITING_CODE' ? (
                            <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Code Booking (BK-XXXXXX)"
                                        value={bookingCode}
                                        onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                                        className="w-full bg-muted border border-primary/30 rounded-xl px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none"
                                        style={{ fontSize: '16px' }}
                                        suppressHydrationWarning
                                    />
                                    <button
                                        onClick={() => handleVerifyCode(bookingCode)}
                                        disabled={!bookingCode || isVerifyingCode}
                                        className="absolute right-1 top-1 bg-primary text-white p-1.5 rounded-lg disabled:opacity-50 transition"
                                    >
                                        <Icon
                                            icon={isVerifyingCode ? "solar:spinner-bold" : "solar:check-read-bold"}
                                            className={`w-4 h-4 ${isVerifyingCode ? 'animate-spin' : ''}`}
                                        />
                                    </button>
                                </div>
                                <button onClick={() => setStep('HUMAN_CHAT')} className="text-[10px] text-muted-foreground hover:underline ml-1">
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition"
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                            </div>
                        )}
                    </div>

                    {/* Liste conversations */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                                    <Icon icon="solar:chat-round-dots-bold-duotone" className="text-primary w-8 h-8" />
                                </div>
                                <p className="text-sm text-muted-foreground">Aucune conversation. Entrez un code booking pour commencer.</p>
                                <button
                                    onClick={() => setStep('WAITING_CODE')}
                                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 active:scale-95 transition"
                                >
                                    Nouveau message
                                </button>
                            </div>
                        ) : (
                            <>
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-all hover:bg-primary/5 relative ${
                                            selectedConversation?.id === conv.id ? 'bg-primary/10' : ''
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                                                <span className="text-primary font-black text-base">
                                                    {conv.otherParticipant.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                                        </div>

                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-sm truncate pr-2 text-foreground">
                                                    {conv.otherParticipant.fullName}
                                                </h3>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                {conv.lastMessage?.senderId === me?.id && (
                                                    <Icon icon="solar:check-read-bold" className="w-3 h-3 shrink-0 text-primary" />
                                                )}
                                                <span className={conv.unreadCount > 0 ? 'font-bold text-foreground' : ''}>
                                                    {conv.lastMessage?.content || (conv.lastMessage?.fileUrl ? '📎 Fichier' : 'Aucun message')}
                                                </span>
                                            </p>
                                        </div>

                                        {conv.unreadCount > 0 && (
                                            <span className="bg-primary text-white text-[10px] h-5 min-w-5 px-1 flex items-center justify-center rounded-full font-black shadow-lg shadow-primary/20 shrink-0">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}

                                {/* Bouton nouveau message en bas */}
                                <div className="p-3 border-t border-border">
                                    <button
                                        onClick={() => setStep('WAITING_CODE')}
                                        className="w-full bg-primary/10 text-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition active:scale-95 border border-primary/20 text-xs"
                                    >
                                        <Icon icon="solar:chat-round-plus-bold-duotone" className="w-4 h-4" />
                                        Nouveau message
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* ── ZONE DE CHAT ── */}
                <main className={`
                    ${!showSidebar ? 'flex' : 'hidden md:flex'}
                    flex-col flex-1 min-w-0 relative overflow-hidden
                `}>
                    {/* Fond style WhatsApp */}
                    <div className="absolute inset-0 bg-[url('https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-dark-mode.jpg')] bg-repeat opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />
                    <div className="absolute inset-0 bg-background/98 dark:bg-background/95 pointer-events-none" />

                    {selectedConversation ? (
                        <div className="flex flex-col h-full relative z-10">
                            {/* ── Header chat ── */}
                            <header className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border shrink-0 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={goBackToList}
                                        className="md:hidden p-2 -ml-2 hover:bg-muted rounded-xl transition"
                                    >
                                        <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shrink-0">
                                        <span className="text-primary font-black text-sm">
                                            {selectedConversation.otherParticipant.fullName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="font-black text-sm leading-tight text-foreground">
                                            {selectedConversation.otherParticipant.fullName}
                                        </h2>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-muted-foreground font-bold">En ligne</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    <button className="p-2 hover:bg-muted rounded-xl transition text-muted-foreground">
                                        <Icon icon="solar:phone-bold-duotone" className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 hover:bg-muted rounded-xl transition text-muted-foreground">
                                        <Icon icon="solar:videocamera-record-bold-duotone" className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 hover:bg-muted rounded-xl transition text-muted-foreground">
                                        <Icon icon="solar:menu-dots-bold" className="w-5 h-5" />
                                    </button>
                                </div>
                            </header>

                            {/* ── Messages ── */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto px-3 py-4 md:px-6 space-y-1 scrollbar-hide"
                            >
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, index) => {
                                        const isMe = msg.senderId === me?.id;
                                        const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
                                        const prevDate = index > 0 && messages[index - 1].createdAt
                                            ? new Date(messages[index - 1].createdAt) : null;
                                        const showSep = index === 0 || (msgDate && prevDate &&
                                            !isNaN(msgDate.getTime()) && !isNaN(prevDate.getTime()) &&
                                            format(prevDate, 'ddMM') !== format(msgDate, 'ddMM'));

                                        // Group consecutive messages from same sender
                                        const nextMsg = messages[index + 1];
                                        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showSep && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="bg-muted/80 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50">
                                                            {msgDate && !isNaN(msgDate.getTime())
                                                                ? (isToday(msgDate) ? "Aujourd'hui" : isYesterday(msgDate) ? "Hier" : format(msgDate, 'dd MMMM yyyy', { locale: fr }))
                                                                : ''}
                                                        </span>
                                                    </div>
                                                )}

                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.15 }}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
                                                    onContextMenu={(e) => openContextMenu(e, msg)}
                                                    onTouchStart={handleLongPressStart(msg)}
                                                    onTouchEnd={handleLongPressEnd}
                                                    onTouchMove={handleLongPressEnd}
                                                >
                                                    {/* Avatar interlocuteur sur dernier msg du groupe */}
                                                    {!isMe && (
                                                        <div className={`w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mr-2 self-end ${isLastInGroup ? 'opacity-100' : 'opacity-0'}`}>
                                                            <span className="text-primary font-black text-[10px]">
                                                                {selectedConversation.otherParticipant.fullName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className={`
                                                        max-w-[78%] md:max-w-[60%] relative
                                                        ${isMe
                                                            ? 'bg-primary text-white'
                                                            : 'bg-card text-foreground border border-border/80'
                                                        }
                                                        px-3.5 py-2 shadow-sm
                                                        ${isMe
                                                            ? isLastInGroup ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'
                                                            : isLastInGroup ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'
                                                        }
                                                    `}>
                                                        {/* Image */}
                                                        {msg.fileUrl && msg.fileType === 'image' && (
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt="Attachment"
                                                                className="rounded-xl mb-2 max-w-full h-auto cursor-pointer"
                                                            />
                                                        )}

                                                        {/* Audio style WhatsApp */}
                                                        {msg.fileUrl && msg.fileType === 'audio' && (
                                                            <div className="mb-1">
                                                                <AudioMessage src={msg.fileUrl} isMe={isMe} />
                                                            </div>
                                                        )}

                                                        {/* Fichier */}
                                                        {msg.fileUrl && msg.fileType === 'file' && (
                                                            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl mb-2 ${isMe ? 'bg-white/10' : 'bg-muted'}`}>
                                                                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                                                    <Icon icon="solar:document-bold-duotone" className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <span className={`text-xs font-semibold truncate flex-1 ${isMe ? 'text-white/90' : 'text-foreground'}`}>
                                                                    {msg.fileName}
                                                                </span>
                                                                <a
                                                                    href={msg.fileUrl}
                                                                    download
                                                                    className={`p-1.5 rounded-lg transition ${isMe ? 'hover:bg-white/10 text-white' : 'hover:bg-muted-foreground/10 text-primary'}`}
                                                                >
                                                                    <Icon icon="solar:download-minimalistic-bold" className="w-4 h-4" />
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Texte */}
                                                        {msg.content && (
                                                            <p className={`text-sm leading-relaxed break-words ${isMe ? 'text-white' : 'text-foreground'}`}>
                                                                {msg.content}
                                                            </p>
                                                        )}

                                                        {/* Heure + statut */}
                                                        <div className={`flex items-center gap-1 justify-end mt-1 ${isMe ? 'opacity-75' : 'opacity-50'}`}>
                                                            <span className={`text-[10px] font-medium ${isMe ? 'text-white' : 'text-foreground'}`}>
                                                                {msgDate && !isNaN(msgDate.getTime()) ? format(msgDate, 'HH:mm') : ''}
                                                            </span>
                                                            {isMe && (
                                                                <Icon
                                                                    icon={msg.status === 'READ' ? 'solar:double-check-linear' : 'solar:check-read-linear'}
                                                                    className={`w-3.5 h-3.5 ${msg.status === 'READ' ? 'text-blue-200' : 'text-white/80'}`}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Indicateur de frappe */}
                                {isTyping && (
                                    <div className="flex justify-start items-end gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-black text-[10px]">
                                                {selectedConversation.otherParticipant.fullName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="bg-card border border-border/80 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-duration:1s]" />
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:1s]" />
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:1s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Zone d'édition ── */}
                            {editingMessage && (
                                <div className="px-4 py-2 bg-primary/5 border-t border-primary/20 flex items-center justify-between gap-3 shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Icon icon="solar:pen-bold-duotone" className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-xs text-muted-foreground truncate">
                                            Modifier : <span className="text-foreground font-medium">{editingMessage.content}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => setEditingMessage(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                                        <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* ── Input message ── */}
                            <footer className="px-3 py-3 md:px-4 md:py-4 bg-card/90 backdrop-blur-md border-t border-border shrink-0">
                                <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-3 py-2 shadow-lg focus-within:border-primary/50 transition duration-200">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition shrink-0 mb-0.5"
                                    >
                                        <Icon icon="solar:paperclip-bold-duotone" className="w-5 h-5" />
                                    </button>

                                    <textarea
                                        ref={textareaRef}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 resize-none scrollbar-hide outline-none text-foreground placeholder:text-muted-foreground leading-relaxed"
                                        placeholder="Message..."
                                        rows={1}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            socket?.emit('typing', {
                                                conversationId: selectedConversation.id,
                                                userId: me?.id,
                                                isTyping: e.target.value.length > 0
                                            });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        style={{ fontSize: '16px', maxHeight: '120px' }}
                                        suppressHydrationWarning
                                    />

                                    <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                                        {inputValue.trim() ? (
                                            <button
                                                onClick={handleSendMessage}
                                                className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition"
                                            >
                                                <Icon icon="solar:plain-bold-duotone" className="w-5 h-5" />
                                            </button>
                                        ) : isRecording ? (
                                            <button
                                                onClick={stopRecording}
                                                className="p-2 bg-red-500 text-white rounded-xl animate-pulse shadow-lg shadow-red-500/30"
                                            >
                                                <Icon icon="solar:stop-circle-bold" className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={startRecording}
                                                className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition"
                                            >
                                                <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </footer>
                        </div>
                    ) : (
                        /* ── Écran vide (aucune conv sélectionnée) ── */
                        (<div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Icon icon="solar:chat-round-dots-bold-duotone" className="text-primary w-14 h-14" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
                                    <Icon icon="solar:lock-password-bold-duotone" className="text-muted-foreground w-5 h-5" />
                                </div>
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h2 className="text-xl font-black text-foreground">Vos conversations</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Sélectionnez une discussion ou utilisez votre code booking pour commencer.
                                </p>
                            </div>
                            <button
                                onClick={() => { setStep('WAITING_CODE'); setShowSidebar(true); }}
                                className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition text-sm"
                            >
                                Démarrer une conversation
                            </button>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 opacity-60">
                                <Icon icon="solar:shield-check-bold-duotone" className="w-3.5 h-3.5" />
                                Chiffrement de bout en bout
                            </p>
                        </div>)
                    )}
                </main>
            </div>
            {/* ── Menu contextuel WhatsApp ── */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        {/* Overlay invisible pour fermer */}
                        <div className="fixed inset-0 z-[9998]" onClick={closeContextMenu} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-2xl shadow-2xl"
                            style={{
                                left: Math.min(contextMenu.x, window.innerWidth - 200),
                                top: Math.min(contextMenu.y, window.innerHeight - 220),
                                background: 'rgba(30,30,30,0.92)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '0.5px solid rgba(255,255,255,0.12)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Aperçu du message */}
                            {contextMenu.msg.content && (
                                <div className="px-4 py-3 border-b border-white/10">
                                    <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                                        {contextMenu.msg.content}
                                    </p>
                                </div>
                            )}

                            {/* Copier */}
                            {contextMenu.msg.content && (
                                <button
                                    onClick={() => handleCopyMessage(contextMenu.msg.content)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left"
                                >
                                    <Icon icon="solar:copy-bold-duotone" className="w-5 h-5 text-white/70" />
                                    <span className="text-[14px] text-white font-medium">Copier</span>
                                </button>
                            )}

                            {/* Modifier — uniquement mes messages texte */}
                            {contextMenu.msg.senderId === me?.id && contextMenu.msg.content && (
                                <button
                                    onClick={() => handleEditMessage(contextMenu.msg)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left"
                                >
                                    <Icon icon="solar:pen-bold-duotone" className="w-5 h-5 text-blue-400" />
                                    <span className="text-[14px] text-white font-medium">Modifier</span>
                                </button>
                            )}

                            <div className="h-px bg-white/10 mx-3" />

                            {/* Supprimer — uniquement mes messages */}
                            {contextMenu.msg.senderId === me?.id && (
                                <button
                                    onClick={() => handleDeleteMessage(contextMenu.msg)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition text-left"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-5 h-5 text-red-400" />
                                    <span className="text-[14px] text-red-400 font-medium">Supprimer</span>
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
