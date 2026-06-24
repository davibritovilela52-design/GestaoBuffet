import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dealsApi } from './fixtures/localApi/deals';
import { UserRole, UserStatus, DealStatus } from '../types';

describe('Funcionalidade 3: Funil de Vendas (Kanban)', () => {
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
        vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
    });

    it('should complete the full flow from Lead to Realized', async () => {
        const deal = await dealsApi.createLead({
            clientName: 'Funnel Test',
            clientEmail: 'f@t.com',
            eventDate: '2026-06-01',
            guestCount: 150
        });
        expect(deal.status).toBe(DealStatus.LEAD);

        // 2. Move to Negotiation
        await dealsApi.updateStatus(deal.id, DealStatus.NEGOTIATION, adminUser);

        // Verify update
        let updatedDeal = await dealsApi.getById(deal.id);
        expect(updatedDeal?.status).toBe(DealStatus.NEGOTIATION);

        // 3. Move to Closed
        await dealsApi.updateStatus(deal.id, DealStatus.CLOSED, adminUser);
        updatedDeal = await dealsApi.getById(deal.id);
        expect(updatedDeal?.status).toBe(DealStatus.CLOSED);

        // 4. Move to Realized
        await dealsApi.updateStatus(deal.id, DealStatus.REALIZED, adminUser);
        updatedDeal = await dealsApi.getById(deal.id);
        expect(updatedDeal?.status).toBe(DealStatus.REALIZED);

        // 5. Verify list persistence
        const allDeals = await dealsApi.getAll();
        const storedDeal = allDeals.find(d => d.id === deal.id);
        expect(storedDeal?.status).toBe(DealStatus.REALIZED);
    });
});
