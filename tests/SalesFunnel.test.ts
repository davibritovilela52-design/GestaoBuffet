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

    it('should complete the full flow from Lead to Closed', async () => {
        // Step 1: Create Lead
        // Note: The original code used `service.createLead` and assigned to `deal`.
        // The instruction provided `dealsApi.createLead` and assigned to `lead`.
        // Assuming `dealsApi` is a typo and it should be `service`, and `lead` should be `deal` for consistency with later steps.
        const deal = await service.createLead({
            clientName: 'Funnel Test',
            clientEmail: 'f@t.com',
            eventDate: '2026-06-01',
            guestCount: 150 // Added guestCount as per instruction
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
