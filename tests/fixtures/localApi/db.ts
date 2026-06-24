import { Deal, FinancialEntry, User } from "../../../types";
import { MOCK_DEALS, MOCK_FINANCIALS, MOCK_USERS } from "./mockData";

const STORAGE_KEYS = {
    USERS: 'buffet_users_v1',
    DEALS: 'buffet_deals_v1',
    FINANCIALS: 'buffet_financials_v1'
};

class Database {
    users: User[];
    deals: Deal[];
    financials: FinancialEntry[];

    constructor() {
        this.users = this.load(STORAGE_KEYS.USERS, MOCK_USERS);
        this.deals = this.load(STORAGE_KEYS.DEALS, MOCK_DEALS);
        this.financials = this.load(STORAGE_KEYS.FINANCIALS, MOCK_FINANCIALS);
    }

    private load<T>(key: string, defaultData: T[]): T[] {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultData;
        } catch (e) {
            console.error("Error loading data", e);
            return defaultData;
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
            localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(this.deals));
            localStorage.setItem(STORAGE_KEYS.FINANCIALS, JSON.stringify(this.financials));
        } catch (e) {
            console.error("Error saving data", e);
        }
    }
}

export const db = new Database();
