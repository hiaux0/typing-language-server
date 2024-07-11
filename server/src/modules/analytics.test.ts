import { AnalyticsMap } from "../types/types";
import { updateAnalytics } from "./analytics";

const testAnalyticsMap: AnalyticsMap = {}

describe('analytics', () => {
    test('updateAnalytics', () => {
        updateAnalytics(testAnalyticsMap, 'wrong', 'whong')
    });
});
