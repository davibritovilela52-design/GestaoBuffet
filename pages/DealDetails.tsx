import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { Deal, DealDocument, DealStatus, FinancialEntry, PaymentTask, TransactionType, User, UserRole, UserStatus } from '../types';
import { dataService } from '../services/dataService';
import { EditDealModal } from '../components/EditDealModal';
import { STAFF_ROLES } from '../constants/staffRoles';

export default function DealDetails() {
    const { id } = useParams();
    const { user } = useOutletContext<{ user: User }>();
    const [deal, setDeal] = useState<Deal | null>(null);
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<{
        userId: string;
        role: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
    } | null>(null);
    const [editingFinancialId, setEditingFinancialId] = useState<string | null>(null);
    const [financialEditForm, setFinancialEditForm] = useState({
        date: '',
        type: TransactionType.INCOME,
        category: '',
        description: '',
        amount: ''
    });
    const [users, setUsers] = useState<User[]>([]);

    // Financial State
    const [financials, setFinancials] = useState<FinancialEntry[]>([]);
    const [finForm, setFinForm] = useState({
        type: TransactionType.INCOME,
        category: 'Evento',
        description: '',
        amount: ''
    });

    const [documents, setDocuments] = useState<DealDocument[]>([]);
    const [docForm, setDocForm] = useState<{ name: string; date: string; file: File | null }>({
        name: '',
        date: '',
        file: null
    });
    const [docInputKey, setDocInputKey] = useState(0);
    const [docUploading, setDocUploading] = useState(false);
    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
    const [docEditForm, setDocEditForm] = useState({ name: '', date: '' });

    // Payment Task State
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskAmount, setNewTaskAmount] = useState('');

    // Admin manual assign state
    const [manualUser, setManualUser] = useState('');
    const [manualRole, setManualRole] = useState('');

    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [withdrawalReason, setWithdrawalReason] = useState('');

    const isAdmin = user.role === UserRole.ADMIN;

    useEffect(() => {
        if (id) {
            refreshData();
            dataService.getUsers().then(setUsers);
        }
    }, [id]);

    const refreshData = async () => {
        if (!id) return;
        const d = await dataService.getDealById(id);
        setDeal(d || null);
        const docs = await dataService.getDealDocuments(id);
        setDocuments(docs);
        if (isAdmin) {
            const f = await dataService.getFinancialsByDealId(id);
            setFinancials(f);
        }
    };

    const handleApprove = async (targetUserId: string) => {
        if (!id) return;
        try {
            await dataService.approveStaffAssignment(id, targetUserId, user);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleReject = async (targetUserId: string) => {
        if (!id) return;
        try {
            await dataService.rejectStaffAssignment(id, targetUserId, user);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleApply = async (role: string) => {
        if (!id) return;
        try {
            await dataService.applyForDeal(id, user.id, role);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleWithdraw = async () => {
        if (!id) return;
        if (!confirm("Tem certeza que deseja retirar sua candidatura?")) return;

        try {
            await dataService.withdrawApplication(id, user.id);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    }

    const handleWithdrawApproved = async () => {
        if (!id || !withdrawalReason.trim()) {
            alert("Por favor, informe o motivo da desistência.");
            return;
        }

        try {
            await dataService.withdrawApprovedAssignment(id, user.id, withdrawalReason.trim());
            setIsWithdrawalModalOpen(false);
            setWithdrawalReason('');
            refreshData();
            alert("Desistência registrada com sucesso.");
        } catch (e: any) {
            alert("Erro ao processar desistência: " + e.message);
        }
    };

    const handleManualAssign = async () => {
        if (!id || !manualUser || !manualRole) return;
        try {
            await dataService.assignStaff(id, manualUser, manualRole, user);
            setManualUser('');
            setManualRole('');
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAddFinancial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !deal) return;

        try {
            await dataService.addFinancialEntry({
                dealId: id,
                date: new Date().toISOString().split('T')[0],
                type: finForm.type,
                category: finForm.category,
                description: finForm.description,
                amount: parseFloat(finForm.amount)
            }, user);
            setFinForm({ ...finForm, description: '', amount: '' });
            refreshData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const startEditAssignment = (assignment: { userId: string; role: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => {
        setEditingAssignment({
            userId: assignment.userId,
            role: assignment.role,
            status: assignment.status
        });
    };

    const handleSaveAssignment = async () => {
        if (!id || !editingAssignment) return;
        try {
            await dataService.updateDealAssignment(
                id,
                editingAssignment.userId,
                { role: editingAssignment.role, status: editingAssignment.status },
                user
            );
            setEditingAssignment(null);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const startEditFinancial = (entry: FinancialEntry) => {
        setEditingFinancialId(entry.id);
        setFinancialEditForm({
            date: entry.date,
            type: entry.type,
            category: entry.category,
            description: entry.description,
            amount: String(entry.amount)
        });
    };

    const handleSaveFinancial = async () => {
        if (!editingFinancialId) return;
        const amountValue = parseFloat(financialEditForm.amount);
        if (Number.isNaN(amountValue)) {
            alert("Valor invÇ­lido.");
            return;
        }
        try {
            await dataService.updateFinancialEntry(
                editingFinancialId,
                {
                    date: financialEditForm.date,
                    type: financialEditForm.type,
                    category: financialEditForm.category,
                    description: financialEditForm.description,
                    amount: amountValue
                },
                user
            );
            setEditingFinancialId(null);
            refreshData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDocumentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!docForm.name.trim() || !docForm.date || !docForm.file) {
            alert('Preencha nome, data e selecione o arquivo.');
            return;
        }
        setDocUploading(true);
        try {
            await dataService.uploadDealDocument(id, {
                name: docForm.name.trim(),
                documentDate: docForm.date,
                file: docForm.file
            }, user);
            setDocForm({ name: '', date: '', file: null });
            setDocInputKey(prev => prev + 1);
            const docs = await dataService.getDealDocuments(id);
            setDocuments(docs);
        } catch (error: any) {
            alert(error.message || 'Erro ao enviar documento.');
        } finally {
            setDocUploading(false);
        }
    };

    const startEditDocument = (doc: DealDocument) => {
        setEditingDocumentId(doc.id);
        setDocEditForm({ name: doc.name, date: doc.documentDate });
    };

    const handleSaveDocument = async () => {
        if (!editingDocumentId) return;
        try {
            await dataService.updateDealDocument(editingDocumentId, {
                name: docEditForm.name.trim(),
                documentDate: docEditForm.date
            }, user);
            setEditingDocumentId(null);
            const docs = await dataService.getDealDocuments(id as string);
            setDocuments(docs);
        } catch (error: any) {
            alert(error.message || 'Erro ao atualizar documento.');
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Deseja excluir este documento?')) return;
        try {
            await dataService.deleteDealDocument(docId, user);
            const docs = await dataService.getDealDocuments(id as string);
            setDocuments(docs);
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir documento.');
        }
    };

    const handleAddTask = async () => {
        if (!deal || !newTaskName || !newTaskDate) return;
        const newTask: PaymentTask = {
            id: crypto.randomUUID(),
            name: newTaskName,
            dueDate: newTaskDate,
            amount: Number(newTaskAmount) || 0,
            isCompleted: false
        };
        const updatedTasks = [...(deal.paymentTasks || []), newTask];
        try {
            // Optimistic update
            setDeal({ ...deal, paymentTasks: updatedTasks });
            await dataService.updateDeal(deal.id, { paymentTasks: updatedTasks }, user);
            setNewTaskName('');
            setNewTaskDate('');
            setNewTaskAmount('');
        } catch (e: any) {
            alert("Erro ao adicionar tarefa: " + e.message);
            refreshData(); // Revert
        }
    };

    const handleToggleTask = async (taskId: string) => {
        if (!deal) return;
        const updatedTasks = (deal.paymentTasks || []).map(t =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );
        try {
            setDeal({ ...deal, paymentTasks: updatedTasks });
            await dataService.updateDeal(deal.id, { paymentTasks: updatedTasks }, user);
        } catch (e: any) {
            alert("Erro ao atualizar tarefa: " + e.message);
            refreshData();
        }
    };

    const handleRemoveTask = async (taskId: string) => {
        if (!deal) return;
        if (!confirm('Remover esta tarefa?')) return;
        const updatedTasks = (deal.paymentTasks || []).filter(t => t.id !== taskId);
        try {
            setDeal({ ...deal, paymentTasks: updatedTasks });
            await dataService.updateDeal(deal.id, { paymentTasks: updatedTasks }, user);
        } catch (e: any) {
            alert("Erro ao remover tarefa: " + e.message);
            refreshData();
        }
    };

    const handleSavePayload = async (updatedData: Partial<Deal>) => {
        if (!editingDeal) return;
        await dataService.updateDeal(editingDeal.id, updatedData, user);
        setEditingDeal(null);
        refreshData();
    };

    const handleEditClick = () => {
        if (!deal) return;
        if (!isAdmin) {
            alert("Apenas administradores podem editar este evento.");
            return;
        }
        setEditingDeal(deal);
    };

    if (!deal) return <div className="p-8 text-center">Carregando detalhes...</div>;

    const getUser = (uid: string) => users.find(u => u.id === uid);
    const myAssignment = deal.assignments.find(a => a.userId === user.id);
    const availableUsers = users.filter(u =>
        u.status === UserStatus.ACTIVE &&
        !deal.assignments.find(a => a.userId === u.id)
    );

    // Pending Requests (For Admin View)
    const pendingRequests = deal.assignments.filter(a => a.status === 'PENDING');
    // Approved Team (For Sidebar)
    const approvedTeam = deal.assignments.filter(a => a.status === 'APPROVED');
    const withdrawnList = deal.assignments.filter(a => a.status === 'WITHDRAWN');
    const requirementRoles = Array.from(new Set(deal.requirements.map(r => r.role)));
    const applyRoles = requirementRoles.length ? requirementRoles : STAFF_ROLES;

    // Financial Calculations
    const totalIncome = financials.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
    const totalExpense = financials.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);
    const netResult = totalIncome - totalExpense;

    // Progress Logic
    const getProgress = (status: DealStatus) => {
        switch (status) {
            case DealStatus.LEAD: return { percent: 10, label: 'Lead Identificado', color: 'bg-blue-500' };
            case DealStatus.NEGOTIATION: return { percent: 60, label: 'Proposta Enviada', color: 'bg-primary' };
            case DealStatus.CLOSED: return { percent: 100, label: 'Fechado / Ganho', color: 'bg-green-500' };
            case DealStatus.LOST: return { percent: 100, label: 'Perdido', color: 'bg-red-500' };
            default: return { percent: 0, label: 'Desconhecido', color: 'bg-gray-300' };
        }
    };
    const progress = getProgress(deal.status);

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
            {/* Breadcrumbs */}
            <nav className="flex flex-wrap gap-2 items-center text-sm">
                <Link to="/events" className="text-[#617589] dark:text-slate-400 font-medium hover:text-primary">Funil de Vendas</Link>
                <span className="text-[#617589] text-sm">/</span>
                <span className="text-[#617589] dark:text-slate-400 font-medium capitalize">{deal.status.toLowerCase()}</span>
                <span className="text-[#617589] text-sm">/</span>
                <span className="text-[#111418] dark:text-white font-bold">{deal.eventName}</span>
            </nav>

            {/* Header & Status */}
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">{deal.clientName}</h1>
                        <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            <p className="text-base font-normal">Data do Evento: {deal.eventDate}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleEditClick}
                            className="flex items-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                            <span className="hidden sm:inline">Editar</span>
                        </button>
                        {isAdmin && (
                            <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
                                <span className="material-symbols-outlined text-lg">send</span>
                                <span className="hidden sm:inline">Enviar Fatura</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 flex flex-col gap-3">
                    <div className="flex gap-6 justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[#617589] dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Estágio Atual</span>
                            <p className={`text-lg font-bold ${deal.status === 'LOST' ? 'text-red-500' : 'text-primary'}`}>{progress.label}</p>
                        </div>
                        <p className="text-[#111418] dark:text-white text-sm font-bold bg-[#f0f2f4] dark:bg-gray-800 px-2 py-1 rounded">{progress.percent}% Completo</p>
                    </div>
                    <div className="h-2.5 w-full bg-[#dbe0e6] dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progress.color}`} style={{ width: `${progress.percent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Details) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Client Information */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
                            <h3 className="text-[#111418] dark:text-white text-lg font-bold">Informações do Cliente</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Nome Completo</p>
                                <p className="text-[#111418] dark:text-white font-medium">{deal.clientName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Telefone / WhatsApp</p>
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="material-symbols-outlined text-lg">chat</span>
                                    <a className="font-medium hover:underline" href="#">{deal.clientPhone || 'N/A'}</a>
                                </div>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Email</p>
                                <div className="flex items-center gap-2 text-[#111418] dark:text-white">
                                    <span className="material-symbols-outlined text-lg text-slate-400">mail</span>
                                    <p className="font-medium">{deal.clientEmail}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
                            <h3 className="text-[#111418] dark:text-white text-lg font-bold">Detalhes do Evento</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Tipo</p>
                                <p className="text-[#111418] dark:text-white font-medium">{deal.eventType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Convidados</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-slate-400">group</span>
                                    <p className="text-[#111418] dark:text-white font-medium">{deal.guestCount} Pessoas</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Horário</p>
                                <p className="text-[#111418] dark:text-white font-medium">{deal.startTime || '??'} - {deal.endTime || '??'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Local</p>
                                <p className="text-[#111418] dark:text-white font-medium">{deal.location || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Tipo do Espaço</p>
                                <p className="text-[#111418] dark:text-white font-medium">{deal.spaceType || 'N/A'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3 space-y-3 pt-2">
                                <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Necessidades de Staff</p>
                                <div className="flex flex-wrap gap-2">
                                    {deal.requirements.map((req, i) => {
                                        const filled = deal.assignments.filter(a => a.role === req.role && a.status === 'APPROVED').length;
                                        const isFull = filled >= req.count;
                                        return (
                                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isFull ? 'bg-green-50 border-green-100 text-green-700' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                                                <span className="text-xs font-bold">{req.role}</span>
                                                <span className="text-[10px] bg-white dark:bg-black/20 px-1.5 rounded-md font-bold">{filled}/{req.count}</span>
                                            </div>
                                        )
                                    })}
                                    {deal.requirements.length === 0 && <span className="text-gray-400 text-sm">Nenhum requisito definido.</span>}
                                </div>

                                {/* Staff Application Area for Employees - UPDATED LOGIC: Allowed for Closed deals too */}
                                {!isAdmin && !myAssignment && deal.status !== DealStatus.LOST && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-sm font-bold mb-2">Candidatar-se para este evento:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(applyRoles as string[]).map((role: string) => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleApply(role)}
                                                    className="px-3 py-1 bg-white border border-gray-300 hover:border-primary hover:text-primary rounded text-sm font-medium transition-colors"
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Invitation Area for Employees */}
                                {!isAdmin && myAssignment?.status === 'INVITED' && (
                                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                        <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined">info</span>
                                            Você foi convidado para este evento!
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await dataService.acceptAssignment(deal.id, user.id);
                                                        refreshData();
                                                    } catch (e: any) { alert(e.message); }
                                                }}
                                                className="flex-1 bg-green-500 text-white py-2 rounded text-sm font-bold hover:bg-green-600 transition-colors"
                                            >
                                                Aceitar Convite
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await dataService.rejectAssignment(deal.id, user.id);
                                                        refreshData();
                                                    } catch (e: any) { alert(e.message); }
                                                }}
                                                className="flex-1 bg-red-500 text-white py-2 rounded text-sm font-bold hover:bg-red-600 transition-colors"
                                            >
                                                Recusar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Control Checklist */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
                                <h3 className="text-[#111418] dark:text-white text-lg font-bold">Controle de Pagamentos e Prazos</h3>
                            </div>
                            <div className="p-6">
                                {/* Add Task Form */}
                                {isAdmin && (
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Nome da Tarefa (ex: 50% Entrada)"
                                            className="flex-1 rounded border-gray-300 text-sm py-2 px-3"
                                            value={newTaskName}
                                            onChange={e => setNewTaskName(e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            className="rounded border-gray-300 text-sm py-2 px-3"
                                            value={newTaskDate}
                                            onChange={e => setNewTaskDate(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Valor (R$)"
                                            className="w-24 rounded border-gray-300 text-sm py-2 px-3"
                                            value={newTaskAmount}
                                            onChange={e => setNewTaskAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={handleAddTask}
                                            disabled={!newTaskName || !newTaskDate}
                                            className="bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                )}

                                {/* Task List */}
                                <div className="space-y-2">
                                    {(deal.paymentTasks || []).length === 0 && (
                                        <p className="text-gray-400 text-sm italic">Nenhuma tarefa de pagamento definida.</p>
                                    )}
                                    {(deal.paymentTasks || []).map(task => (
                                        <div key={task.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => isAdmin && handleToggleTask(task.id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-primary'}`}
                                                    disabled={!isAdmin}
                                                >
                                                    {task.isCompleted && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                                </button>
                                                <div className={`${task.isCompleted ? 'opacity-50 line-through' : ''}`}>
                                                    <p className="font-medium text-sm text-[#111418] dark:text-white">
                                                        {task.name} {task.amount > 0 && <span className="text-primary font-bold ml-1">- R$ {task.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Vencimento: {new Date(task.dueDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => handleRemoveTask(task.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documentos */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-[#111418] dark:text-white text-lg font-bold">Documentos do Evento</h3>
                                {isAdmin && (
                                    <span className="text-xs text-gray-400">Somente administradores podem alterar.</span>
                                )}
                            </div>
                            <div className="p-6 space-y-4">
                                {isAdmin && (
                                    <form onSubmit={handleDocumentSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome do Documento</label>
                                            <input
                                                value={docForm.name}
                                                onChange={(e) => setDocForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full rounded border-gray-300 text-sm py-2 px-3"
                                                placeholder="Ex: Contrato, Check-list"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data</label>
                                            <input
                                                type="date"
                                                value={docForm.date}
                                                onChange={(e) => setDocForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full rounded border-gray-300 text-sm py-2 px-3"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Arquivo</label>
                                            <input
                                                key={docInputKey}
                                                type="file"
                                                onChange={(e) => setDocForm(prev => ({ ...prev, file: e.target.files ? e.target.files[0] : null }))}
                                                className="w-full text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={docUploading}
                                                className="bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                                            >
                                                {docUploading ? 'Enviando...' : 'Enviar Documento'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="space-y-3">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex flex-col gap-3 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                                            {editingDocumentId === doc.id ? (
                                                <div className="flex flex-col gap-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <input
                                                            value={docEditForm.name}
                                                            onChange={(e) => setDocEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                            className="w-full rounded border-gray-300 text-sm py-2 px-3"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={docEditForm.date}
                                                            onChange={(e) => setDocEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                            className="w-full rounded border-gray-300 text-sm py-2 px-3"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingDocumentId(null)}
                                                            className="px-3 py-1.5 rounded border border-gray-300 text-sm"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveDocument}
                                                            className="px-3 py-1.5 rounded bg-primary text-white text-sm font-bold"
                                                        >
                                                            Salvar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                                                            {doc.name}
                                                        </a>
                                                        <p className="text-xs text-gray-500 mt-1">Data: {doc.documentDate}  -  {doc.fileName}</p>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditDocument(doc)}
                                                                className="text-gray-400 hover:text-primary"
                                                                title="Editar"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                className="text-red-400 hover:text-red-600"
                                                                title="Excluir"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {documents.length === 0 && (
                                        <p className="text-sm text-gray-400">Nenhum documento anexado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Participation Requests (ADMIN ONLY) */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-[#111418] dark:text-white text-lg font-bold">Solicitações de Participação</h3>
                                {pendingRequests.length > 0 && (
                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                                        {pendingRequests.length} Nova(s)
                                    </span>
                                )}
                            </div>
                            <div className="divide-y divide-[#f0f2f4] dark:divide-gray-800">
                                {pendingRequests.map((req, i) => {
                                    const reqUser = getUser(req.userId);
                                    return (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-cover bg-gray-200" style={{ backgroundImage: `url(${reqUser?.avatarUrl})` }}></div>
                                                <div>
                                                    <p className="text-[#111418] dark:text-white font-bold">{reqUser?.name}</p>
                                                    <p className="text-[#617589] dark:text-slate-400 text-xs">
                                                        {req.role} • {req.status === 'INVITED' ? 'Convidado (Aguardando Resposta)' : `Solicitado em ${req.appliedAt}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleReject(req.userId)} className="flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Rejeitar">
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                                <button onClick={() => handleApprove(req.userId)} className="flex items-center justify-center p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors" title="Aprovar">
                                                    <span className="material-symbols-outlined text-xl">check</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {pendingRequests.length === 0 && (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        Nenhuma solicitação pendente no momento.
                                    </div>
                                )}
                            </div>

                            {/* Withdrawals (If any) */}
                            {withdrawnList.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-800">
                                    <div className="px-6 py-3 bg-red-50/50 dark:bg-red-900/10">
                                        <h4 className="text-red-600 dark:text-red-400 text-xs font-bold uppercase">Desistências do Evento</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {withdrawnList.map((req, i) => {
                                            const reqUser = getUser(req.userId);
                                            return (
                                                <div key={i} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 rounded-full bg-cover bg-gray-200 grayscale opacity-50" style={{ backgroundImage: `url(${reqUser?.avatarUrl})` }}></div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400 font-bold line-through">{reqUser?.name}</p>
                                                            <p className="text-red-500 text-xs font-medium">Motivo: {req.withdrawalReason || 'Não informado'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApprove(req.userId)}
                                                        className="text-primary text-xs font-bold hover:underline"
                                                        title="Re-aprovar este colaborador"
                                                    >
                                                        Re-escalar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Admin Manual Assign */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Atribuição Manual</p>
                                <div className="flex gap-2">
                                    <select
                                        value={manualUser}
                                        onChange={e => setManualUser(e.target.value)}
                                        className="flex-1 rounded border-gray-300 text-sm py-1.5"
                                    >
                                        <option value="">Colaborador...</option>
                                        {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <select
                                        value={manualRole}
                                        onChange={e => setManualRole(e.target.value)}
                                        className="flex-1 rounded border-gray-300 text-sm py-1.5"
                                    >
                                        <option value="">Cargo...</option>
                                        {applyRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                    <button
                                        onClick={handleManualAssign}
                                        disabled={!manualUser || !manualRole}
                                        className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-black disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Panel (ADMIN ONLY) */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="text-[#111418] dark:text-white text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">payments</span>
                                    Financeiro do Evento
                                </h3>
                                <div className="text-right">
                                    <span className={`text-lg font-black ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        R$ {netResult.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>

                            {deal.status === DealStatus.CLOSED ? (
                                <div className="p-6">
                                    {/* Form */}
                                    <form onSubmit={handleAddFinancial} className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <select
                                            className="rounded border-gray-300 text-sm py-2"
                                            value={finForm.type}
                                            onChange={e => {
                                                const newType = e.target.value as TransactionType;
                                                setFinForm({
                                                    ...finForm,
                                                    type: newType,
                                                    category: newType === TransactionType.INCOME ? 'Evento' : 'Funcionários'
                                                });
                                            }}
                                        >
                                            <option value={TransactionType.INCOME}>Receita (+)</option>
                                            <option value={TransactionType.EXPENSE}>Despesa (-)</option>
                                        </select>
                                        <select
                                            className="rounded border-gray-300 text-sm py-2"
                                            value={finForm.category}
                                            onChange={e => setFinForm({ ...finForm, category: e.target.value })}
                                            required
                                        >
                                            {finForm.type === TransactionType.INCOME ? (
                                                <option value="Evento">Evento</option>
                                            ) : (
                                                <>
                                                    <option value="Funcionários">Funcionários</option>
                                                    <option value="Locação">Locação</option>
                                                    <option value="Compras">Compras</option>
                                                </>
                                            )}
                                        </select>
                                        <input
                                            className="flex-1 min-w-[140px] rounded border-gray-300 text-sm py-2"
                                            placeholder="Descrição (ex: Garçons)"
                                            value={finForm.description}
                                            onChange={e => setFinForm({ ...finForm, description: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-24 rounded border-gray-300 text-sm py-2"
                                            placeholder="Valor"
                                            value={finForm.amount}
                                            onChange={e => setFinForm({ ...finForm, amount: e.target.value })}
                                            required
                                        />
                                        <button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded px-4 py-2 text-sm font-bold">
                                            Lançar
                                        </button>
                                    </form>

                                    {/* List */}
                                    <div className="space-y-2">
                                        {financials.map(f => (
                                            <div key={f.id} className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                                                {editingFinancialId === f.id ? (
                                                    <div className="flex flex-col gap-2 text-sm">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <input
                                                                type="date"
                                                                value={financialEditForm.date}
                                                                onChange={e => setFinancialEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                                className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                                                            />
                                                            <select
                                                                value={financialEditForm.type}
                                                                onChange={e => {
                                                                    const newType = e.target.value as TransactionType;
                                                                    setFinancialEditForm(prev => ({
                                                                        ...prev,
                                                                        type: newType,
                                                                        category: newType === TransactionType.INCOME ? 'Evento' : 'Funcionários'
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                                                            >
                                                                <option value={TransactionType.INCOME}>Receita</option>
                                                                <option value={TransactionType.EXPENSE}>Despesa</option>
                                                            </select>
                                                            <select
                                                                value={financialEditForm.category}
                                                                onChange={e => setFinancialEditForm(prev => ({ ...prev, category: e.target.value }))}
                                                                className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                                                            >
                                                                {financialEditForm.type === TransactionType.INCOME ? (
                                                                    <option value="Evento">Evento</option>
                                                                ) : (
                                                                    <>
                                                                        <option value="Funcionários">Funcionários</option>
                                                                        <option value="Locação">Locação</option>
                                                                        <option value="Compras">Compras</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                            <input
                                                                type="text"
                                                                value={financialEditForm.description}
                                                                onChange={e => setFinancialEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                                placeholder="Descrição"
                                                                className="flex-1 min-w-[180px] rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={financialEditForm.amount}
                                                                onChange={e => setFinancialEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                                                placeholder="Valor"
                                                                className="w-24 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button
                                                                onClick={handleSaveFinancial}
                                                                className="text-xs font-bold px-2 py-1 rounded bg-primary text-white hover:bg-primary/90"
                                                            >
                                                                Salvar
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingFinancialId(null)}
                                                                className="text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${f.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                            <span className="text-gray-600 dark:text-gray-400">{f.date}</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{f.description}</span>
                                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 rounded">{f.category}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`font-mono font-bold ${f.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                                R$ {f.amount.toLocaleString('pt-BR')}
                                                            </span>
                                                            <button
                                                                onClick={() => startEditFinancial(f)}
                                                                className="text-gray-400 hover:text-primary"
                                                                title="Editar"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {financials.length === 0 && <p className="text-gray-400 text-sm italic">Sem lançamentos.</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <span className="material-symbols-outlined text-gray-300 text-3xl mb-2">lock</span>
                                    <p className="text-gray-500 text-sm">O financeiro só é habilitado após o fechamento do negócio.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">

                    {/* Employee: My Status Card */}
                    {myAssignment && (
                        <div className={`rounded-xl p-6 border ${myAssignment.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                            }`}>
                            <h4 className={`text-sm font-black uppercase tracking-widest mb-4 ${myAssignment.status === 'REJECTED' ? 'text-red-600' : 'text-primary'
                                }`}>Sua Candidatura</h4>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`size-12 rounded-full flex items-center justify-center ${myAssignment.status === 'REJECTED' ? 'bg-red-200 text-red-600' :
                                    myAssignment.status === 'APPROVED' ? 'bg-green-200 text-green-600' :
                                        'bg-primary/20 text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {myAssignment.status === 'APPROVED' ? 'check' : myAssignment.status === 'REJECTED' ? 'close' : 'hourglass_empty'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[#111418] dark:text-white font-bold">Status: {myAssignment.status === 'PENDING' ? 'Pendente' : myAssignment.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}</p>
                                    <p className="text-[#617589] dark:text-slate-400 text-xs">Cargo: {myAssignment.role}</p>
                                </div>
                            </div>
                            <p className="text-[#617589] dark:text-slate-400 text-sm mb-4 leading-relaxed">
                                {myAssignment.status === 'PENDING' && "O gerente do evento está analisando seu perfil. Você será notificado em breve."}
                                {myAssignment.status === 'APPROVED' && "Parabéns! Você está escalado para este evento. Verifique os horários."}
                                {myAssignment.status === 'REJECTED' && "Infelizmente sua candidatura não foi aceita desta vez."}
                            </p>
                            {myAssignment.status === 'PENDING' && (
                                <button onClick={handleWithdraw} className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-[#111418] dark:text-white hover:bg-slate-50 transition-colors">
                                    Retirar Candidatura
                                </button>
                            )}
                            {myAssignment.status === 'APPROVED' && (
                                <button onClick={() => setIsWithdrawalModalOpen(true)} className="w-full py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                                    Desistir do Evento
                                </button>
                            )}
                        </div>
                    )}

                    {/* Assigned Team */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 p-6">
                        <h3 className="text-[#111418] dark:text-white text-base font-bold mb-4">
                            Equipe Escalada ({approvedTeam.length})
                        </h3>

                        {approvedTeam.length > 0 ? (
                            <>
                                <div className="flex -space-x-3 overflow-hidden mb-4">
                                    {approvedTeam.slice(0, 5).map((assign, i) => {
                                        const u = getUser(assign.userId);
                                        return (
                                            <div key={i} className="inline-block size-10 rounded-full ring-2 ring-white dark:ring-[#1a2632] bg-cover bg-gray-200" title={`${u?.name} (${assign.role})`} style={{ backgroundImage: `url(${u?.avatarUrl})` }}></div>
                                        )
                                    })}
                                    {approvedTeam.length > 5 && (
                                        <div className="inline-block size-10 rounded-full ring-2 ring-white dark:ring-[#1a2632] bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                            +{approvedTeam.length - 5}
                                        </div>
                                    )}
                                </div>

                                {/* Detailed List for context */}
                                <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    {approvedTeam.map(assign => {
                                        const u = getUser(assign.userId);
                                        const isEditing = editingAssignment?.userId === assign.userId;
                                        const baseRoleOptions = requirementRoles.length ? requirementRoles : [assign.role];
                                        const roleOptions = isEditing && editingAssignment && !baseRoleOptions.includes(editingAssignment.role)
                                            ? [...baseRoleOptions, editingAssignment.role]
                                            : baseRoleOptions;
                                        return (
                                            <div key={assign.userId} className="flex justify-between items-center gap-2">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-medium">{u?.name}</span>
                                                            <select
                                                                value={editingAssignment?.role || assign.role}
                                                                onChange={e => setEditingAssignment(prev => prev ? { ...prev, role: e.target.value } : prev)}
                                                                className="text-xs rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                                                            >
                                                                {roleOptions.map(role => (
                                                                    <option key={role} value={role}>{role}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <select
                                                                value={editingAssignment?.status || assign.status}
                                                                onChange={e => setEditingAssignment(prev => prev ? { ...prev, status: e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED' } : prev)}
                                                                className="text-xs rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                                                            >
                                                                <option value="PENDING">Pendente</option>
                                                                <option value="APPROVED">Aprovado</option>
                                                                <option value="REJECTED">Rejeitado</option>
                                                            </select>
                                                            <button
                                                                onClick={handleSaveAssignment}
                                                                className="text-xs font-bold px-2 py-1 rounded bg-primary text-white hover:bg-primary/90"
                                                            >
                                                                Salvar
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingAssignment(null)}
                                                                className="text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-medium">{u?.name}</span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{assign.role}</span>
                                                        {isAdmin && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => startEditAssignment(assign)}
                                                                    className="text-gray-400 hover:text-primary"
                                                                    title="Editar"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                                </button>
                                                                <button onClick={() => handleReject(assign.userId)} className="text-red-400 hover:text-red-600">
                                                                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm">Ninguém escalado ainda.</p>
                        )}
                    </div>

                    {/* Quick Info Metadata */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 p-6 space-y-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-[#617589] dark:text-slate-400 text-xs font-semibold uppercase">Gerente Responsável</p>
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-cover bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">A</div>
                                <p className="text-[#111418] dark:text-white text-sm font-medium">Admin User</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[#f0f2f4] dark:border-gray-800 flex flex-col gap-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#617589] dark:text-slate-400">Criado em</span>
                                <span className="text-[#111418] dark:text-white font-medium">{deal.createdAt.split('T')[0]}</span>
                            </div>
                            {isAdmin && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#617589] dark:text-slate-400">Valor Estimado</span>
                                    <span className="text-green-600 font-bold">R$ {deal.value.toLocaleString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {editingDeal && (
                <EditDealModal
                    deal={editingDeal}
                    isOpen={!!editingDeal}
                    onClose={() => setEditingDeal(null)}
                    onSave={handleSavePayload}
                />
            )}

            {/* Withdrawal Modal */}
            {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informar Desistência</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Sentimos muito que você não possa mais participar deste evento.
                            Por favor, informe o motivo da sua desistência para que possamos organizar a equipe.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Motivo da Desistência</label>
                                <textarea
                                    value={withdrawalReason}
                                    onChange={(e) => setWithdrawalReason(e.target.value)}
                                    placeholder="Ex: Problemas de saúde, imprevisto pessoal..."
                                    className="w-full h-32 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsWithdrawalModalOpen(false);
                                        setWithdrawalReason('');
                                    }}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleWithdrawApproved}
                                    disabled={!withdrawalReason.trim()}
                                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    Confirmar Desistência
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
