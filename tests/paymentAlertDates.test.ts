import { describe, expect, it } from 'vitest';
import { AlertType } from '../types';
import { formatDateOnly } from '../utils/date';
import { getPaymentAlertType } from '../utils/paymentAlerts';

describe('payment alert date rules', () => {
    const referenceDate = new Date(2026, 5, 19, 12, 0, 0);

    it('classifies date-only due dates using local calendar days', () => {
        expect(getPaymentAlertType('2026-06-26', referenceDate)).toBe(AlertType.UPCOMING_PAYMENT_7);
        expect(getPaymentAlertType('2026-06-22', referenceDate)).toBe(AlertType.UPCOMING_PAYMENT_3);
        expect(getPaymentAlertType('2026-06-19', referenceDate)).toBe(AlertType.PAYMENT_DUE_TODAY);
        expect(getPaymentAlertType('2026-06-18', referenceDate)).toBe(AlertType.PAYMENT_OVERDUE);
        expect(getPaymentAlertType('2026-06-17', referenceDate)).toBe(AlertType.PAYMENT_OVERDUE);
        expect(getPaymentAlertType('2026-06-25', referenceDate)).toBeNull();
    });

    it('formats date-only values without shifting the day in local timezones', () => {
        expect(formatDateOnly('2026-06-19')).toBe('19/06/2026');
    });
});
