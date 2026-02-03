const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9080";

export const authService = {
  async login(email, password, recaptchaToken) {
    const response = await fetch(`${API_URL}/san/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        recaptcha_token: recaptchaToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login gagal");
    }

    return data;
  },

  saveToken(token) {
    sessionStorage.setItem("token", token);
  },

  saveUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  },

  getToken() {
    return sessionStorage.getItem("token");
  },

  getUser() {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  async logout() {
    const token = sessionStorage.getItem("token");

    try {
      if (token) {
        await fetch(`${API_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Force refresh untuk reset semua state
      window.location.href = "/san/login";
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

// export const queueService = {
//   async takeQueue(unitId, serviceId) {
//     const token = authService.getToken();
//     const response = await fetch(`${API_URL}/api/queue/take`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ unit_id: unitId, service_id: serviceId }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Gagal mengambil nomor antrian");
//     }

//     return data;
//   },

//   async getServiceQueue(unitId, serviceId) {
//     const token = authService.getToken();
//     const response = await fetch(
//       `${API_URL}/api/queue/unit/${unitId}/service/${serviceId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Gagal mengambil data antrian");
//     }

//     return data;
//   },

//   async getGlobalQueue() {
//     const token = authService.getToken();
//     const response = await fetch(`${API_URL}/api/queue/global`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Gagal mengambil data antrian global");
//     }

//     return data;
//   },
// };
export const unitService = {
  /**
   * Get all units with pagination
   * @param {Object} params - { isActive, page, limit }
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getAll(params = {}) {
    const token = authService.getToken();

    const queryParams = new URLSearchParams();

    if (params.isActive) {
      queryParams.append("is_active", params.isActive);
    }
    if (params.search) {
      queryParams.append("search", params.search);
    }
    if (params.page) {
      queryParams.append("page", params.page);
    }
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/units/paginate${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data unit");
    }
    return data;
  },

  /**
   * Get unit by ID
   * @param {number|string} id - Unit ID
   */
  async getById(id) {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/api/units/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data unit");
    }
    return data;
  },

  /**
   * Create new unit
   * @param {Object} unitData - { code, nama_unit, is_active }
   */
  async create(unitData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/units`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...unitData,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal membuat unit");
    }
    return data;
  },

  /**
   * Update unit
   * @param {number|string} id - Unit ID
   * @param {Object} unitData - { code?, nama_unit?, is_active? }
   */
  async update(id, unitData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/units/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...unitData,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengupdate unit");
    }
    return data;
  },

  /**
   * Soft delete unit (set is_active to 'n')
   * @param {number|string} id - Unit ID
   */
  async delete(id) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/units/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal menghapus unit");
    }
    return data;
  },

  /**
   * Hard delete unit (permanent deletion)
   * @param {number|string} id - Unit ID
   */
  async hardDelete(id) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/units/${id}/permanent`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal menghapus unit permanent");
    }
    return data;
  },
  async getServicesStatus(unitId) {
    const token = authService.getToken();

    const url = `${API_URL}/api/services/unit/status?unit_id=${unitId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil status layanan");
    }

    return data;
  },
};
export const configService = {
  /**
   * Get config
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async get() {
    const response = await fetch(`${API_URL}/api/config`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil konfigurasi");
    }

    return data;
  },

  /**
   * Create config
   * @param {Object} configData - { jam_buka, jam_tutup }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async create(configData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...configData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal membuat konfigurasi");
    }

    return data;
  },

  /**
   * Update config
   * @param {Object} configData - { jam_buka, jam_tutup }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async update(configData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...configData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengupdate konfigurasi");
    }

    return data;
  },
};
export const userService = {
  async getAll(params = {}) {
    const token = authService.getToken();
    const queryParams = new URLSearchParams();

    if (params.isBanned) queryParams.append("is_banned", params.isBanned);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/users/paginate${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Gagal mengambil data user");
    return data;
  },

  async getById(id) {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Gagal mengambil data user");
    return data;
  },

  async create(userData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...userData,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Gagal membuat user");
    return data;
  },

  async update(id, userData) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        ...userData,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Gagal mengupdate user");
    return data;
  },

  async hardDelete(id) {
    const token = authService.getToken();
    const user = authService.getUser();

    const response = await fetch(`${API_URL}/api/users/${id}/permanent`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
      }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Gagal menghapus user permanent");
    return data;
  },
};
export const serviceService = {
  async getAll(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.isActive) queryParams.append("is_active", params.isActive);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(
      `${API_URL}/api/services/paginate?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal mengambil data layanan"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal mengambil data layanan`);
    }

    return response.json();
  },

  async create(data) {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal membuat layanan"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal membuat layanan`);
    }

    return response.json();
  },

  async update(id, data) {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal mengupdate layanan"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal mengupdate layanan`);
    }

    return response.json();
  },

  async hardDelete(id) {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/services/${id}/permanent`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal menghapus layanan"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal menghapus layanan`);
    }

    return response.json();
  },
};
export const queueService = {
  take: async (data) => {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/queue/take`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal mengambil antrian"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal mengambil antrian`);
    }

    return response.json();
  },

  getServiceQueue: async (unitId, serviceId) => {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(
      `${API_URL}/api/queue/unit/${unitId}/service/${serviceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal mengambil data antrian"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal mengambil data antrian`);
    }

    return response.json();
  },

  getGlobalQueue: async () => {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/queue/global`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal mengambil data antrian global"
        );
      }
      throw new Error(
        `HTTP ${response.status}: Gagal mengambil data antrian global`
      );
    }

    return response.json();
  },
  callNext: async (data, token) => {
    const response = await fetch(`${API_URL}/api/queue/call-next`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal memanggil antrian"
        );
      }
      throw new Error(`HTTP ${response.status}: Gagal memanggil antrian`);
    }

    return response.json();
  },

  // Skip and call next
  skipAndNext: async (data, token) => {
    const response = await fetch(`${API_URL}/api/queue/skip-and-next`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal skip dan panggil berikutnya"
        );
      }
      throw new Error(
        `HTTP ${response.status}: Gagal skip dan panggil berikutnya`
      );
    }

    return response.json();
  },

  // Recall queue
  recall: async (ticketId, token) => {
    const response = await fetch(`${API_URL}/api/queue/recall/${ticketId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Gagal recall antrian");
      }
      throw new Error(`HTTP ${response.status}: Gagal recall antrian`);
    }

    return response.json();
  },
};

export const audioService = {
  /**
   * Get all audios
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getAll() {
    const response = await fetch(`${API_URL}/api/audio`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data audio");
    }
    return data;
  },

  /**
   * Create new audio (upload)
   * @param {FormData} formData - FormData containing: file, tts_text, nama_audio
   */
  async create(formData) {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/audio`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData, // Jangan set Content-Type, biarkan browser yang set otomatis untuk multipart/form-data
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengupload audio");
    }
    return data;
  },

  /**
   * Delete audio
   * @param {number|string} id - Audio ID
   */
  async delete(id) {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/audio/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal menghapus audio");
    }
    return data;
  },

  /**
   * Get audio file URL
   * @param {string} filename - Audio filename (e.g., "satu.mp3")
   * @returns {string} Full URL to audio file
   */
  getAudioUrl(filename) {
    return `${API_URL}/audio/${filename}`;
  },
};
export const backupService = {
  async exportDatabase() {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Token tidak ditemukan, silakan login kembali");
    }

    const response = await fetch(`${API_URL}/api/backup/database`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Gagal melakukan backup database"
        );
      }
      throw new Error(
        `HTTP ${response.status}: Gagal melakukan backup database`
      );
    }

    // Fix: Better filename parsing from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `backup-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.sql`;

    if (contentDisposition) {
      // Try to match: filename="backup-20250201-150405.sql"
      const filenameRegex = /filename[^;=\n]*=["']?([^"';\n]+)["']?/i;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1].trim().replace(/['"]/g, "");
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    return { success: true, filename };
  },
};
export const reportService = {
  async exportVisitors(params) {
    const { start_date, end_date, include_services } = params;

    const queryParams = new URLSearchParams({
      start_date,
      end_date,
      include_services: include_services.toString(),
    });

    const response = await fetch(
      `${API_URL}/api/reports/visitors/export?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengexport laporan");
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "laporan_kunjungan.xls";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },
  async getStatistics(params) {
    const { start_date, end_date } = params;

    const queryParams = new URLSearchParams({
      start_date,
      end_date,
    });

    const response = await fetch(
      `${API_URL}/api/reports/visitors/statistics?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengambil data statistik");
    }

    const result = await response.json();
    return result.data;
  },
  async exportUnitVisitors(params) {
    const { start_date, end_date } = params;

    const queryParams = new URLSearchParams({
      start_date,
      end_date,
    });

    const response = await fetch(
      `${API_URL}/api/reports/unit/visitors/export?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengexport laporan");
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "laporan_kunjungan_unit.xls";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },

  async getUnitStatistics(params) {
    const { start_date, end_date } = params;

    const queryParams = new URLSearchParams({
      start_date,
      end_date,
    });

    const response = await fetch(
      `${API_URL}/api/reports/unit/visitors/statistics?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengambil data statistik");
    }

    const result = await response.json();
    return result.data;
  },
};
export const dashboardService = {
  // Untuk Super User Dashboard
  async getSuperUserStatistics(params) {
    const { start_date, end_date } = params;

    const queryParams = new URLSearchParams({
      start_date,
      end_date,
    });

    const response = await fetch(
      `${API_URL}/api/reports/visitors/statistics?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengambil data statistik");
    }

    const result = await response.json();
    return result.data;
  },

  // Untuk Unit Dashboard (hari ini saja, auto-filtered by unit_id)
  async getUnitStatistics() {
    const response = await fetch(`${API_URL}/api/dashboard/unit/statistics`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengambil data dashboard");
    }

    const result = await response.json();
    return result.data;
  },
};
