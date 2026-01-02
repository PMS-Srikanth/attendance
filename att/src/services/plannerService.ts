import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api';

export const plannerService = {
  // POST /planner/what-if - Simulate what-if scenario
  simulateWhatIf: async (
    scenario: {
      classes_to_attend?: number;
      classes_to_skip?: number;
      subject_code?: string;
    },
    currentDate?: string
  ): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.post('/planner/what-if', scenario, params);
  },

  // GET /planner/skip-recommendations - Get skip recommendations
  getSkipRecommendations: async (currentDate?: string): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.get('/planner/skip-recommendations', params);
  },

  // GET /planner/summary - Get planner summary
  getPlannerSummary: async (currentDate?: string): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.get('/planner/summary', params);
  },

  // GET /planner/suggestions - Get optimization suggestions
  getOptimizationSuggestions: async (currentDate?: string): Promise<ApiResponse<any>> => {
    const params = currentDate ? { current_date: currentDate } : undefined;
    return apiClient.get('/planner/suggestions', params);
  },
};
