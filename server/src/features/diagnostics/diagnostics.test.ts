// import { getFirstDifferentCharIndex } from "../src/features/diagnostics/diagnostics";

import { getFirstDifferentCharIndex } from "./diagnostics";

describe('getFirstDifferentCharIndex', () => {
    test('Okay', () => {
        expect(getFirstDifferentCharIndex("012", "")).toBeUndefined();
        expect(getFirstDifferentCharIndex("012", "0")).toBeUndefined();
        expect(getFirstDifferentCharIndex("012", "01")).toBeUndefined();
        expect(getFirstDifferentCharIndex("012", "012")).toBeUndefined();
        expect(getFirstDifferentCharIndex("agoo", "ago")).toBeUndefined();
    });

    test('Different', () => {
        expect(getFirstDifferentCharIndex("012", "a")).toBe(0);
        expect(getFirstDifferentCharIndex("012", "0a")).toBe(1);
        expect(getFirstDifferentCharIndex("012", "01a")).toBe(2);
        expect(getFirstDifferentCharIndex("012", "012a")).toBe(3);
    });
});
