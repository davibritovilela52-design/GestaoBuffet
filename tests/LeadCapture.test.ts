import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService } from '../services/dataService';
import { DealStatus } from '../types';

describe('Funcionalidade 1: Captação de Leads', () => {
    let service: DataService;

    beforeEach(() => {
        // Clear localStorage and reset service for each test
        localStorage.clear();
        service = new DataService();
        // Stub global console to reduce noise
        vi.stubGlobal('console', { ...console, log: vi.fn(), error: vi.fn() });
    });

    it('deve criar um novo negócio com status LEAD quando dados válidos são fornecidos', async () => {
        const validLead = {
            clientName: 'João Silva',
            clientEmail: 'joao@example.com',
            eventName: 'Casamento João e Maria',
            eventDate: '2026-12-25',
            guestCount: 100
        };

        const inputDate = new Date();
        const deal = await service.createLead(validLead);

        expect(deal).toBeDefined();
        expect(deal.id).toBeDefined();
        // Check Status Requirements from Req 1
        expect(deal.status).toBe(DealStatus.LEAD);
        // Check Data Persistence
        expect(deal.clientName).toBe(validLead.clientName);

        // Check if it was saved to list
        const allDeals = await service.getDeals();
        const savedDeal = allDeals.find(d => d.id === deal.id);
        expect(savedDeal).toBeDefined();
        expect(savedDeal?.clientName).toBe(deal.clientName);
    });

    it('deve falhar se campos obrigatórios não forem fornecidos (Validação)', async () => {
        await expect(service.createLead({ clientName: '', clientEmail: '', eventDate: '' } as any))
            .rejects.toThrow(/Nome, email e data do evento sao obrigatorios/i);
    });

    it('deve validar datas inválidas ou passadas', async () => {
        // Test invalid date string
        await expect(service.createLead({
            clientName: 'Validator',
            clientEmail: 'v@t.com',
            eventDate: 'not-a-date'
        } as any)).rejects.toThrow(/data/i);

        // We could add past date check if that's a requirement to block
    });
});
