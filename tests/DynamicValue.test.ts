import { describe, it, expect, beforeEach } from 'vitest';
import { financialsApi } from '../api/financials';
import { dealsApi } from '../api/deals';
import { db } from '../api/db';
import { User, UserRole, UserStatus, DealStatus, TransactionType } from '../types';

describe('Dynamic Deal Value Logic', () => {
    let adminUser: User;

    beforeEach(() => {
        adminUser = {
            id: 'admin_val',
            name: 'Admin',
            email: 'admin@val.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        };
    });

    it('should initialize new Deal with Value 0', async () => {
        const deal = await dealsApi.createLead({ clientName: 'Zero', clientEmail: 'z@z.com', eventDate: '2026-01-01', value: 9999 }); // Try to inject value
        expect(deal.value).toBe(0);
    });

    it('should update Deal Value based on Financials (Income - Expense)', async () => {
        // Setup Closed Deal
        const deal = await dealsApi.createLead({ clientName: 'Fin', clientEmail: 'f@f.com', eventDate: '2026-01-01' });
        const dealRef = db.deals.find(d => d.id === deal.id);
        if (dealRef) dealRef.status = DealStatus.CLOSED;

        // 1. Add Income +1000
        await financialsApi.addEntry({
            dealId: deal.id,
            amount: 1000,
            type: TransactionType.INCOME,
            category: 'Sale',
            description: 'Deposit',
            date: '2026-01-01'
        }, adminUser);

        expect(db.deals.find(d => d.id === deal.id)?.value).toBe(1000);

        // 2. Add Expense -200
        await financialsApi.addEntry({
            dealId: deal.id,
            amount: 200,
            type: TransactionType.EXPENSE,
            category: 'Cost',
            description: 'Food',
            date: '2026-01-01'
        }, adminUser);

        expect(db.deals.find(d => d.id === deal.id)?.value).toBe(800);
    });

    it('should ignore manual updates to Deal Value', async () => {
        const deal = await dealsApi.createLead({ clientName: 'Manual', clientEmail: 'm@m.com', eventDate: '2026-01-01' });

        await dealsApi.update(deal.id, { value: 50000, clientName: 'Renamed' } as any, adminUser);

        const updated = await dealsApi.getById(deal.id);
        expect(updated?.clientName).toBe('Renamed');
        expect(updated?.value).toBe(0); // Should remain 0
    });
});
