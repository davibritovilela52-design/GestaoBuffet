// Imports updated
import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { dataService } from '../services/dataService';
import { Deal, DealStatus, User, UserRole } from '../types';
import { EditDealModal } from '../components/EditDealModal';
import { STAFF_ROLES } from '../constants/staffRoles';

export default function Kanban() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const { user } = useOutletContext<{ user: User }>();
    const navigate = useNavigate();

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        const data = await dataService.getDeals();
        setDeals(data); // In real app, consider caching or optimistic updates integration
    };

    const onDragEnd = async (result: DropResult) => {
        if (!isAdmin) return;
        const { destination, source, draggableId } = result;

        if (!destination) return; // Dropped outside
        if (destination.droppableId === source.droppableId && destination.index === source.index) return; // No change

        const newStatus = destination.droppableId as DealStatus;

        // Optimistic Update
        const dealIndex = deals.findIndex(d => d.id === draggableId);
        if (dealIndex === -1) return;

        const updatedDeals = [...deals];
        const deal = { ...updatedDeals[dealIndex], status: newStatus };
        updatedDeals[dealIndex] = deal;
        setDeals(updatedDeals);

        try {
            await dataService.updateDealStatus(draggableId, newStatus, user);
        } catch (e: any) {
            alert("Erro ao atualizar status: " + e.message);
            loadDeals(); // Revert on failure
        }
    };

    // Keep manual move for fallback/accessibility logic if needed, or remove. 
    // keeping it just for the existing sub-components if they use it, but DND replaces it main flow.
    const moveDeal = async (dealId: string, newStatus: DealStatus) => {
        // Compatibility wrapper for button clicks
        if (user.role !== UserRole.ADMIN) return;
        try {
            await dataService.updateDealStatus(dealId, newStatus, user);
            loadDeals();
        } catch (e: any) { alert(e.message); }
    };

    const handleSavePayload = async (updatedData: Partial<Deal>) => {
        if (!editingDeal) return;
        await dataService.updateDeal(editingDeal.id, updatedData, user);
        setEditingDeal(null);
        loadDeals();
    };

    const handleManifestInterest = async (dealId: string) => {
        try {
            const defaultRole = STAFF_ROLES[0] || 'Colaborador';
            await dataService.applyForDeal(dealId, user.id, defaultRole);
            navigate(`/events/${dealId}`);
        } catch (e: any) {
            alert(e.message || 'Erro ao registrar interesse.');
        }
    };

    const isAdmin = user.role === UserRole.ADMIN;
    const publicFormPath = user.orgSlug ? `/public-request/${user.orgSlug}` : '/public-request';

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="operational-hero rounded-[24px] p-6 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                <div>
                    <p className="section-eyebrow mb-2">{isAdmin ? 'Pipeline comercial' : 'Portal de oportunidades'}</p>
                    <h1 className="page-title">{isAdmin ? 'Funil de Vendas' : 'Oportunidades'}</h1>
                    <p className="text-[#617589]">
                        {isAdmin ? 'Arraste os cards para atualizar o status das negociações.' : 'Veja eventos disponíveis e candidate-se.'}
                    </p>
                </div>
                {isAdmin && (
                    <Link to={publicFormPath} target="_blank" className="btn-primary text-white px-5 py-3 rounded-2xl font-bold transition-all">Novo Lead</Link>
                )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-5 overflow-x-auto pb-6 h-full items-start min-h-[calc(100vh-240px)]">
                    {isAdmin && <Column title="Prospecção" status={DealStatus.LEAD} deals={deals} color="blue" isAdmin={isAdmin} user={user} onMove={moveDeal} onEdit={setEditingDeal} onApply={handleManifestInterest} />}
                    <Column title="Negociação" status={DealStatus.NEGOTIATION} deals={deals} color="yellow" isAdmin={isAdmin} user={user} onMove={moveDeal} onEdit={setEditingDeal} onApply={handleManifestInterest} />
                    <Column title="Fechado" status={DealStatus.CLOSED} deals={deals} color="green" isAdmin={isAdmin} user={user} onMove={moveDeal} onEdit={setEditingDeal} onApply={handleManifestInterest} />
                    {isAdmin && <Column title="Realizados" status={DealStatus.REALIZED} deals={deals} color="teal" isAdmin={isAdmin} user={user} onMove={moveDeal} onEdit={setEditingDeal} onApply={handleManifestInterest} />}
                    {isAdmin && <Column title="Perdido" status={DealStatus.LOST} deals={deals} color="red" isAdmin={isAdmin} user={user} onMove={moveDeal} onEdit={setEditingDeal} onApply={handleManifestInterest} />}
                </div>
            </DragDropContext>

            {editingDeal && (
                <EditDealModal
                    deal={editingDeal}
                    isOpen={!!editingDeal}
                    onClose={() => setEditingDeal(null)}
                    onSave={handleSavePayload}
                />
            )}
        </div>
    );
}

function Column({ title, status, deals, color, isAdmin, user, onMove, onEdit, onApply }: any) {
    const columnDeals = deals.filter((d: Deal) => d.status === status)
        .sort((a: Deal, b: Deal) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // sort by oldest?

    // Color mapping
    const bgColors: any = { blue: 'bg-blue-500', yellow: 'bg-yellow-500', green: 'bg-green-500', teal: 'bg-teal-500', red: 'bg-red-500' };

    return (
        <Droppable droppableId={status} isDropDisabled={!isAdmin}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column flex-1 min-w-[300px] max-w-[360px] flex flex-col gap-4 p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200' : ''}`}
                >
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className={`w-2 h-2 rounded-full ${bgColors[color]}`}></div>
                        <h3 className="font-display font-black text-base uppercase">{title}</h3>
                        <span className="bg-white/70 dark:bg-white/10 border border-gray-200/70 dark:border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">{columnDeals.length}</span>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[100px]">
                        {columnDeals.map((deal: Deal, index: number) => (
                            <React.Fragment key={deal.id}>
                                <Draggable draggableId={deal.id} index={index} isDragDisabled={!isAdmin}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...(isAdmin ? provided.draggableProps : {})}
                                            {...(isAdmin ? provided.dragHandleProps : {})}
                                            style={{ ...provided.draggableProps.style }}
                                            className={`deal-card p-4 flex flex-col gap-3 group transition-all ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary rotate-1 z-50 scale-105' : 'hover:border-primary/30 hover:-translate-y-0.5'}`}
                                        >
                                        {(() => {
                                            const isAlreadyAssigned = !isAdmin && deal.assignments?.some((a: any) => a.userId === user.id);
                                            return (
                                                <>
                                                    <div className="flex justify-between items-start border-b border-gray-50 dark:border-gray-800 pb-2">
                                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{deal.eventType}</span>
                                                        <Link to={`/events/${deal.id}`} title="Ver Detalhes" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                            <span className="material-symbols-outlined text-[#617589] hover:text-primary text-lg">visibility</span>
                                                        </Link>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="font-bold text-[#111418] dark:text-white text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">{deal.eventName}</h4>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-[12px] text-gray-400">person</span>
                                                            </div>
                                                            <p className="text-xs font-medium text-gray-500 truncate">{deal.clientName}</p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#617589] uppercase tracking-tight">
                                                                <span className="material-symbols-outlined !text-[14px] opacity-70">calendar_today</span>
                                                                <span>{new Date(deal.eventDate).toLocaleDateString('pt-BR')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#617589] uppercase tracking-tight justify-end">
                                                                <span className="material-symbols-outlined !text-[14px] opacity-70">groups</span>
                                                                <span>{deal.guestCount} Pessoas</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Employee Actions: Manifestar Interesse - Updated logic for already assigned */}
                                                    {!isAdmin && status !== DealStatus.LOST && !isAlreadyAssigned && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onApply(deal.id);
                                                            }}
                                                            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white text-xs font-bold transition-all"
                                                        >
                                                            Manifestar Interesse
                                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                        </button>
                                                    )}

                                                    {/* Indication that the employee is already in the event */}
                                                    {isAlreadyAssigned && (
                                                        <div className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-wider border border-green-100 dark:border-green-900/20">
                                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                                            Já Candidatado
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {isAdmin && (() => {
                                            const prevStatus = getPrevStatus(status);
                                            const nextStatus = getNextStatus(status);
                                            const canMovePrev = prevStatus !== status;
                                            const canMoveNext = nextStatus !== status;

                                            return (
                                                <div className="flex justify-between items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-gray-400">Mover etapa</span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (canMovePrev) onMove(deal.id, prevStatus);
                                                            }}
                                                            disabled={!canMovePrev}
                                                            aria-label={`Mover ${deal.eventName} para a etapa anterior`}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (canMoveNext) onMove(deal.id, nextStatus);
                                                            }}
                                                            disabled={!canMoveNext}
                                                            aria-label={`Mover ${deal.eventName} para a próxima etapa`}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onEdit(deal);
                                                            }}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                                            aria-label={`Editar ${deal.eventName}`}
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        </div>
                                    )}
                                </Draggable>
                            </React.Fragment>
                        ))}
                        {provided.placeholder}
                    </div>
                </div>
            )}
        </Droppable>
    );
}

function getNextStatus(current: DealStatus) {
    if (current === DealStatus.LEAD) return DealStatus.NEGOTIATION;
    if (current === DealStatus.NEGOTIATION) return DealStatus.CLOSED;
    if (current === DealStatus.CLOSED) return DealStatus.REALIZED;
    return current;
}
function getPrevStatus(current: DealStatus) {
    if (current === DealStatus.NEGOTIATION) return DealStatus.LEAD;
    if (current === DealStatus.CLOSED) return DealStatus.NEGOTIATION;
    if (current === DealStatus.REALIZED) return DealStatus.CLOSED;
    if (current === DealStatus.LOST) return DealStatus.LEAD;
    return current;
}
