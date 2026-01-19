import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Deal } from '../types';

// Hook especializado para deals
export function useDeals() {
    const [deals, setDeals] = useLocalStorage<Deal[]>('buffet_deals', []);

    const addDeal = useCallback((deal: Omit<Deal, 'id' | 'createdAt'>) => {
        const newDeal: Deal = {
            ...deal,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setDeals(prev => [...prev, newDeal]);
        return newDeal;
    }, [setDeals]);

    const updateDeal = useCallback((id: string, updates: Partial<Deal>) => {
        setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }, [setDeals]);

    const deleteDeal = useCallback((id: string) => {
        setDeals(prev => prev.filter(d => d.id !== id));
    }, [setDeals]);

    return { deals, addDeal, updateDeal, deleteDeal };
}
