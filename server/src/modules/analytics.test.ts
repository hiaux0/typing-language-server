import { AnalyticsMap } from "../types/types";
import { updateAnalytics } from "./analytics";

const testAnalyticsMap: AnalyticsMap = new Map();

describe('analytics', () => {
    test('updateAnalytics', () => {
        updateAnalytics(testAnalyticsMap, 'wrong', 'whong')
    });
});
