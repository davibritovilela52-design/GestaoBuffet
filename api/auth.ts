import { User } from "../types";
import { db } from "./db";

export const authApi = {
    async login(email: string, password: string): Promise<User> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error("Credenciais inválidas.");
        }
        return user;
    },

    async logout(): Promise<void> {
        // Logic for logout if needed (e.g. invalidate token)
    }
};
