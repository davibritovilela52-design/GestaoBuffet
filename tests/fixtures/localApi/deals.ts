import { Deal, DealStatus, User, UserRole } from "../../../types";
import { db } from "./db";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function checkAdmin(user: User, action: string) {
    if (!user || user.role !== UserRole.ADMIN) {
        throw new Error(`Não autorizado: Apenas administradores podem ${action}.`);
    }
}

export const dealsApi = {
    async getAll(): Promise<Deal[]> {
        await delay(300);
        return [...db.deals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async getById(id: string): Promise<Deal | undefined> {
        await delay(200);
        return db.deals.find(d => d.id === id);
    },

    async createLead(lead: Partial<Deal>): Promise<Deal> {
        // Validate required fields
        if (!lead.clientName?.trim()) throw new Error("Nome do cliente é obrigatório");
        if (!lead.clientEmail?.trim()) throw new Error("Email do cliente é obrigatório");
        if (!lead.eventDate) throw new Error("Data do evento é obrigatória");

        const eventDateObj = new Date(lead.eventDate);
        if (isNaN(eventDateObj.getTime())) throw new Error("Data inválida");

        await delay(1000);

        const newDeal: Deal = {
            guestCount: 0,
            ...lead,
            id: Math.random().toString(36).substr(2, 9),
            requirements: lead.requirements || [],
            assignments: lead.assignments || [],
            createdAt: new Date().toISOString(),
            status: DealStatus.LEAD,
            value: 0, // Override any passed value
        } as Deal;

        db.deals.push(newDeal);
        db.save();
        return newDeal;
    },

    async updateStatus(id: string, status: DealStatus, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "atualizar status do negócio");
        const deal = db.deals.find(d => d.id === id);
        if (deal) {
            deal.status = status;
            db.save();
        }
    },

    async apply(dealId: string, userId: string, role: string): Promise<void> {
        const deal = db.deals.find(d => d.id === dealId);
        if (!deal) throw new Error("Negócio não encontrado.");
        if (deal.status === DealStatus.LOST) throw new Error("Não é possível se candidatar a um evento cancelado/perdido.");

        const existing = deal.assignments.find(a => a.userId === userId);
        if (existing) {
            if (existing.status === 'REJECTED') throw new Error("Solicitação rejeitada anteriormente.");
            throw new Error("Você já manifestou interesse.");
        }

        deal.assignments.push({
            userId,
            role,
            status: 'PENDING',
            appliedAt: new Date().toISOString().split('T')[0]
        });
        db.save();
    },

    async withdrawApplication(dealId: string, userId: string): Promise<void> {
        const deal = db.deals.find(d => d.id === dealId);
        if (!deal) throw new Error("Negócio não encontrado.");

        const assignmentIndex = deal.assignments.findIndex(a => a.userId === userId);
        if (assignmentIndex === -1) throw new Error("Candidatura não encontrada.");

        const assignment = deal.assignments[assignmentIndex];
        if (assignment.status === 'APPROVED') {
            throw new Error("Você já foi escalado oficialmente. Entre em contato com o gerente para cancelar.");
        }

        deal.assignments.splice(assignmentIndex, 1);
        db.save();
    },

    async assignStaff(dealId: string, targetUserId: string, role: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "atribuir equipe manualmente");
        const deal = db.deals.find(d => d.id === dealId);
        if (deal) {
            deal.assignments = deal.assignments.filter(a => a.userId !== targetUserId);
            deal.assignments.push({
                userId: targetUserId,
                role,
                status: 'APPROVED',
                appliedAt: new Date().toISOString().split('T')[0]
            });
            db.save();
        }
    },

    async approveStaff(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "aprovar equipe");
        if (targetUserId === requestingUser.id) throw new Error("Conflito de Interesse.");

        const deal = db.deals.find(d => d.id === dealId);
        if (deal) {
            const assignment = deal.assignments.find(a => a.userId === targetUserId);
            if (assignment) {
                assignment.status = 'APPROVED';
                db.save();
            }
        }
    },

    async rejectStaff(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "rejeitar equipe");
        const deal = db.deals.find(d => d.id === dealId);
        if (deal) {
            const assignment = deal.assignments.find(a => a.userId === targetUserId);
            if (assignment) {
                assignment.status = 'REJECTED';
                db.save();
            }
        }
    },

    async update(id: string, data: Partial<Deal>, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "atualizar dados do negócio");
        const deal = db.deals.find(d => d.id === id);
        if (!deal) throw new Error("Negócio não encontrado.");

        // Block manual value updates
        if (data.value !== undefined) {
            delete data.value;
        }

        // Merge updates
        Object.assign(deal, data);
        db.save();
    },

    async updateAssignment(
        dealId: string,
        targetUserId: string,
        data: Partial<Pick<Deal['assignments'][number], 'role' | 'status'>>,
        requestingUser: User
    ): Promise<void> {
        checkAdmin(requestingUser, "atualizar equipe");
        const deal = db.deals.find(d => d.id === dealId);
        if (!deal) throw new Error("NegÇücio nÇœo encontrado.");

        const assignment = deal.assignments.find(a => a.userId === targetUserId);
        if (!assignment) throw new Error("Equipe nÇœo encontrada.");

        if (data.role !== undefined) assignment.role = data.role;
        if (data.status !== undefined) assignment.status = data.status;

        db.save();
    },

    async delete(id: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "excluir negócio");
        const index = db.deals.findIndex(d => d.id === id);
        if (index === -1) throw new Error("Negócio não encontrado.");

        // Cascade Delete: Financials
        const financialsToRemove = db.financials.filter(f => f.dealId === id);
        financialsToRemove.forEach(f => {
            const fIndex = db.financials.findIndex(fi => fi.id === f.id);
            if (fIndex !== -1) db.financials.splice(fIndex, 1);
        });

        // Remove the deal
        db.deals.splice(index, 1);
        db.save();
    }
};
