// Validações comuns
export const validators = {
    email: (value: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email é obrigatório';
        if (!emailRegex.test(value)) return 'Email inválido';
        return null;
    },

    phone: (value: string): string | null => {
        const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
        if (!value) return null; // Opcional
        if (!phoneRegex.test(value)) return 'Telefone inválido (formato: (11) 98888-8888)';
        return null;
    },

    required: (value: any, fieldName: string = 'Campo'): string | null => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} é obrigatório`;
        }
        return null;
    },

    minLength: (value: string, min: number, fieldName: string = 'Campo'): string | null => {
        if (value.length < min) {
            return `${fieldName} deve ter pelo menos ${min} caracteres`;
        }
        return null;
    },

    maxLength: (value: string, max: number, fieldName: string = 'Campo'): string | null => {
        if (value.length > max) {
            return `${fieldName} deve ter no máximo ${max} caracteres`;
        }
        return null;
    },

    number: (value: any, fieldName: string = 'Valor'): string | null => {
        // Check if it's a number type or a valid numeric string
        if (value === null || value === undefined || value === '') return null; // Let required validator handle empty
        if (isNaN(Number(value))) {
            return `${fieldName} deve ser um número válido`;
        }
        return null;
    },

    positiveNumber: (value: number, fieldName: string = 'Valor'): string | null => {
        if (value < 0) {
            return `${fieldName} deve ser positivo`;
        }
        return null;
    },

    futureDate: (dateString: string): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            return 'A data deve ser futura';
        }
        return null;
    }
};

// Validação de formulário de Deal
export interface DealFormData {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    eventName: string;
    eventDate: string;
    guestCount: number;
    value: number;
}

export const validateDealForm = (data: DealFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    const nameError = validators.required(data.clientName, 'Nome do cliente');
    if (nameError) errors.clientName = nameError;

    const emailError = validators.email(data.clientEmail);
    if (emailError) errors.clientEmail = emailError;

    if (data.clientPhone) {
        const phoneError = validators.phone(data.clientPhone);
        if (phoneError) errors.clientPhone = phoneError;
    }

    const eventNameError = validators.required(data.eventName, 'Nome do evento');
    if (eventNameError) errors.eventName = eventNameError;

    const dateError = validators.futureDate(data.eventDate);
    if (dateError) errors.eventDate = dateError;

    const guestError = validators.positiveNumber(data.guestCount, 'Número de convidados');
    if (guestError) errors.guestCount = guestError;

    const valueError = validators.positiveNumber(data.value, 'Valor');
    if (valueError) errors.value = valueError;

    return errors;
};
