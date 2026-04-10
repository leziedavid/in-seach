"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import { DateRange } from "react-day-picker";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingsCalendar, BookingStatus } from "@/types/interface";
import { getBookingsCalendar } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import BookingDetailModal from "../home/BookingDetail";
import BookingModal from "../home/BookingModal";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const BookingCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<BookingsCalendar | null>(null);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDayBookings, setSelectedDayBookings] = useState<BookingsCalendar[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Nouvel état pour le filtre par intervalle de dates
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });

    const [bookings, setBookings] = useState<BookingsCalendar[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingsCalendar[]>([]);

    const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    // ===============================
    // 🔄 FETCH DATA
    // ===============================
    const fetchCalendarData = async () => {
        setIsLoading(true);

        try {
            const res = await getBookingsCalendar({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
            });

            if (res.statusCode === 200 && res.data) {
                setBookings(res.data);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error("Erreur chargement calendrier:", error);
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate.getMonth(), currentDate.getFullYear()]);

    // ===============================
    // 🔍 FILTER BOOKINGS BY DATE RANGE
    // ===============================
    useEffect(() => {
        if (!dateRange?.from) {
            setFilteredBookings(bookings);
            return;
        }

        const filtered = bookings.filter(booking => {
            if (!booking.scheduledDate) return false;

            const bookingDate = new Date(booking.scheduledDate);

            // Si seulement la date de début est définie
            if (dateRange.from && !dateRange.to) {
                return format(bookingDate, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
            }

            // Si les deux dates sont définies
            if (dateRange.from && dateRange.to) {
                return isWithinInterval(bookingDate, {
                    start: startOfDay(dateRange.from),
                    end: endOfDay(dateRange.to)
                });
            }

            return true;
        });

        setFilteredBookings(filtered);
    }, [bookings, dateRange]);

    // ===============================
    // 📅 GENERATION JOURS
    // ===============================
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = (firstDay.getDay() + 6) % 7;

        const days: (Date | null)[] = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentDate]);

    // ===============================
    // 📦 GROUP BY DAY (SAFE)
    // ===============================
    const bookingsByDay = useMemo(() => {
        const map = new Map<string, BookingsCalendar[]>();

        filteredBookings.forEach((booking) => {
            if (!booking.scheduledDate) return;

            // On utilise format(new Date(), ...) pour obtenir la date LOCALE (YYYY-MM-DD)
            // Cela permet de matcher avec les cellules du calendrier qui sont aussi en local.
            const key = format(new Date(booking.scheduledDate), 'yyyy-MM-dd');

            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(booking);
        });

        return map;
    }, [filteredBookings]);

    const getBookingsForDay = (date: Date | null): BookingsCalendar[] => {
        if (!date) return [];
        const key = format(date, 'yyyy-MM-dd');
        return bookingsByDay.get(key) ?? [];
    };

    const isToday = (date: Date | null): boolean => {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isInSelectedRange = (date: Date | null): boolean => {
        if (!date || !dateRange?.from) return false;

        if (dateRange.from && !dateRange.to) {
            return format(date, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
        }

        if (dateRange.from && dateRange.to) {
            return isWithinInterval(date, {
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to)
            });
        }

        return false;
    };

    const prevMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        );
    };

    const getStatusColor = (status?: BookingStatus): string => {
        if (!status) return "bg-gray-400";

        const colors: Record<BookingStatus, string> = {
            PENDING: "bg-yellow-500",
            ACCEPTED: "bg-green-500",
            IN_PROGRESS: "bg-blue-500",
            COMPLETED: "bg-emerald-600",
            CANCELLED: "bg-red-500",
            PAID: "bg-purple-500",
        };

        return colors[status] ?? "bg-gray-400";
    };

    const handleDateClick = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);

        const dayBookings = getBookingsForDay(date);
        if (dayBookings.length > 0) {
            setSelectedDayBookings(dayBookings);
            setIsDayModalOpen(true);
        }
    };

    const handleBookingSelect = (booking: BookingsCalendar) => {
        setSelectedBooking(booking);
        setOpen(true);
    };

    const clearDateRange = () => {
        setDateRange({ from: undefined, to: undefined });
    };

    // ===============================
    // 🎨 UI
    // ===============================
    return (
        <div className="w-full max-w-4xl mx-auto mt-4">
            {/* Filtre par intervalle de dates */}
            <div className="mb-4 flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[300px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")} >
                            <Icon icon="solar:calendar-date-bold-duotone" className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                                        {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                                    </>
                                ) : (
                                    format(dateRange.from, "dd/MM/yyyy", { locale: fr })
                                )
                            ) : (
                                <span>Sélectionner une période</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={currentDate}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={fr}
                        />
                    </PopoverContent>
                </Popover>

                {dateRange?.from && (
                    <Button variant="ghost" onClick={clearDateRange} className="text-sm" >
                        Réinitialiser
                    </Button>
                )}

                {dateRange?.from && (
                    <span className="text-sm text-muted-foreground font-medium">
                        {filteredBookings.length} réservation(s) trouvée(s)
                    </span>
                )}
            </div>

            <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <button onClick={prevMonth} disabled={isLoading} className="p-2 rounded-full hover:bg-muted disabled:opacity-50 transition-colors">
                        <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                            {monthNames[currentDate.getMonth()]}{" "}
                            {currentDate.getFullYear()}
                        </h2>
                        {isLoading && (
                            <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin text-primary" />
                        )}
                    </div>

                    <button onClick={nextMonth} disabled={isLoading} className="p-2 rounded-full hover:bg-muted disabled:opacity-50 transition-colors" >
                        <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-5 h-5 text-foreground" />
                    </button>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 px-2">
                    {daysOfWeek.map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                {/* <pre>{JSON.stringify(calendarDays, null, 2)}</pre> */}

                <div className="grid grid-cols-7 gap-1 p-2">
                    {calendarDays.map((date, idx) => {
                        const dayBookings = getBookingsForDay(date);
                        const hasBookings = dayBookings.length > 0;
                        const isCurrentDay = isToday(date);
                        const isInRange = isInSelectedRange(date);

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDateClick(date)}
                                className={cn(`aspect-square p-1.5 rounded-2xl cursor-pointer transition-all border border-transparent`,
                                    hasBookings ? "bg-primary/5 border-primary/20" : "hover:bg-muted",
                                    isCurrentDay && "ring-2 ring-primary ring-inset",
                                    isInRange && "bg-primary/10 border-primary/30"
                                )} >
                                {date && (
                                    <>
                                        <div className={cn("text-xs text-center font-bold mb-1",
                                            isCurrentDay ? "text-primary" : "text-foreground"
                                        )}>
                                            {date.getDate()}
                                        </div>
                                        {hasBookings && (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#b07b5e] shadow-sm" />
                                                {dayBookings.length > 1 && (
                                                    <span className="text-[8px] font-black text-[#b07b5e]">
                                                        {dayBookings.length}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Résumé des réservations filtrées */}
                {dateRange?.from && filteredBookings.length > 0 && (
                    <div className="p-4 border-t">
                        <h3 className="font-semibold mb-2">Réservations de la période :</h3>
                        <div className="max-h-40 overflow-y-auto">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} onClick={() => handleBookingSelect(booking)} className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer flex items-center gap-2" >
                                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(booking.status))} />
                                    <span className="text-sm">
                                        {booking.scheduledDate && format(new Date(booking.scheduledDate), "dd/MM/yyyy")}
                                    </span>
                                    <span className="text-sm font-medium">
                                        {booking.client?.fullName || booking.client?.email || "Client"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <BookingDetailModal
                isOpen={open}
                onClose={() => setOpen(false)}
                booking={selectedBooking}
                onEditRdv={(b) => {
                    setSelectedBooking(b as BookingsCalendar);
                    setIsEditModalOpen(true);
                }}
            />

                {selectedBooking && (
                    <BookingModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setTimeout(() => setSelectedBooking(null), 300);
                            fetchCalendarData();
                        }}
                        mode="edit"
                        booking={selectedBooking}
                        item={(selectedBooking.service || selectedBooking.annonce) as any}
                        type={(selectedBooking.bookingType || (selectedBooking.service ? 'SERVICE' : 'ANNONCE')) as 'SERVICE' | 'ANNONCE'}
                    />
                )}

            {/* Modal for Day Bookings */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isDayModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsDayModalOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]"
                            />
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed inset-0 flex items-end md:items-center justify-center z-[1001]"
                            >
                                <div className="bg-card shadow-2xl w-full md:w-[90%] md:max-w-md rounded-t-[2.5rem] md:rounded-3xl overflow-hidden flex flex-col h-[90vh] md:h-auto border border-border">
                                    {/* Drag Handle - Mobile only */}
                                    <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden">
                                        <div className="w-12 h-1.5 bg-muted rounded-full" />
                                    </div>
                                    <div className="p-6 border-b border-border bg-primary/5 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-lg text-foreground">
                                                {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: fr })}
                                            </h3>
                                            <p className="text-xs text-primary font-bold uppercase tracking-wider">
                                                {selectedDayBookings.length} Réservation(s)
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsDayModalOpen(false)}
                                            className="p-2 rounded-full hover:bg-muted transition-colors"
                                        >
                                            <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
                                        {selectedDayBookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                onClick={() => {
                                                    handleBookingSelect(booking);
                                                    setIsDayModalOpen(false);
                                                }}
                                                className="group p-4 bg-muted/30 hover:bg-primary/5 rounded-2xl cursor-pointer flex items-center gap-4 border border-transparent hover:border-primary/20 transition-all font-sans"
                                            >
                                                <div className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", getStatusColor(booking.status))} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-foreground truncate">
                                                        {booking.client?.fullName || booking.client?.email || "Client"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold bg-card px-2 py-0.5 rounded-full border border-border">
                                                            <Icon icon="solar:clock-circle-bold-duotone" width={10} className="text-primary" />
                                                            {booking.scheduledTime || "--:--"}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate">
                                                            {booking.service?.title}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-xl bg-card text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border">
                                                    <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-muted/50 border-t border-border sticky bottom-0">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl font-bold border-border hover:bg-muted text-foreground"
                                            onClick={() => setIsDayModalOpen(false)}
                                        >
                                            Fermer
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default BookingCalendar;