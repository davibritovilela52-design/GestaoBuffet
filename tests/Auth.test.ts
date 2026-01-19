import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService } from '../services/dataService';
import { UserRole, UserStatus } from '../types';

describe('Funcionalidade 2: Autenticação e Controle de Acesso', () => {
    let service: DataService;

    // Mock Users
    const adminUser = {
        id: 'admin1',
        name: 'Admin',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        avatarUrl: ''
    };

    const employeeUser = {
        id: 'emp1',
        name: 'Employee',
        email: 'emp@test.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        avatarUrl: ''
    };

    beforeEach(() => {
        localStorage.clear();
        service = new DataService();
        vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
    });

    it('deve permitir que administradores executem ações restritas', async () => {
        // Ex: Toggle User Status is restricted
        // Create a dummy user to toggle
        const targetUserId = 'target1';
        // We need to inject a user into service to be able to toggle it, or mock the find
        // Since deals/users are private, we use public methods if possible or just rely on 'approveStaffAssignment' which we can fail/succeed

        // Let's use addUser which is restricted
        const newUser = {
            name: 'New User',
            email: 'new@test.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            avatarUrl: ''
        };

        const created = await service.addUser(newUser, adminUser);
        expect(created).toBeDefined();
        expect(created.email).toBe(newUser.email);
    });

    it('deve BLOQUEAR funcionários de executarem ações restritas (Throw Error)', async () => {
        const newUser = {
            name: 'New User 2',
            email: 'new2@test.com',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            avatarUrl: ''
        };

        await expect(service.addUser(newUser, employeeUser))
            .rejects
            .toThrow(/Não autorizado/i);
    });

    it('deve verificar permissões para atualização de status de negócio', async () => {
        // Create a deal first
        const deal = await service.createLead({
            clientName: 'Test Deal',
            clientEmail: 't@t.com',
            eventDate: '2026-01-01'
        });

        // Admin can update
        // NOTE: verify usage of types. DealStatus import needed if we use enum
        // Passing string 'NEGOTIATION' casted if needed or use enum from types
        // We'll import types in real file. Here simplified for brevity but I should import.

        // Employee CANNOT update status directly via updateDealStatus (if that's the rule)
        // Req 3 says: "Impedir que funcionários alterem status"
        // dataService.updateDealStatus checks admin

        await expect(service.updateDealStatus(deal.id, 'NEGOTIATION' as any, employeeUser))
            .rejects
            .toThrow(/Não autorizado/i);

        // Admin should succeed (returning void promise)
        await expect(service.updateDealStatus(deal.id, 'NEGOTIATION' as any, adminUser))
            .resolves
            .not.toThrow();
    });
});
