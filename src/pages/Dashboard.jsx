import { useEffect } from "react";
import { authService } from "../services/api";

export default function Dashboard() {
  const user = authService.getUser();

  useEffect(() => {
    // Ambil pesan dari backend
    const loginMessage = sessionStorage.getItem("loginMessage");

    if (loginMessage) {
      // Hapus setelah dibaca
      sessionStorage.removeItem("loginMessage");

      // Tampilkan toast dengan pesan dari backend
      setTimeout(() => {
        showToast(loginMessage);
      }, 300);
    }
  }, []);

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast toast-top toast-end z-50";
    toast.innerHTML = `
      <div class="alert alert-success shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="font-semibold">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove setelah 4 detik
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Dashboard Antrian
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          Selamat datang, {user?.nama || "Pengguna"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Antrian</div>
            <div className="stat-value text-primary">150</div>
            <div className="stat-desc">Hari ini</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Sedang Dilayani</div>
            <div className="stat-value text-secondary">12</div>
            <div className="stat-desc">Aktif sekarang</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Selesai</div>
            <div className="stat-value text-success">138</div>
            <div className="stat-desc">Dari total hari ini</div>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Informasi User</h2>
          <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
