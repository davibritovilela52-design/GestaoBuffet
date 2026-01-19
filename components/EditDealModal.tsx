import React, { useState, useEffect } from 'react';
import { Deal, DealStatus, EventType } from '../types';

interface EditDealModalProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedDeal: Partial<Deal>) => Promise<void>;
}

export function EditDealModal({ deal, isOpen, onClose, onSave }: EditDealModalProps) {
    const [formData, setFormData] = useState<Partial<Deal>>({});
    const [loading, setLoading] = useState(false);

    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskAmount, setNewTaskAmount] = useState('');

    useEffect(() => {
        if (deal) {
            setFormData({
                eventName: deal.eventName,
                clientName: deal.clientName,
                clientEmail: deal.clientEmail,
                eventDate: deal.eventDate,
                guestCount: deal.guestCount,
                eventType: deal.eventType,
                location: deal.location,
                notes: deal.notes,
                paymentTasks: deal.paymentTasks || []
            });
        }
    }, [deal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'guestCount' ? parseInt(value) || 0 : value
        }));
    };

    const handleAddTask = () => {
        if (!newTaskName || !newTaskDate) return;
        const newTask = {
            id: crypto.randomUUID(),
            name: newTaskName,
            dueDate: newTaskDate,
            amount: Number(newTaskAmount) || 0,
            isCompleted: false
        };
        setFormData(prev => ({
            ...prev,
            paymentTasks: [...(prev.paymentTasks || []), newTask]
        }));
        setNewTaskName('');
        setNewTaskDate('');
        setNewTaskAmount('');
    };

    const toggleTask = (taskId: string) => {
        setFormData(prev => ({
            ...prev,
            paymentTasks: (prev.paymentTasks || []).map(t =>
                t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
            )
        }));
    };

    const removeTask = (taskId: string) => {
        setFormData(prev => ({
            ...prev,
            paymentTasks: (prev.paymentTasks || []).filter(t => t.id !== taskId)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            alert('Erro ao salvar: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a2431] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Editar Negócio</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex gap-6">
                    {/* Left Column: Deal Details */}
                    <div className="flex-1 flex flex-col gap-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 border-b pb-2">Detalhes do Evento</h3>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome do Evento</label>
                            <input
                                type="text"
                                name="eventName"
                                value={formData.eventName || ''}
                                onChange={handleChange}
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cliente</label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName || ''}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="clientEmail"
                                    value={formData.clientEmail || ''}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data</label>
                                <input
                                    type="date"
                                    name="eventDate"
                                    value={formData.eventDate ? new Date(formData.eventDate).toISOString().split('T')[0] : ''}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Convidados</label>
                                <input
                                    type="number"
                                    name="guestCount"
                                    value={formData.guestCount || 0}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Evento</label>
                            <select
                                name="eventType"
                                value={formData.eventType || ''}
                                onChange={handleChange}
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                {Object.values(EventType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Localização</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location || ''}
                                onChange={handleChange}
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="Endereço ou local"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Notas</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                                placeholder="Observações adicionais..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Payment Control */}
                    <div className="w-1/3 flex flex-col gap-4 border-l pl-6 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 border-b pb-2">Controle de Pagamentos</h3>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-xs font-bold uppercase text-gray-500">Adicionar Tarefa</label>
                            <input
                                type="text"
                                placeholder="Nome da tarefa (ex: Sinal)"
                                value={newTaskName}
                                onChange={e => setNewTaskName(e.target.value)}
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                            />
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={newTaskDate}
                                        onChange={e => setNewTaskDate(e.target.value)}
                                        className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Valor (R$)"
                                        value={newTaskAmount}
                                        onChange={e => setNewTaskAmount(e.target.value)}
                                        className="w-24 p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddTask}
                                    disabled={!newTaskName || !newTaskDate}
                                    className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1 font-bold text-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    ADICIONAR TAREFA
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                            {formData.paymentTasks?.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={task.isCompleted}
                                            onChange={() => toggleTask(task.id)}
                                            className="accent-primary w-4 h-4 cursor-pointer"
                                        />
                                        <div>
                                            <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>
                                                {task.name} {task.amount > 0 && <span className="text-primary font-bold"> - R$ {task.amount.toLocaleString('pt-BR')}</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTask(task.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                            {(!formData.paymentTasks || formData.paymentTasks.length === 0) && (
                                <p className="text-center text-sm text-gray-400 py-4">Nenhuma tarefa de pagamento.</p>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions (absolute or integrated) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a2431] border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-all"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
                {/* Add padding bottom to form to prevent overlap with fixed footer */}
                <div className="h-20 flex-shrink-0"></div>
            </div>
        </div>
    );
}
