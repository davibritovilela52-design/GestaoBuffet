import { supabase } from './supabaseClient';
import { Organization, PlanTier, PLAN_LIMITS } from '../types';

export class OrganizationService {
    async createOrganization(name: string, slug: string): Promise<string> {
        if (!name.trim()) throw new Error('Nome da organização é obrigatório.');
        if (!slug.trim()) throw new Error('Slug é obrigatório.');

        // Validate slug format
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (cleanSlug.length < 3) throw new Error('Slug deve ter pelo menos 3 caracteres.');

        // Check slug availability
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', cleanSlug)
            .maybeSingle();

        if (existing) throw new Error('Este slug já está em uso. Tente outro.');

        // Use RPC for atomic creation (creates org + updates profile)
        const { data: orgId, error } = await supabase.rpc('create_organization', {
            p_name: name.trim(),
            p_slug: cleanSlug
        });

        if (error) throw error;
        if (!orgId) throw new Error('Erro ao criar organização.');

        return orgId;
    }

    async getOrganization(orgId: string): Promise<Organization | null> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            plan: data.plan as PlanTier,
            maxLeads: data.max_leads,
            maxMembers: data.max_members,
            maxStorageMb: data.max_storage_mb,
            stripeCustomerId: data.stripe_customer_id || undefined,
            stripeSubscriptionId: data.stripe_subscription_id || undefined,
            createdAt: data.created_at,
            ownerId: data.owner_id,
        };
    }

    async updateOrganization(orgId: string, data: Partial<Pick<Organization, 'name' | 'slug'>>): Promise<void> {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name.trim();
        if (data.slug !== undefined) {
            const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (cleanSlug.length < 3) throw new Error('Slug deve ter pelo menos 3 caracteres.');
            payload.slug = cleanSlug;
        }

        const { error } = await supabase
            .from('organizations')
            .update(payload)
            .eq('id', orgId);

        if (error) throw error;
    }

    async getMemberCount(orgId: string): Promise<number> {
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId);

        if (error) throw error;
        return count || 0;
    }

    async getLeadCount(orgId: string): Promise<number> {
        const { count, error } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId);

        if (error) throw error;
        return count || 0;
    }

    async checkPlanLimit(orgId: string, resource: 'leads' | 'members'): Promise<{ allowed: boolean; current: number; max: number }> {
        const org = await this.getOrganization(orgId);
        if (!org) throw new Error('Organização não encontrada.');

        const limits = PLAN_LIMITS[org.plan];
        const current = resource === 'leads'
            ? await this.getLeadCount(orgId)
            : await this.getMemberCount(orgId);

        const max = resource === 'leads' ? limits.maxLeads : limits.maxMembers;

        return { allowed: current < max, current, max };
    }

    async updatePlan(orgId: string, plan: PlanTier): Promise<void> {
        const limits = PLAN_LIMITS[plan];
        const { error } = await supabase
            .from('organizations')
            .update({
                plan,
                max_leads: limits.maxLeads === Infinity ? 999999999 : limits.maxLeads,
                max_members: limits.maxMembers === Infinity ? 999999999 : limits.maxMembers,
                max_storage_mb: limits.maxStorageMb
            })
            .eq('id', orgId);

        if (error) throw error;
    }

    generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40);
    }
}

export const organizationService = new OrganizationService();
