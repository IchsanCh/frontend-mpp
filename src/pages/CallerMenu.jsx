import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { unitService } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL;

export default function CallerMenu() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unitInfo, setUnitInfo] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const unitId = userData.unit_id;

  useEffect(() => {
    if (!unitId) {
      setError("Unit ID tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }
    loadServices();
    const interval = setInterval(() => {
      loadServices();
    }, 60000);
    return () => clearInterval(interval);
  }, [unitId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await unitService.getServicesStatus(unitId);

      if (res.success) {
        setUnitInfo({
          id: res.data.unit_id,
          name: res.data.unit_name,
        });
        const activeServices = (res.data.services || []).filter(
          (s) => s.is_active === "y"
        );
        setServices(activeServices);
        console.log(activeServices);
      }
    } catch (err) {
      console.error("Error loading services:", err);
      setError(err.message || "Gagal memuat data layanan");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service) => {
    navigate(`/admin/caller/services/${service.id}`, {
      state: {
        service,
        unitInfo,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full"></div>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Memuat layanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400">Error</h3>
              <p className="text-slate-300 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadServices}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 px-4 rounded-xl transition-colors border border-red-500/30"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Caller Menu
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                {unitInfo?.name} • Pilih layanan untuk mulai memanggil antrian
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadServices}
                disabled={loading}
                className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-4 py-2 rounded-xl transition-colors border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    loading ? "animate-spin" : "hover:rotate-180"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate(-1)}
                title="Back"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-4 py-2 rounded-xl transition-colors border border-slate-700/50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-10 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700/50 backdrop-blur-sm">
              <svg
                className="w-20 h-20 mx-auto mb-6 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-xl font-semibold text-slate-300 mb-2">
                Tidak ada layanan tersedia
              </p>
              <p className="text-sm text-slate-500">
                Hubungi administrator untuk menambahkan layanan
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const isAvailable = service.status === "available";
              const isUnlimited = service.limits_queue === 0;

              return (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 border-slate-700/50 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 rounded-2xl transition-all duration-300"></div>

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {service.nama_service}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <span>Loket {service.loket}</span>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isAvailable
                            ? isUnlimited
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {isAvailable
                          ? isUnlimited
                            ? "Unlimited"
                            : "Tersedia"
                          : "Tutup"}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
                        <span className="text-sm text-slate-400">
                          Antrian Hari Ini
                        </span>
                        <span className="text-lg font-bold text-white">
                          {service.today_queue_count}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <span className="text-sm text-amber-300 font-medium">
                          Menunggu Dipanggil
                        </span>
                        <span className="text-lg font-bold text-amber-400">
                          {service.waiting_queue_count || 0}
                        </span>
                      </div>

                      {isAvailable && (
                        <div
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            isUnlimited
                              ? "bg-blue-500/10 border-blue-500/30"
                              : "bg-emerald-500/10 border-emerald-500/30"
                          }`}
                        >
                          <span className="text-sm text-slate-300 font-medium">
                            {isUnlimited ? "Kuota" : "Sisa Kuota"}
                          </span>
                          <span className="text-lg font-bold text-white">
                            {isUnlimited ? "∞" : service.remaining_quota}
                          </span>
                        </div>
                      )}

                      {!isAvailable && (
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                          <p className="text-sm text-red-400 font-medium">
                            {service.status_message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isAvailable
                            ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                            : "bg-red-500/10 group-hover:bg-red-500/20"
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 group-hover:translate-x-0.5 transition-transform ${
                            isAvailable ? "text-emerald-400" : "text-red-400"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
