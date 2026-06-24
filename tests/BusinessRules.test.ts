import { describe, it, expect, beforeEach } from 'vitest';
import { financialsApi } from './fixtures/localApi/financials';
import { usersApi } from './fixtures/localApi/users';
import { dealsApi } from './fixtures/localApi/deals';
import { db } from './fixtures/localApi/db';
import { User, UserRole, UserStatus, DealStatus, TransactionType } from '../types';

describe('Advanced Business Rules', () => {
    let adminUser: User;

    beforeEach(() => {
        adminUser = {
            id: 'admin_test',
            name: 'Admin',
            email: 'admin@rules.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        };
    });

    it('should allow creating General Expenses (unlinked)', async () => {
        const entry = await financialsApi.addEntry({
            amount: 50,
            type: TransactionType.EXPENSE,
            category: 'Office',
            description: 'Coffee',
            date: '2026-01-01'
        }, adminUser);

        expect(entry.id).toBeDefined();
        expect(entry.dealId).toBeUndefined();
    });

    it('should BLOCK creating Unlinked Income', async () => {
        await expect(financialsApi.addEntry({
            amount: 5000,
            type: TransactionType.INCOME,
            category: 'Sales',
            description: 'Mystery Money',
            date: '2026-01-01'
        }, adminUser)).rejects.toThrow("Receitas devem estar obrigatoriamente vinculadas");
    });

    it('should CASCADE delete assignments when a user is deleted', async () => {
        // 1. Create User
        const targetUser = await usersApi.add({
            name: 'Target',
            email: 'target@del.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            password: '123'
        }, adminUser);

        // 2. Assign to Deal
        const deal = await dealsApi.createLead({ clientName: 'Deal', clientEmail: 'd@d.com', eventDate: '2026-01-01' });
        // Manually assign via dealsApi (or mock db push)
        const dealRef = db.deals.find(d => d.id === deal.id);
        dealRef?.assignments.push({ userId: targetUser.id, role: 'Waiter', status: 'APPROVED', appliedAt: '2026-01-01' });

        // 3. Delete User
        await usersApi.delete(targetUser.id, adminUser);

        // 4. Verify User Gone
        expect(db.users.find(u => u.id === targetUser.id)).toBeUndefined();

        // 5. Verify Assignment Gone
        const dealAfter = db.deals.find(d => d.id === deal.id);
        const hasAssignment = dealAfter?.assignments.some(a => a.userId === targetUser.id);
        expect(hasAssignment).toBe(false);
    });

    it('should enforce Unique Email on Update', async () => {
        // Create two users
        const u1 = await usersApi.add({ name: 'U1', email: 'u1@test.com', role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, password: '1' }, adminUser);
        const u2 = await usersApi.add({ name: 'U2', email: 'u2@test.com', role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, password: '1' }, adminUser);

        // Try to rename u2 to u1's email
        await expect(usersApi.update(u2.id, { email: 'u1@test.com' }, adminUser))
            .rejects.toThrow("Já existe um usuário com este email");
    });
});
