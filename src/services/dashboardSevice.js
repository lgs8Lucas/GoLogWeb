import { apiClient } from "./apiClient";

export const dashboardService = {
    getAll: async () => {
        const response = await apiClient.get('/dashboard/metrics');
        return response.data;
    }
};