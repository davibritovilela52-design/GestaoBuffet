import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService } from '../services/dataService';
import { UserRole, UserStatus, DealStatus } from '../types';

describe('Funcionalidade 3: Funil de Vendas (Kanban)', () => {
    let service: DataService;

    // Mock Admin
    const adminUser = {
        id: 'admin1',
        name: 'Admin',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        avatarUrl: ''
    };

    beforeEach(() => {
        localStorage.clear();
        service = new DataService();
        vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
    });

    it('deve realizar o fluxo completo de vendas (Lead -> Negociação -> Fechado)', async () => {
        // 1. Create Lead
        const deal = await service.createLead({
            clientName: 'Funnel Test',
            clientEmail: 'funnel@test.com',
            eventDate: '2026-10-10'
        });
        expect(deal.status).toBe(DealStatus.LEAD);

        // 2. Move to Negotiation
        await service.updateDealStatus(deal.id, DealStatus.NEGOTIATION, adminUser);

        // Verify update
        let updatedDeal = await service.getDealById(deal.id);
        expect(updatedDeal?.status).toBe(DealStatus.NEGOTIATION);

        // 3. Move to Closed
        await service.updateDealStatus(deal.id, DealStatus.CLOSED, adminUser);
        updatedDeal = await service.getDealById(deal.id);
        expect(updatedDeal?.status).toBe(DealStatus.CLOSED);

        // 4. Verify list persistence
        const allDeals = await service.getDeals();
        const storedDeal = allDeals.find(d => d.id === deal.id);
        expect(storedDeal?.status).toBe(DealStatus.CLOSED);
    });
});
