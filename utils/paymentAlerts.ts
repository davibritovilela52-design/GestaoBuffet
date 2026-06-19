import { AlertType } from '../types';
import { differenceInCalendarDays } from './date';

export const getPaymentAlertType = (
    dueDate: string | null | undefined,
    referenceDate = new Date()
): AlertType | null => {
    const diffDays = differenceInCalendarDays(dueDate, referenceDate);
    if (diffDays === null) return null;

    if (diffDays === 7) return AlertType.UPCOMING_PAYMENT_7;
    if (diffDays === 3) return AlertType.UPCOMING_PAYMENT_3;
    if (diffDays === 0) return AlertType.PAYMENT_DUE_TODAY;
    if (diffDays < 0) return AlertType.PAYMENT_OVERDUE;

    return null;
};
