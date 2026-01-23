import { Search } from "lucide-react";

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
  logout: async () => {
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
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
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

  logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export const queueService = {
  async takeQueue(unitId, serviceId) {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/api/queue/take`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ unit_id: unitId, service_id: serviceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil nomor antrian");
    }

    return data;
  },

  async getServiceQueue(unitId, serviceId) {
    const token = authService.getToken();
    const response = await fetch(
      `${API_URL}/api/queue/unit/${unitId}/service/${serviceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data antrian");
    }

    return data;
  },

  async getGlobalQueue() {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/api/queue/global`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data antrian global");
    }

    return data;
  },
};
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
