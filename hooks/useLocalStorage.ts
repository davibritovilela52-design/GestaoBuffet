import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    // Estado para armazenar o valor
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Erro ao ler ${key} do localStorage:`, error);
            return initialValue;
        }
    });

    // Retornar uma versão wrapped da função setState que persiste no localStorage
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispatch a storage event so other hooks/tabs know
            // Note: window.dispatchEvent needed for same-tab updates if we want that behavior
            // The user's code blindly listens to 'storage' which usually only fires for OTHER tabs.
            // To notify the same tab, we might need to manually dispatch a custom event, but I will stick to their code for now
            // separate from the listener logic.
        } catch (error) {
            console.error(`Erro ao salvar ${key} no localStorage:`, error);
        }
    }, [key, storedValue]);

    // Sincronizar com mudanças em outras abas
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error('Erro ao sincronizar storage:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue] as const;
}
