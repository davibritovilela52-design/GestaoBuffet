import { User, UserRole, UserStatus } from "../types";
import { db } from "./db";

// Simulate latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function checkAdmin(user: User, action: string) {
    if (!user || user.role !== UserRole.ADMIN) {
        throw new Error(`Não autorizado: Apenas administradores podem ${action}.`);
    }
}

export const usersApi = {
    async getAll(): Promise<User[]> {
        await delay(300);
        return [...db.users];
    },

    async add(user: Omit<User, 'id'>, requestingUser: User): Promise<User> {
        checkAdmin(requestingUser, "adicionar usuários");

        if (db.users.some(u => u.email === user.email)) {
            throw new Error("Já existe um usuário com este email.");
        }

        const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
        db.users.push(newUser);
        db.save();
        return newUser;
    },

    async toggleStatus(targetId: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "gerenciar usuários");
        if (targetId === requestingUser.id) {
            throw new Error("Não é possível alterar o próprio status.");
        }
        const user = db.users.find(u => u.id === targetId);
        if (user) {
            user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
            db.save();
        }
    },

    async update(id: string, data: Partial<User>, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "atualizar dados do usuário");
        const user = db.users.find(u => u.id === id);
        if (!user) throw new Error("Usuário não encontrado.");

        // Email uniqueness check (Business Rule)
        if (data.email && data.email !== user.email) {
            if (db.users.some(u => u.email === data.email)) {
                throw new Error("Já existe um usuário com este email.");
            }
        }

        Object.assign(user, data);
        db.save();
    },

    async delete(id: string, requestingUser: User): Promise<void> {
        checkAdmin(requestingUser, "excluir usuário");
        if (id === requestingUser.id) {
            throw new Error("Não é possível excluir a si mesmo.");
        }

        const index = db.users.findIndex(u => u.id === id);
        if (index === -1) throw new Error("Usuário não encontrado.");

        // Cascade: Remove user from all deal assignments (Full Admin Power - No blocking)
        db.deals.forEach(deal => {
            deal.assignments = deal.assignments.filter(a => a.userId !== id);
        });

        db.users.splice(index, 1);
        db.save();
    }
};
