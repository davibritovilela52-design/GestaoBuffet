import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService } from '../services/dataService';
import { UserRole, UserStatus, DealStatus } from '../types';

describe('Funcionalidade 4 e 5: Gestão de Equipe e Interesses', () => {
    let service: DataService;

    const adminUser = {
        id: 'admin1',
        name: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        email: 'admin@test.com',
        avatarUrl: ''
    };

    const employee1 = {
        id: 'emp1',
        name: 'Staff 1',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        email: 'staff1@test.com',
        avatarUrl: ''
    };

    beforeEach(() => {
        localStorage.clear();
        service = new DataService();
        vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
    });

    it('deve permitir que funcionário manifeste interesse e prevenir duplicidade', async () => {
        // Create Deal
        const deal = await service.createLead({
            clientName: 'Staff Event',
            clientEmail: 'staff@test.com',
            eventDate: '2026-11-11'
        });

        // Apply
        await expect(service.applyForDeal(deal.id, employee1.id, 'Garçom'))
            .resolves.not.toThrow();

        // Verify application exists
        const updatedDeal = await service.getDealById(deal.id);
        expect(updatedDeal?.assignments).toHaveLength(1);
        expect(updatedDeal?.assignments[0].userId).toBe(employee1.id);
        expect(updatedDeal?.assignments[0].status).toBe('PENDING');

        // Try Apply Again -> Should Fail
        await expect(service.applyForDeal(deal.id, employee1.id, 'Cozinheiro'))
            .rejects.toThrow(/já manifestou interesse/i);
    });

    it('deve permitir que administrador aprove ou rejeite interesses', async () => {
        const deal = await service.createLead({
            clientName: 'Approval Event',
            clientEmail: 'appr@test.com',
            eventDate: '2026-11-12'
        });

        // Employee applies
        await service.applyForDeal(deal.id, employee1.id, 'Garçom');

        // Admin approves
        await service.approveStaffAssignment(deal.id, employee1.id, adminUser);

        // Verify Approved
        let updatedDeal = await service.getDealById(deal.id);
        const assignment = updatedDeal?.assignments.find(a => a.userId === employee1.id);
        expect(assignment?.status).toBe('APPROVED');

        // Test Rejection flow (simulating another user or reset)
        // Let's create another employee for rejection test
        const employee2 = { ...employee1, id: 'emp2' };
        await service.applyForDeal(deal.id, employee2.id, 'Barman');

        await service.rejectStaffAssignment(deal.id, employee2.id, adminUser);

        updatedDeal = await service.getDealById(deal.id);
        const assignment2 = updatedDeal?.assignments.find(a => a.userId === employee2.id);
        expect(assignment2?.status).toBe('REJECTED');
    });
});
