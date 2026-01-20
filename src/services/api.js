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
