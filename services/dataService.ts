import { AlertNotification, alertsService } from './alertsService';
import { dealsService } from './dealsService';
import { documentsService } from './documentsService';
import { financialsService } from './financialsService';
import { staffingService } from './staffingService';
import { usersService } from './usersService';
import { Deal, DealDocument, DealStatus, FinancialEntry, KPI, User } from '../types';

type AssignmentUpdate = Partial<{
  role: string;
  status: Deal['assignments'][number]['status'];
}>;

export class DataService {
  getUsers(): Promise<User[]> {
    return usersService.getUsers();
  }

  addUser(newUser: Partial<User>, requestingUser: User): Promise<void> {
    return usersService.addUser(newUser, requestingUser);
  }

  toggleUserStatus(id: string, requestingUser: User): Promise<void> {
    return usersService.toggleUserStatus(id, requestingUser);
  }

  getDeals(): Promise<Deal[]> {
    return dealsService.getDeals();
  }

  getDealById(id: string): Promise<Deal | undefined> {
    return dealsService.getDealById(id);
  }

  createLead(lead: Partial<Deal>): Promise<Deal> {
    return dealsService.createLead(lead);
  }

  createPublicLead(orgSlug: string, lead: Partial<Deal>): Promise<void> {
    return dealsService.createPublicLead(orgSlug, lead);
  }

  updateDealStatus(id: string, status: DealStatus, requestingUser: User): Promise<void> {
    return dealsService.updateDealStatus(id, status, requestingUser);
  }

  updateDeal(id: string, data: Partial<Deal>, requestingUser: User): Promise<void> {
    return dealsService.updateDeal(id, data, requestingUser);
  }

  applyForDeal(dealId: string, userId: string, role: string): Promise<void> {
    return staffingService.applyForDeal(dealId, userId, role);
  }

  approveStaffAssignment(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
    return staffingService.approveStaffAssignment(dealId, targetUserId, requestingUser);
  }

  rejectStaffAssignment(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
    return staffingService.rejectStaffAssignment(dealId, targetUserId, requestingUser);
  }

  assignStaff(dealId: string, targetUserId: string, role: string, requestingUser: User): Promise<void> {
    return staffingService.assignStaff(dealId, targetUserId, role, requestingUser);
  }

  updateDealAssignment(
    dealId: string,
    targetUserId: string,
    data: AssignmentUpdate,
    requestingUser: User
  ): Promise<void> {
    return staffingService.updateDealAssignment(dealId, targetUserId, data, requestingUser);
  }

  withdrawApplication(dealId: string, userId: string): Promise<void> {
    return staffingService.withdrawApplication(dealId, userId);
  }

  withdrawApprovedAssignment(dealId: string, userId: string, reason: string): Promise<void> {
    return staffingService.withdrawApprovedAssignment(dealId, userId, reason);
  }

  acceptAssignment(dealId: string, userId: string): Promise<void> {
    return staffingService.acceptAssignment(dealId, userId);
  }

  rejectAssignment(dealId: string, userId: string): Promise<void> {
    return staffingService.rejectAssignment(dealId, userId);
  }

  getDealDocuments(dealId: string): Promise<DealDocument[]> {
    return documentsService.getDealDocuments(dealId);
  }

  uploadDealDocument(
    dealId: string,
    payload: { name: string; documentDate: string; file: File },
    requestingUser: User
  ): Promise<DealDocument> {
    return documentsService.uploadDealDocument(dealId, payload, requestingUser);
  }

  updateDealDocument(
    documentId: string,
    payload: { name: string; documentDate: string },
    requestingUser: User
  ): Promise<void> {
    return documentsService.updateDealDocument(documentId, payload, requestingUser);
  }

  deleteDealDocument(documentId: string, requestingUser: User): Promise<void> {
    return documentsService.deleteDealDocument(documentId, requestingUser);
  }

  getFinancials(): Promise<FinancialEntry[]> {
    return financialsService.getFinancials();
  }

  getFinancialsByDealId(dealId: string): Promise<FinancialEntry[]> {
    return financialsService.getFinancialsByDealId(dealId);
  }

  addFinancialEntry(entry: Omit<FinancialEntry, 'id'>, requestingUser: User): Promise<FinancialEntry> {
    return financialsService.addFinancialEntry(entry, requestingUser);
  }

  updateFinancialEntry(id: string, data: Partial<FinancialEntry>, requestingUser: User): Promise<void> {
    return financialsService.updateFinancialEntry(id, data, requestingUser);
  }

  getKPIs(): Promise<KPI> {
    return financialsService.getKPIs();
  }

  getAlerts(requestingUser: User): Promise<AlertNotification[]> {
    return alertsService.getAlerts(requestingUser);
  }

  resolveAlert(alertId: string, requestingUser: User): Promise<void> {
    return alertsService.resolveAlert(alertId, requestingUser);
  }

  checkAndGenerateAlerts(): Promise<void> {
    return alertsService.checkAndGenerateAlerts();
  }
}

export const dataService = new DataService();
