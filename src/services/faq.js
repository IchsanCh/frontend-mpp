const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9080";

export const faqPublic = {
  /**
   * Get all active FAQs (Public)
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getAllPublic() {
    const response = await fetch(`${API_URL}/api/faqs`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data FAQ");
    }
    return data;
  },
};
