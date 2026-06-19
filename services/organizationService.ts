import { supabase } from './supabaseClient';
import { Organization } from '../types';

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
