import { PlanTier } from '../types';

// This is a MOCK implementation of Stripe service.
// In production, this would make calls to your backend API, which would then call Stripe.
// For now, we simulate the flow entirely on the client side.

export const stripeService = {
    async createCheckoutSession(orgId: string, plan: PlanTier): Promise<{ url: string }> {
        console.log(`[Stripe Mock] Creating checkout session for org ${orgId} to plan ${plan}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // In a real app, this would return a Stripe Checkout URL (https://checkout.stripe.com/...)
        // Here we return a URL to our own callback page, passing the plan as a parameter
        // so we can "activate" it immediately.
        const baseUrl = window.location.origin + window.location.pathname;
        // Handle both hash router and browser router potential
        const callbackUrl = `${baseUrl}#/billing/callback?result=success&plan=${plan}`;

        return { url: callbackUrl };
    },

    async createPortalSession(orgId: string): Promise<{ url: string }> {
        console.log(`[Stripe Mock] Creating portal session for org ${orgId}`);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Just redirect to settings since we don't have a real portal
        const baseUrl = window.location.origin + window.location.pathname;
        return { url: `${baseUrl}#/settings` };
    }
};
