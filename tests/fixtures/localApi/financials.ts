import { DealStatus, FinancialEntry, KPI, User, UserRole } from "../../../types";
import { db } from "./db";

// Simulate latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function checkAdmin(user: User, action: string) {
    if (!user || user.role !== UserRole.ADMIN) {
        throw new Error(`Não autorizado: Apenas administradores podem ${action}.`);
    }
}

const recalculateDealValue = (dealId: string) => {
    const deal = db.deals.find(d => d.id === dealId);
    if (!deal) return;

    const dealFinancials = db.financials.filter(f => f.dealId === dealId);
    const income = dealFinancials.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + f.amount, 0);
    const expenses = dealFinancials.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);

    deal.value = income - expenses;
    db.save();
};

const canManageDealFinancials = (status: DealStatus) =>
    status === DealStatus.CLOSED || status === DealStatus.REALIZED;

export const financialsApi = {
    async getAll(): Promise<FinancialEntry[]> {
        await delay(300);
        return [...db.financials];
    },

    async getByDealId(dealId: string): Promise<FinancialEntry[]> {
        await delay(200);
        return db.financials.filter(f => f.dealId === dealId);
    },

    async addEntry(entry: Omit<FinancialEntry, 'id'>, requestingUser: User): Promise<FinancialEntry> {
        checkAdmin(requestingUser, "gerenciar financeiro");

        // Logic Change: Allow General Expenses (no dealId)
        if (entry.dealId) {
            const deal = db.deals.find(d => d.id === entry.dealId);
            // Strict Rule: If linked to a deal, that deal MUST be Closed.
            if (!deal || !canManageDealFinancials(deal.status)) {
                throw new Error("Ação Negada: Lançamentos financeiros vinculados a negócios só podem ser feitos se o negócio estiver FECHADO ou REALIZADO.");
            }
        } else {
            // No dealId provided
            if (entry.type === 'INCOME') {
                throw new Error("Receitas devem estar obrigatoriamente vinculadas a um negócio (Deal).");
            }
            // Expenses without dealId are allowed (General Expenses)
        }

        const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) };
        db.financials.push(newEntry);

        if (entry.dealId) {
            recalculateDealValue(entry.dealId);
        } else {
            db.save();
        }

        return newEntry;
    },

    async getKPIs(): Promise<KPI> {
        await delay(200);
        const totalLeads = db.deals.length;
        const negotiationCount = db.deals.filter(d => d.status === DealStatus.NEGOTIATION).length;
        const closedCount = db.deals.filter(d => d.status === DealStatus.CLOSED || d.status === DealStatus.REALIZED).length;
        const lostCount = db.deals.filter(d => d.status === DealStatus.LOST).length;

        const income = db.financials.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + f.amount, 0);
        const expenses = db.financials.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);

        return {
            totalLeads,
            negotiationCount,
            closedCount,
            lostCount,
            monthlyRevenue: income,
            monthlyExpenses: expenses,
            netProfit: income - expenses
        };
    },

    async update(id: string, data: Partial<FinancialEntry>, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "atualizar lançamento financeiro");
        const entry = db.financials.find(f => f.id === id);
        if (!entry) throw new Error("Lançamento não encontrado.");

        // Deal Linkage Validation
        const targetDealId = data.dealId !== undefined ? data.dealId : entry.dealId;
        const targetType = data.type !== undefined ? data.type : entry.type;

        if (targetDealId) {
            const deal = db.deals.find(d => d.id === targetDealId);
            if (!deal || !canManageDealFinancials(deal.status)) {
                throw new Error("Ação Negada: Lançamento vinculado a negócio em aberto/reaberto.");
            }
        } else {
            if (targetType === 'INCOME') {
                throw new Error("Receitas devem estar vinculadas a um negócio.");
            }
        }

        Object.assign(entry, data);

        // Recalculate for both old and new dealId if changed (though changing dealId is rare/edge case)
        if (entry.dealId) recalculateDealValue(entry.dealId);
        if (data.dealId && data.dealId !== entry.dealId) recalculateDealValue(data.dealId);

        db.save();
    },

    async remove(id: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "excluir lançamento financeiro");
        const index = db.financials.findIndex(f => f.id === id);
        if (index === -1) throw new Error("Lançamento não encontrado.");

        const entry = db.financials[index];
        const linkedDealId = entry.dealId;

        // Validation (existing logic)
        if (linkedDealId) {
            const deal = db.deals.find(d => d.id === linkedDealId);
            if (!deal || !canManageDealFinancials(deal.status)) {
                throw new Error("Ação Negada: Lançamento vinculado a negócio que não está FECHADO ou REALIZADO.");
            }
        }

        db.financials.splice(index, 1);

        if (linkedDealId) {
            recalculateDealValue(linkedDealId);
        } else {
            db.save();
        }
    }
};
