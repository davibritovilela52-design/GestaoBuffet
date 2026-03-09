import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';

interface PlanLimitResult {
    allowed: boolean;
    current: number;
    max: number;
}

export function usePlanLimits() {
    const { user } = useAuth();
    const [isChecking, setIsChecking] = useState(false);

    const checkLimit = useCallback(async (resource: 'leads' | 'members'): Promise<PlanLimitResult> => {
        if (!user?.orgId) {
            return { allowed: false, current: 0, max: 0 };
        }

        setIsChecking(true);
        try {
            return await organizationService.checkPlanLimit(user.orgId, resource);
        } catch (error) {
            console.error('Error checking plan limit:', error);
            // Default to allowed if check fails (don't block user on errors)
            return { allowed: true, current: 0, max: Infinity };
        } finally {
            setIsChecking(false);
        }
    }, [user?.orgId]);

    const enforceLimit = useCallback(async (resource: 'leads' | 'members'): Promise<boolean> => {
        const result = await checkLimit(resource);
        if (!result.allowed) {
            const resourceName = resource === 'leads' ? 'leads' : 'membros';
            const maxStr = result.max === Infinity ? 'ilimitado' : result.max.toString();
            window.alert(
                `Limite do plano atingido: Você tem ${result.current}/${maxStr} ${resourceName}. ` +
                `Faça upgrade do seu plano para continuar.`
            );
            return false;
        }
        return true;
    }, [checkLimit]);

    return { checkLimit, enforceLimit, isChecking };
}
