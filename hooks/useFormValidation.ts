import React from 'react';

// Hook para gerenciar formulários com validação
export const useFormValidation = <T extends Record<string, any>>(
    initialValues: T,
    validateFn: (values: T) => Record<string, string>
) => {
    const [values, setValues] = React.useState<T>(initialValues);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});

    const handleChange = (name: keyof T) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setValues(prev => ({ ...prev, [name]: e.target.value }));
        if (touched[name as string]) {
            const newErrors = validateFn({ ...values, [name]: e.target.value });
            setErrors(newErrors);
        }
    };

    const handleBlur = (name: keyof T) => () => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const newErrors = validateFn(values);
        setErrors(newErrors);
    };

    const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateFn(values);
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSubmit(values);
        }
    };

    const reset = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    };

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        isValid: Object.keys(errors).length === 0
    };
};
