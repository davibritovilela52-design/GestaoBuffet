import React, { useEffect, useState } from 'react';
import { FinancialEntry, Deal, User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { useOutletContext, Link } from 'react-router-dom';

export default function Financials() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useOutletContext<{ user: User }>();

  useEffect(() => {
    if (user.role === UserRole.ADMIN) {
        Promise.all([
            dataService.getFinancials(),
            dataService.getDeals()
        ]).then(([finData, dealData]) => {
            setEntries(finData);
            setDeals(dealData);
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [user]);

  if (user.role !== UserRole.ADMIN) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">lock</span>
              <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
              <p className="text-gray-500">Apenas administradores podem visualizar registros financeiros.</p>
          </div>
      );
  }

  const totalIncome = entries.filter(e => e.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div>Carregando financeiro...</div>;

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-black">Livro Razão</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 uppercase font-bold">Receita Total</p>
                <p className="text-3xl font-black text-green-600">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 uppercase font-bold">Despesas Totais</p>
                <p className="text-3xl font-black text-red-600">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 shadow-sm">
                <p className="text-sm text-primary uppercase font-bold">Lucro Líquido</p>
                <p className="text-3xl font-black text-primary">R$ {(totalIncome - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold">Transações Recentes</h3>
                <span className="text-xs text-gray-400 italic">Para adicionar, vá para um Negócio Fechado</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-xs uppercase text-gray-500">Data Lanç.</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-500">Tipo</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-500">Evento de Ref.</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-500">Categoria</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-500">Descrição</th>
                            <th className="px-6 py-4 text-xs uppercase text-right text-gray-500">Valor Lanç.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {entries.map(entry => {
                            const deal = deals.find(d => d.id === entry.dealId);
                            return (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">{entry.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${entry.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {entry.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {deal ? (
                                            <div className="flex flex-col">
                                                <Link to={`/events/${deal.id}`} className="font-bold text-sm text-primary hover:underline truncate max-w-[150px]" title={deal.eventName}>
                                                    {deal.eventName}
                                                </Link>
                                                <div className="flex flex-col text-[10px] text-gray-500 mt-1">
                                                    <span>Data: {deal.eventDate}</span>
                                                    <span>Contrato: R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sem vínculo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300">{entry.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={entry.description}>{entry.description}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap text-gray-900 dark:text-white">
                                        R$ {entry.amount ? entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}