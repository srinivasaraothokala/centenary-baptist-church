import { API_BASE } from '../apiConfig.js';
/**
 * Service to handle First Time Visitor form submissions.
 * This is currently a mock service that simulates an API call.
 */
export const visitorService = {
  /**
   * Submits visitor data to the backend.
   * @param {Object} data - The visitor data
   * @returns {Promise<Object>} Resolves when submission is successful
   */
  async submitVisitor(data) {
    console.log('[VisitorService] Submitting new visitor:', data);
    try {
      const response = await fetch(`${API_BASE}/visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('[VisitorService] Error:', error);
      throw error;
    }
  }
};
