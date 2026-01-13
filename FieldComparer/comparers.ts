import { normalizeToLocalDate } from "./utils";

export interface CompareResult { passed: boolean | null; usedSecondField?: boolean }
export type Comparator<T> = (mode: string | null, firstField: T | null, secondField: T | null) => CompareResult;
export type Labeler<T> = (mode: string | null, firstLabel?: string | null, secondLabel?: string | null, passed?: boolean, usedSecondField?: boolean) => string;

function hasTimeComponent(d: Date): boolean {
    return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0 || d.getMilliseconds() !== 0;
}

export function compareNumbers(modeRaw: string | null, firstRaw: number | null, secondRaw: number | null): CompareResult {
    const comparators: Record<string, (firstField: number | null, secondField: number | null) => CompareResult> = {
        greater_than: (firstField, secondField) => {
            if (firstField === null || secondField === null) return { passed: null };
            return { passed: secondField > firstField };
        },
        less_than: (firstField, secondField) => {
            if (firstField === null || secondField === null) return { passed: null };
            return { passed: secondField < firstField };
        },
        equal: (firstField, secondField) => {
            if (firstField === null || secondField === null) return { passed: null };
            return { passed: secondField === firstField };
        },
        not_equal: (firstField, secondField) => {
            if (firstField === null || secondField === null) return { passed: null };
            return { passed: secondField !== firstField };
        }
    };

    let mode = (modeRaw && String(modeRaw).toLowerCase()) || "greater_than";
    if (mode === "after") mode = "greater_than";
    if (mode === "before") mode = "less_than";

    const fn = comparators[mode] || comparators.greater_than;
    return fn(firstRaw, secondRaw);
}

export function buildNumericLabel(modeRaw: string | null, firstLabel: string | null | undefined, secondLabel: string | null | undefined, passed: boolean, usedSecondField?: boolean): string {
    const leftLabel = firstLabel || "First Field";
    const rightLabel = secondLabel || "Second Field";
    const labelResult = passed ? "" : "not ";

    const templates: Record<string, () => string> = {
        greater_than: () => `${rightLabel} is ${labelResult}higher than ${leftLabel}`,
        less_than: () => `${rightLabel} is ${labelResult}lower than ${leftLabel}`,
        equal: () => `${rightLabel} is ${labelResult}equal to ${leftLabel}`,
        not_equal: () => `${rightLabel} is ${labelResult}different from ${leftLabel}`,
    };

    let mode = (modeRaw && String(modeRaw).toLowerCase()) || "greater_than";
    if (mode === "after") mode = "greater_than";
    if (mode === "before") mode = "less_than";

    const fn = templates[mode] || templates.greater_than;
    return fn();
}

export function compareDates(modeRaw: string | null, firstRaw: Date | null, secondRaw: Date | null): CompareResult {
    const comparators: Record<string, (firstField: Date | null, secondField: Date | null) => CompareResult> = {
        in_the_future: (firstField, secondField) => {
            const target = secondField || firstField;
            if (!target) return { passed: null };
            // If the value includes a time component, compare the full timestamp against now.
            // Otherwise compare date-only (midnight) .
            if (hasTimeComponent(target)) {
                return { passed: target.getTime() > Date.now(), usedSecondField: !!secondField };
            }
            const targetDateOnly = normalizeToLocalDate(target);
            const today = normalizeToLocalDate(new Date());
            return { passed: targetDateOnly.getTime() > today.getTime(), usedSecondField: !!secondField };
        },
        in_the_past: (firstField, secondField) => {
            const target = secondField || firstField;
            if (!target) return { passed: null };
            if (hasTimeComponent(target)) {
                return { passed: target.getTime() < Date.now(), usedSecondField: !!secondField };
            }
            const targetDateOnly = normalizeToLocalDate(target);
            const today = normalizeToLocalDate(new Date());
            return { passed: targetDateOnly.getTime() < today.getTime(), usedSecondField: !!secondField };
        },
        after: (firstField, secondField) => {
            if (!firstField || !secondField) return { passed: null };
            return { passed: secondField.getTime() > firstField.getTime() };
        },
        before: (firstField, secondField) => {
            if (!firstField || !secondField) return { passed: null };
            return { passed: secondField.getTime() < firstField.getTime() };
        },
        equal: (firstField, secondField) => {
            if (!firstField || !secondField) return { passed: null };
            return { passed: secondField.getTime() === firstField.getTime() };
        },
        not_equal: (firstField, secondField) => {
            if (!firstField || !secondField) return { passed: null };
            return { passed: secondField.getTime() !== firstField.getTime() };
        }
    };

    const comparisonMode = (modeRaw && String(modeRaw).toLowerCase()) || "after";
    const fn = comparators[comparisonMode] || comparators.after;
    return fn(firstRaw, secondRaw);
}

export function buildDatesLabel(modeRaw: string | null, firstLabel: string | null | undefined, secondLabel: string | null | undefined, passed: boolean, usedSecondField?: boolean): string {
    const leftLabel = firstLabel || "First Field";
    const rightLabel = secondLabel || "Second Field";
    const labelResult = passed ? "" : "not ";
    const usedLabel = usedSecondField ? rightLabel : leftLabel;

    const templates: Record<string, () => string> = {
        in_the_future: () => `${usedLabel} is ${labelResult}in the future`,
        in_the_past: () => `${usedLabel} is ${labelResult}in the past`,
        after: () => `${rightLabel} is ${labelResult}after ${leftLabel}`,
        before: () => `${rightLabel} is ${labelResult}before ${leftLabel}`,
        equal: () => `${rightLabel} is ${labelResult}the same as ${leftLabel}`,
        not_equal: () => `${rightLabel} is ${labelResult}different from ${leftLabel}`,
    };

    const comparisonMode = (modeRaw && String(modeRaw).toLowerCase()) || "after";
    const fn = templates[comparisonMode] || templates.equal;
    return fn();
}


export function getComparatorAndLabeler(dataType: "date"): { comparator: Comparator<Date>; labeler: Labeler<Date> };
export function getComparatorAndLabeler(dataType: "number"): { comparator: Comparator<number>; labeler: Labeler<number> };
export function getComparatorAndLabeler(dataType: "date" | "number") {
    if (dataType === "date") {
        return {
            comparator: (mode: string | null, firstField: Date | null, secondField: Date | null) => compareDates(mode, firstField, secondField),
            labeler: (mode: string | null, firstLabel?: string | null, secondLabel?: string | null, passed?: boolean, usedSecond?: boolean) =>
                buildDatesLabel(mode, firstLabel, secondLabel, !!passed, usedSecond)
        };
    }

    return {
        comparator: (mode: string | null, firstField: number | null, secondField: number | null) => compareNumbers(mode, firstField, secondField),
        labeler: (mode: string | null, firstLabel?: string | null, secondLabel?: string | null, passed?: boolean, usedSecond?: boolean) =>
            buildNumericLabel(mode, firstLabel, secondLabel, !!passed, usedSecond)
    };
}

