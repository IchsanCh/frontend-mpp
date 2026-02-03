import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import { dashboardService, authService } from "../services/api";
import SummaryCard from "../components/admin/stats/SummaryCard";
import ScrollCard from "../components/admin/stats/ScrollCard";

export default function UnitDashboard() {
  const user = authService.getUser();
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getUnitStatistics();
      setStatisticsData(data);
    } catch (error) {
      showToast(error.message || "Gagal mengambil data dashboard", "error");
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loginMessage = sessionStorage.getItem("loginMessage");
    if (loginMessage) {
      sessionStorage.removeItem("loginMessage");
      setTimeout(() => {
        showToast(loginMessage, "success");
      }, 300);
    }
  }, []);

  const summary = statisticsData?.summary || {
    total_visitors: 0,
    total_served: 0,
    total_skipped: 0,
  };

  const layananData = statisticsData?.layanan_data || [];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-[#8c6a4b]">
            Dashboard Unit
          </h1>
          <p className="text-sm md:text-base text-[#ad8b73] mt-1">
            Selamat datang,{" "}
            <span className="font-semibold">{user?.nama || "Pengguna"}</span>
          </p>
        </div>

        <div className="card bg-gradient-to-r from-[#fffbe9] to-[rgba(227,202,165,0.3)] border-2 border-[#ceab93] shadow-md">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8c6a4b] to-[#ad8b73] flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#ad8b73]">
                  Data Kunjungan
                </div>
                <div className="text-base md:text-lg font-bold text-[#8c6a4b]">
                  Hari Ini
                </div>
              </div>
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="btn btn-sm bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white border-0 hover:from-[#ad8b73] hover:to-[#8c6a4b]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden md:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="card bg-white shadow-lg border-2 border-[#ceab93] animate-pulse"
              >
                <div className="card-body p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-[#e3caa5] rounded w-24 mb-2"></div>
                      <div className="h-8 bg-[#ceab93] rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#e3caa5]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Kunjungan"
              value={summary.total_visitors}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              }
              gradient="from-[#8c6a4b] to-[#ad8b73]"
            />
            <SummaryCard
              title="Total Dilayani"
              value={summary.total_served}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              gradient="from-[#ad8b73] to-[#ceab93]"
            />
            <SummaryCard
              title="Total Skip"
              value={summary.total_skipped}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              gradient="from-[#ceab93] to-[#e3caa5]"
            />
          </div>
        )}

        {loading ? (
          <div className="card bg-white shadow-xl border-2 border-[#ceab93] animate-pulse">
            <div className="card-body p-4 md:p-6">
              <div className="h-6 bg-[#e3caa5] rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="h-12 bg-[rgba(206,171,147,0.2)] rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <ScrollCard
              title="Layanan Terpopuler Hari Ini"
              data={layananData}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        )}

        <div className="alert bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-blue-600 shrink-0 w-5 h-5 md:w-6 md:h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-xs md:text-sm text-blue-800">
            <span className="font-bold">Info:</span> Data diperbarui otomatis
            setiap 60 detik. Klik tombol refresh untuk update manual.
          </div>
        </div>
      </div>
    </div>
  );
}
