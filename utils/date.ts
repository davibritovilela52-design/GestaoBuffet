const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const parseDateOnlyAsLocal = (value: string | null | undefined): Date | null => {
    if (!value) return null;

    const match = DATE_ONLY_PATTERN.exec(value);
    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);
        const date = new Date(year, month, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const utcCalendarDay = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

export const differenceInCalendarDays = (
    dateOnly: string | null | undefined,
    referenceDate = new Date()
): number | null => {
    const target = parseDateOnlyAsLocal(dateOnly);
    if (!target) return null;

    return Math.round((utcCalendarDay(target) - utcCalendarDay(referenceDate)) / MS_PER_DAY);
};

export const formatDateOnly = (
    value: string | null | undefined,
    locale = 'pt-BR'
) => {
    const date = parseDateOnlyAsLocal(value);
    return date ? date.toLocaleDateString(locale) : '';
};
