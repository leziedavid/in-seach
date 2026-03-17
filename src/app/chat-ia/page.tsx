'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMe, verifyChatCode, createChatConversation, uploadChatFiles, getUserConversations, markChatAsRead } from '@/api/api';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotification } from '@/components/toast/NotificationProvider';
import { io, Socket } from 'socket.io-client';
import { getUserId, getToken } from '@/lib/auth';

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
    const [showSidebar, setShowSidebar] = useState(true);
    const [bookingCode, setBookingCode] = useState('');
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMe();
        fetchConversations();
        const s = setupSocket();
        return () => {
            s.disconnect();
        };
    }, []);

    const setupSocket = () => {
        const userId = getUserId();
        const token = getToken();
        const s = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'}/chat`, {
            query: { userId, token },
        });

        s.on('new_message', (msg: Message) => {
            setMessages((prev) => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            fetchConversations(); // Refresh list to update last message and unread count
        });

        s.on('user_typing', (data: { userId: string, isTyping: boolean, conversationId: string }) => {
            if (data.userId !== userId && data.conversationId === selectedConversation?.id) {
                setIsTyping(data.isTyping);
            }
        });

        s.on('messages_read', (data: { conversationId: string }) => {
            if (data.conversationId === selectedConversation?.id) {
                setMessages(prev => prev.map(m => m.senderId !== userId ? { ...m, status: 'READ' } : m));
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
        const res = await getMe();
        if (res.statusCode === 200) setMe(res.data);
    };

    const fetchConversations = async () => {
        const res = await getUserConversations();
        if (res.statusCode === 200) setConversations(res.data || []);
    };

    // Handle pending negotiation from ProductDetailModal
    useEffect(() => {
        if (!me || conversations.length === 0) return;

        const pending = sessionStorage.getItem("pending_negotiation");
        if (pending) {
            try {
                const { conversationId, message } = JSON.parse(pending);
                const conv = conversations.find(c => c.id === conversationId);

                if (conv) {
                    setSelectedConversation(conv);
                    setInputValue(message);
                    // If focusing input is needed, we could do that here
                }
                sessionStorage.removeItem("pending_negotiation");
            } catch (e) {
                console.error("Error parsing pending negotiation", e);
            }
        }
    }, [me, conversations, setSelectedConversation]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            markAsRead(selectedConversation.id);
            socket?.emit('join_conversation', { conversationId: selectedConversation.id });
            setStep('HUMAN_CHAT');
            if (window.innerWidth < 768) setShowSidebar(false);
        }
    }, [selectedConversation]);

    const loadMessages = async (id: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/chat/messages/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.statusCode === 200) setMessages(data.data);
    };

    const markAsRead = async (id: string) => {
        await markChatAsRead(id);
        socket?.emit('mark_as_read', { conversationId: id, userId: me?.id });
    };

    const handleSendMessage = async () => {
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
    };

    const handleVerifyCode = async (code: string) => {
        setIsVerifyingCode(true);
        try {
            const data = await verifyChatCode(code);
            if (data.statusCode === 201 || data.statusCode === 200 && data.data) {
                addNotification("Code validé !", "success");
                const convData = await createChatConversation({ participant2Id: data.data.providerId, bookingId: data.data.id });
                if (convData.statusCode === 201 || convData.statusCode === 200 && convData.data) {
                    fetchConversations();
                    setSelectedConversation(convData.data);
                }
            } else {
                addNotification("Code invalide", "error");
            }
        } catch (error) {
            addNotification("Erreur de vérification", "error");
        } finally {
            setIsVerifyingCode(false);
            setBookingCode('');
        }
    };

    const formatMessageTime = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'Hier';
        return format(date, 'dd/MM/yy');
    };

    // 🔹 File Upload & Audio Recording (kept from previous version)
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
        } catch (error) { addNotification("Erreur envoi fichier", "error"); }
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
                } catch (error) { addNotification("Erreur envoi vocal", "error"); }
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) { addNotification("Micro refusé", "warning"); }
    };

    const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

    return (
        <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-6xl mx-auto bg-background/60 backdrop-blur-2xl  overflow-hidden mt-4  transition-all duration-300">

            {/* Sidebar: Conversation List border border-border rounded-3xl */}
            <aside className={`${showSidebar ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-80 border border-border bg-card/30 transition-all duration-300`}>
                <div className="p-4 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Messages</h2>
                        <button onClick={() => setStep('WAITING_CODE')} className="p-2 hover:bg-primary/20 rounded-full transition text-primary">
                            <Icon icon="solar:chat-round-plus-bold-duotone" className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search / Booking Code Input */}
                    {step === 'WAITING_CODE' ? (
                        <div className="space-y-2 animate-in slide-in-from-top duration-300">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Code Booking (BK-XXXXXX)"
                                    value={bookingCode}
                                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                                    className="w-full bg-background/50 border border-primary/30 rounded-xl px-4 py-2 text-sm focus:ring-2 ring-primary/20 outline-none"
                                    inputMode={'text'}
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                                <button
                                    onClick={() => handleVerifyCode(bookingCode)}
                                    disabled={!bookingCode || isVerifyingCode}
                                    className="absolute right-1 top-1 bg-primary text-white p-1.5 rounded-lg disabled:opacity-50"
                                >
                                    <Icon icon={isVerifyingCode ? "solar:spinner-bold" : "solar:check-read-bold"} className={isVerifyingCode ? "animate-spin" : ""} />
                                </button>
                            </div>
                            <button onClick={() => setStep('HUMAN_CHAT')} className="text-[10px] text-muted-foreground hover:underline ml-1">Annuler</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full bg-background/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition"
                                inputMode={'text'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide py-2 flex flex-col">
                    {conversations.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 md:hidden">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
                                    <Icon icon="solar:chat-round-dots-bold-duotone" className="text-primary w-12 h-12" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center shadow-lg">
                                    <Icon icon="solar:lock-password-bold-duotone" className="text-muted-foreground w-4 h-4" />
                                </div>
                            </div>
                            <div className="max-w-sm space-y-2">
                                <h2 className="text-xl font-bold">Vos conversations</h2>
                                <p className="text-xs text-muted-foreground px-4">Utilisez votre code booking pour commencer à échanger avec votre prestataire.</p>
                            </div>
                            <button onClick={() => setStep('WAITING_CODE')} className="bg-primary text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition text-[10px] w-auto inline-flex items-center" >
                                Nouveau message
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-primary/5 relative group ${selectedConversation?.id === conv.id ? 'bg-primary/10' : ''}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                            <span className="text-primary font-bold text-lg">{conv.otherParticipant.fullName.charAt(0)}</span>
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-semibold text-sm truncate pr-2">{conv.otherParticipant.fullName}</h3>
                                            <span className="text-[10px] text-muted-foreground">{conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : ''}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            {conv.lastMessage?.senderId === me?.id && <Icon icon="solar:check-read-bold" className="w-3 h-3 shrink-0" />}
                                            {conv.lastMessage?.content || (conv.lastMessage?.fileUrl ? 'Fichier envoyé' : 'Aucun message')}
                                        </p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-primary text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full font-bold shadow-lg shadow-primary/20">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {conversations.length > 0 && (
                        <div className="p-2 mt-auto md:hidden flex justify-center">
                            <button onClick={() => setStep('WAITING_CODE')} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-primary/20 transition active:scale-95 border border-primary/20 text-[10px] w-auto"  >
                                <Icon icon="solar:chat-round-plus-bold-duotone" className="w-3.5 h-3.5" />
                                Nouveau message
                            </button>
                        </div>
                    )}

                    {conversations.length === 0 && (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:chat-round-dots-bold-duotone" className="text-primary w-8 h-8" />
                            </div>
                            <p className="text-sm text-muted-foreground">Aucune conversation. Entrez un code booking pour commencer.</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className={`${!showSidebar ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[url('https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-dark-mode.jpg')] bg-repeat relative`}>
                <div className="absolute inset-0 bg-background/95 dark:bg-black/80 -z-10" />

                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="p-4 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setShowSidebar(true); setSelectedConversation(null); }} className="md:hidden p-2 hover:bg-muted rounded-lg -ml-2" >
                                    <Icon icon="solar:alt-arrow-left-bold" className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
                                    <span className="text-primary font-bold">{selectedConversation.otherParticipant.fullName.charAt(0)}</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm tracking-tight">{selectedConversation.otherParticipant.fullName}</h2>
                                    <div className="flex items-center gap-1.5 leading-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">En ligne</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-2.5 hover:bg-muted rounded-full transition text-muted-foreground"><Icon icon="solar:phone-bold-duotone" className="w-5 h-5" /></button>
                                <button className="p-2.5 hover:bg-muted rounded-full transition text-muted-foreground"><Icon icon="solar:videocamera-record-bold-duotone" className="w-5 h-5" /></button>
                                <button className="p-2.5 hover:bg-muted rounded-full transition text-muted-foreground"><Icon icon="solar:menu-dots-bold" className="w-5 h-5" /></button>
                            </div>
                        </header>

                        {/* Messages Container */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hide">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === me?.id;
                                    const showTimeSeparator = index === 0 || format(new Date(messages[index - 1].createdAt), 'ddMM') !== format(new Date(msg.createdAt), 'ddMM');

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showTimeSeparator && (
                                                <div className="flex justify-center my-6">
                                                    <span className="bg-background/50 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                                                        {isToday(new Date(msg.createdAt)) ? "Aujourd'hui" : isYesterday(new Date(msg.createdAt)) ? "Hier" : format(new Date(msg.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative group transition-all duration-300 ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-card/90 backdrop-blur-sm text-foreground rounded-tl-none border border-border'}`}>
                                                    {msg.fileUrl && msg.fileType === 'image' && (
                                                        <img src={msg.fileUrl} alt="Attachment" className="rounded-xl mb-2 max-w-full h-auto cursor-pointer border border-white/10" />
                                                    )}
                                                    {msg.fileUrl && msg.fileType === 'audio' && (
                                                        <audio src={msg.fileUrl} controls className="h-9 mb-1 filter invert dark:invert-0" />
                                                    )}
                                                    {msg.fileUrl && msg.fileType === 'file' && (
                                                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl mb-2">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                                                <Icon icon="solar:document-bold-duotone" className="w-6 h-6 text-primary" />
                                                            </div>
                                                            <span className="text-xs font-semibold truncate flex-1">{msg.fileName}</span>
                                                            <a href={msg.fileUrl} download className="p-2 hover:bg-black/10 rounded-lg text-primary transition"><Icon icon="solar:download-minimalistic-bold" /></a>
                                                        </div>
                                                    )}
                                                    {msg.content && <p className="text-sm leading-relaxed mb-1">{msg.content}</p>}

                                                    <div className="flex items-center gap-1.5 justify-end mt-1.5 opacity-60">
                                                        <span className="text-[9px] font-bold tracking-tighter">
                                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                                        </span>
                                                        {isMe && (
                                                            <Icon icon={msg.status === 'READ' ? 'solar:double-check-linear' : 'solar:check-read-linear'} className={`w-3.5 h-3.5 transition-colors ${msg.status === 'READ' ? 'text-blue-300' : ''}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </React.Fragment>
                                    );
                                })}
                            </AnimatePresence>
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-card/90 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-none border border-border">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-duration:1s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:1s]" />
                                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:1s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <footer className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border z-10">
                            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-2 px-3 shadow-xl focus-within:border-primary transition duration-300">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition">
                                    <Icon icon="solar:paperclip-bold-duotone" className="w-6 h-6" />
                                </button>

                                <textarea className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32 scrollbar-hide scroll-smooth outline-none" placeholder="Écrivez un message..."
                                    rows={1}
                                    value={inputValue}
                                    onChange={(e) => { setInputValue(e.target.value); socket?.emit('typing', { conversationId: selectedConversation.id, userId: me?.id, isTyping: e.target.value.length > 0 }); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    inputMode={'text'}
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />

                                <div className="flex items-center gap-1.5 pr-1">
                                    {isRecording ? (
                                        <button onClick={stopRecording} className="p-2.5 bg-red-500 text-white rounded-xl animate-pulse shadow-lg shadow-red-500/20">
                                            <Icon icon="solar:stop-circle-bold" className="w-6 h-6" />
                                        </button>
                                    ) : (
                                        <button onClick={startRecording} className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground transition">
                                            <Icon icon="solar:microphone-bold-duotone" className="w-6 h-6" />
                                        </button>
                                    )}
                                    <button onClick={handleSendMessage} disabled={!inputValue.trim()}
                                        className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100" >
                                        <Icon icon="solar:plain-bold-duotone" className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
                                <Icon icon="solar:chat-round-dots-bold-duotone" className="text-primary w-16 h-16" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-lg">
                                <Icon icon="solar:lock-password-bold-duotone" className="text-muted-foreground w-6 h-6" />
                            </div>
                        </div>
                        <div className="max-w-sm space-y-2">
                            <h2 className="text-2xl font-bold">Vos conversations</h2>
                            <p className="text-sm text-muted-foreground">Sélectionnez une discussion à gauche pour commencer à échanger ou utilisez votre code booking.</p>
                        </div>
                        <button
                            onClick={() => { setStep('WAITING_CODE'); setShowSidebar(true); }}
                            className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition"
                        >
                            Démarrer une conversation
                        </button>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-50"><Icon icon="solar:shield-check-bold" /> Chiffrement de bout en bout</p>
                    </div>
                )}
            </main>

        </div>
    );
}
