export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  orgId?: string;
  orgName?: string;
  avatarUrl?: string;
  rating?: number; // For employees
  whatsapp?: string;
  password?: string; // In a real app, this would be hashed.
}

export enum DealStatus {
  LEAD = 'LEAD',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED = 'CLOSED',
  REALIZED = 'REALIZED',
  LOST = 'LOST'
}

export enum EventType {
  WEDDING = 'Casamento',
  CORPORATE = 'Evento Corporativo',
  PRIVATE_PARTY = 'Festa Privada',
  GALA = 'Baile de Gala',
  OTHER = 'Outro'
}

export interface StaffRequirement {
  role: string; // e.g., "Waiter", "Chef", "Bartender"
  count: number;
}

export interface StaffAssignment {
  userId: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'WITHDRAWN';
  appliedAt: string;
  withdrawalReason?: string;
}

export interface PaymentTask {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  isCompleted: boolean;
}

export enum AlertType {
  UPCOMING_PAYMENT_7 = 'UPCOMING_7',
  UPCOMING_PAYMENT_3 = 'UPCOMING_3',
  PAYMENT_DUE_TODAY = 'DUE_TODAY',
  PAYMENT_OVERDUE = 'OVERDUE',
  STAFF_INVITATION = 'STAFF_INVITATION'
}

export interface PaymentAlert {
  id: string;
  leadId: string;
  taskId: string;
  clientName: string;
  eventName: string;
  amount: number;
  dueDate: string;
  type: AlertType;
  resolved: boolean;
  createdAt: string;
}

export interface Deal {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventName: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  eventType: EventType;
  guestCount: number;
  status: DealStatus;
  value: number;
  location?: string;
  spaceType?: string;
  requirements: StaffRequirement[];
  assignments: StaffAssignment[];
  paymentTasks?: PaymentTask[];
  notes?: string;
  createdAt: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}
export interface FinancialEntry {
  id: string;
  dealId?: string; // Link to a specific deal if applicable
  date: string;
  type: TransactionType;
  category: string; // e.g., "Client Payment", "Labor", "Ingredients"
  description: string;
  amount: number;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  documentDate: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  uploadedBy?: string;
}

export interface KPI {
  totalLeads: number;
  negotiationCount: number;
  closedCount: number;
  lostCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
}
