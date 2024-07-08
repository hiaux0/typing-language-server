import { getWordAtIndex } from "./string";

describe('String', () => {
    test.only('getWordAtIndex', () => {
        expect(getWordAtIndex('012 456 89', 0)).toBe("012");
        expect(getWordAtIndex('012 456 89', 1)).toBe("012");
        expect(getWordAtIndex('012 456 89', 2)).toBe("012");
        expect(getWordAtIndex('012 456 89', 3)).toBeUndefined();
        expect(getWordAtIndex('012 456 89', 4)).toBe("456");
        expect(getWordAtIndex('012 456 89', 5)).toBe("456");
        expect(getWordAtIndex('012 456 89', 6)).toBe("456");
        expect(getWordAtIndex('012 456 89', 7)).toBeUndefined();
        expect(getWordAtIndex('012 456 89', 8)).toBe("89");
        expect(getWordAtIndex('012 456 89', 9)).toBe("89");
        expect(getWordAtIndex('012 456 89', 10)).toBeUndefined();
    });
});
