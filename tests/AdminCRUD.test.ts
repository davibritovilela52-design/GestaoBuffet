import { describe, it, expect, beforeEach } from 'vitest';
import { dealsApi } from '../api/deals';
import { financialsApi } from '../api/financials';
import { usersApi } from '../api/users';
import { db } from '../api/db';
import { User, UserRole, UserStatus, DealStatus, Deal, FinancialEntry, EventType, TransactionType } from '../types';

describe('Admin CRUD Enforcement', () => {
    let adminUser: User;
    let employeeUser: User;

    beforeEach(() => {
        // Reset DB state manually or mock it. 
        // Ideally we should use a fresh DB instance, but our db export is a singleton.
        // We will push test data and clean up.

        adminUser = {
            id: 'admin1',
            name: 'Admin Tester',
            email: 'admin@test.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        };

        employeeUser = {
            id: 'emp1',
            name: 'Employee Tester',
            email: 'emp@test.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE
        };
    });

    it('should allow Admin to update a deal', async () => {
        const deal = await dealsApi.createLead({ clientName: 'Test Client', clientEmail: 'test@t.com', eventDate: '2026-01-01' });
        await dealsApi.update(deal.id, { clientName: 'Updated Name' }, adminUser);

        const updated = await dealsApi.getById(deal.id);
        expect(updated?.clientName).toBe('Updated Name');
    });

    it('should BLOCK Employee from updating a deal', async () => {
        const deal = await dealsApi.createLead({ clientName: 'Test Client', clientEmail: 'test@t.com', eventDate: '2026-01-01' });
        await expect(dealsApi.update(deal.id, { clientName: 'Hacked' }, employeeUser))
            .rejects.toThrow(/Apenas administradores podem/);
    });

    it('should cascade delete financials when a deal is deleted', async () => {
        // Setup: Closed Deal + Financial Entry
        const deal = await dealsApi.createLead({ clientName: 'Cascade Test', clientEmail: 'c@t.com', eventDate: '2026-01-01' });
        // Force closed status to allow financial entry
        const dealRef = db.deals.find(d => d.id === deal.id);
        if (dealRef) dealRef.status = DealStatus.CLOSED;

        const entry = await financialsApi.addEntry({
            dealId: deal.id,
            amount: 1000,
            type: TransactionType.INCOME,
            category: 'Test',
            description: 'Test',
            date: '2026-01-01'
        }, adminUser);

        // Action: Delete Deal
        await dealsApi.delete(deal.id, adminUser);

        // Assert: Deal gone
        const foundDeal = db.deals.find(d => d.id === deal.id);
        expect(foundDeal).toBeUndefined();

        // Assert: Financial entry gone
        const foundEntry = db.financials.find(f => f.id === entry.id);
        expect(foundEntry).toBeUndefined();
    });

    it('should prevent deleting self (User)', async () => {
        // Mock admin in DB to be deletable? No, just try to delete the requesting user
        // We need to add the user to DB first so findIndex works
        db.users.push(adminUser);

        await expect(usersApi.delete(adminUser.id, adminUser))
            .rejects.toThrow("Não é possível excluir a si mesmo");

        // Clean up
        const idx = db.users.findIndex(u => u.id === adminUser.id);
        if (idx !== -1) db.users.splice(idx, 1);
    });

    it('should BLOCK adding financials to non-CLOSED deals', async () => {
        const deal = await dealsApi.createLead({ clientName: 'Open Deal', clientEmail: 'o@t.com', eventDate: '2026-01-01' });
        // Status is LEAD by default

        await expect(financialsApi.addEntry({
            dealId: deal.id,
            amount: 500,
            type: TransactionType.EXPENSE,
            category: 'Test',
            description: 'Fail',
            date: '2026-01-01'
        }, adminUser)).rejects.toThrow(/Lançamentos financeiros vinculados a negócios só podem ser feitos se o negócio estiver FECHADO/);
    });
});
