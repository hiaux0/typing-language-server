import { TypingAnalyticsMap } from "../types/types";
import { updateAnalytics } from "./analytics";

const testAnalyticsMap: TypingAnalyticsMap = {}

describe('analytics', () => {
    test('updateAnalytics', () => {
        updateAnalytics(testAnalyticsMap, 'wrong', 'whong')
    });
});
