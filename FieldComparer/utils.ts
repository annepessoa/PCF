export function parseDate(raw: unknown): Date | null {
    if (raw === null || raw === undefined) return null;
    if (raw instanceof Date) {
        if (isNaN(raw.getTime())) return null;
        return raw;
    }
    if (typeof raw === "string" || typeof raw === "number") {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return null;
        return d;
    }
    return null;
}

export function parseNumber(raw: unknown): number | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
    if (typeof raw === "string") {
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

export function normalizeToLocalDate(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
