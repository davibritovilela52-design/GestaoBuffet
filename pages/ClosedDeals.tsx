import React, { useEffect, useState, useMemo } from 'react';
import { Deal, DealStatus, User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { Link, useOutletContext } from 'react-router-dom';

type ViewMode = 'month' | 'day';

export default function ClosedDeals() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { user } = useOutletContext<{ user: User }>();

    const isAdmin = user.role === UserRole.ADMIN;

    useEffect(() => {
        dataService.getDeals().then(data => {
            setDeals(data.filter(d => d.status === DealStatus.CLOSED));
        });
    }, []);

    // Calendar Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const filteredDeals = useMemo(() => {
        return deals.filter(deal => {
            const dealDate = new Date(deal.eventDate);
            return dealDate.getFullYear() === selectedYear;
        });
    }, [deals, selectedYear]);

    // Group deals by date string (YYYY-MM-DD)
    const groupedDeals = useMemo(() => {
        const groups: Record<string, Deal[]> = {};
        filteredDeals.forEach(deal => {
            const dateStr = deal.eventDate;
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(deal);
        });
        return groups;
    }, [filteredDeals]);

    const navigateMonth = (direction: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(nextDate);
        if (nextDate.getFullYear() !== selectedYear) {
            setSelectedYear(nextDate.getFullYear());
        }
    };

    const navigateDay = (direction: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + direction);
        setCurrentDate(nextDate);
        if (nextDate.getFullYear() !== selectedYear) {
            setSelectedYear(nextDate.getFullYear());
        }
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const yearOptions = useMemo(() => {
        const currentY = new Date().getFullYear();
        const years = [];
        for (let y = currentY - 5; y <= currentY + 5; y++) {
            years.push(y);
        }
        return years;
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black">Agenda de Eventos</h1>
                    <p className="text-[#617589]">Histórico e cronograma de eventos confirmados.</p>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    {/* View Toggle */}
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Dia
                        </button>
                    </div>

                    {/* Year Filter */}
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Ano</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                const newYear = parseInt(e.target.value);
                                setSelectedYear(newYear);
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(newYear);
                                setCurrentDate(newDate);
                            }}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2 text-sm font-bold"
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Header */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <button
                    onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateDay(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 className="text-xl font-black capitalize">
                    {viewMode === 'month'
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : `${currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                </h2>
                <button
                    onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateDay(1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {/* Calendar Views */}
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {viewMode === 'month' ? (
                    <div className="grid grid-cols-7 border-collapse">
                        {/* Week Headers */}
                        {weekDays.map(day => (
                            <div key={day} className="p-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50">
                                {day}
                            </div>
                        ))}

                        {/* Days Grid */}
                        {(() => {
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const daysInMonth = getDaysInMonth(year, month);
                            const firstDay = getFirstDayOfMonth(year, month);
                            const cells = [];

                            // Empty cells for previous month offset
                            for (let i = 0; i < firstDay; i++) {
                                cells.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/50 dark:bg-slate-800/20 border-b border-r border-gray-100 dark:border-gray-800"></div>);
                            }

                            // Day cells
                            for (let d = 1; d <= daysInMonth; d++) {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const dayDeals = groupedDeals[dateStr] || [];
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                                cells.push(
                                    <div key={d} className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-800 group hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-sm font-bold ${isToday ? 'size-7 flex items-center justify-center bg-primary text-white rounded-full' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                                {d}
                                            </span>
                                            {dayDeals.length > 0 && (
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                    {dayDeals.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {dayDeals.slice(0, 3).map(deal => (
                                                <Link
                                                    key={deal.id}
                                                    to={`/events/${deal.id}`}
                                                    className="block p-1 rounded bg-blue-500 hover:bg-blue-600 dark:bg-blue-600/20 dark:hover:bg-blue-600/40 text-[9px] text-white dark:text-blue-300 font-bold truncate transition-all shadow-sm"
                                                    title={deal.eventName}
                                                >
                                                    {deal.eventName}
                                                </Link>
                                            ))}
                                            {dayDeals.length > 3 && (
                                                <button
                                                    onClick={() => {
                                                        const detailDate = new Date(year, month, d);
                                                        setCurrentDate(detailDate);
                                                        setViewMode('day');
                                                    }}
                                                    className="text-[9px] font-bold text-gray-400 hover:text-primary w-full text-center"
                                                >
                                                    + {dayDeals.length - 3} mais
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return cells;
                        })()}
                    </div>
                ) : (
                    <div className="p-6">
                        {(() => {
                            const dateStr = currentDate.toISOString().split('T')[0];
                            const dayDeals = groupedDeals[dateStr] || [];

                            if (dayDeals.length === 0) {
                                return (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="size-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-gray-400">event_busy</span>
                                        </div>
                                        <p className="text-gray-500 font-medium">Nenhum evento registrado para este dia.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {dayDeals.map(deal => (
                                        <div key={deal.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-all shadow-sm group">
                                            <div className="flex gap-4">
                                                <div className="size-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                                                    <span className="text-xs font-black uppercase tracking-tighter">{deal.startTime?.split(':')[0] || '??'}</span>
                                                    <span className="text-[10px] opacity-70">Hora</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-[#111418] dark:text-white group-hover:text-primary transition-colors">{deal.eventName}</h3>
                                                    <div className="flex gap-4 mt-1">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">person</span>
                                                            {deal.clientName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">groups</span>
                                                            {deal.guestCount} convidados
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                {isAdmin && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Valor</p>
                                                        <p className="text-lg font-black text-green-600">R$ {deal.value.toLocaleString('pt-BR')}</p>
                                                    </div>
                                                )}
                                                <Link
                                                    to={`/events/${deal.id}`}
                                                    className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all"
                                                >
                                                    Ver Detalhes
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
