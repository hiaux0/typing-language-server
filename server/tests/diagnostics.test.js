"use strict";
// import { getFirstDifferentCharIndex } from "../src/features/diagnostics/diagnostics";
Object.defineProperty(exports, "__esModule", { value: true });
const diagnostics_1 = require("../src/features/diagnostics/diagnostics");
describe('getFirstDifferentCharIndex', () => {
    test('Okay', () => {
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "")).toBeUndefined();
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "0")).toBeUndefined();
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "01")).toBeUndefined();
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "012")).toBeUndefined();
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "0123")).toBeUndefined();
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("agoo", "ago")).toBeUndefined();
    });
    test('Different', () => {
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "a")).toBe(0);
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "0a")).toBe(1);
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "01a")).toBe(2);
        expect((0, diagnostics_1.getFirstDifferentCharIndex)("012", "012a")).toBeUndefined();
    });
});
//# sourceMappingURL=diagnostics.test.js.map