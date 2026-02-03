import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import { reportService, authService } from "../services/api";
import SummaryCard from "../components/admin/stats/SummaryCard";
import ScrollCard from "../components/admin/stats/ScrollCard";

export default function Dashboard() {
  const user = authService.getUser();
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [activePeriod, setActivePeriod] = useState("today");

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPeriodDates = (period) => {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = endDate = formatDate(today);
        break;
      case "weekly":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        startDate = formatDate(weekAgo);
        endDate = formatDate(today);
        break;
      case "monthly":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = formatDate(monthStart);
        endDate = formatDate(today);
        break;
      default:
        startDate = endDate = formatDate(today);
    }

    return { startDate, endDate };
  };

  const fetchDashboard = async (period) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      const data = await reportService.getStatistics({
        start_date: startDate,
        end_date: endDate,
      });
      setStatisticsData(data);
    } catch (error) {
      showToast(error.message || "Gagal mengambil data dashboard", "error");
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(activePeriod);
  }, [activePeriod]);

  useEffect(() => {
    const loginMessage = sessionStorage.getItem("loginMessage");
    if (loginMessage) {
      sessionStorage.removeItem("loginMessage");
      setTimeout(() => {
        showToast(loginMessage, "success");
      }, 300);
    }
  }, []);

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  const getPeriodLabel = () => {
    switch (activePeriod) {
      case "today":
        return "Hari Ini";
      case "weekly":
        return "7 Hari Terakhir";
      case "monthly":
        return "Bulan Ini";
      default:
        return "Hari Ini";
    }
  };

  const summary = statisticsData?.summary || {
    total_visitors: 0,
    total_instansi: 0,
    total_layanan: 0,
  };

  const instansiData = statisticsData?.instansi_data || [];
  const layananData = statisticsData?.layanan_data || [];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-[#8c6a4b]">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-[#ad8b73] mt-1">
              Selamat datang,{" "}
              <span className="font-semibold">{user?.nama || "Pengguna"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-lg border-2 border-[#ceab93] w-full md:w-auto">
            <button
              onClick={() => handlePeriodChange("today")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activePeriod === "today"
                  ? "bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white shadow-md"
                  : "text-[#ad8b73] hover:bg-[#fffbe9]"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handlePeriodChange("weekly")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activePeriod === "weekly"
                  ? "bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white shadow-md"
                  : "text-[#ad8b73] hover:bg-[#fffbe9]"
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => handlePeriodChange("monthly")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activePeriod === "monthly"
                  ? "bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white shadow-md"
                  : "text-[#ad8b73] hover:bg-[#fffbe9]"
              }`}
            >
              Bulan Ini
            </button>
          </div>
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
                  Periode yang Ditampilkan
                </div>
                <div className="text-base md:text-lg font-bold text-[#8c6a4b]">
                  {getPeriodLabel()}
                </div>
              </div>
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
              title="Total Instansi"
              value={summary.total_instansi}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              gradient="from-[#ad8b73] to-[#ceab93]"
            />
            <SummaryCard
              title="Total Layanan"
              value={summary.total_layanan}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
              gradient="from-[#ceab93] to-[#e3caa5]"
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="card bg-white shadow-xl border-2 border-[#ceab93] animate-pulse"
              >
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
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <ScrollCard
              title="Instansi Terpopuler"
              data={instansiData}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <ScrollCard
              title="Layanan Terpopuler"
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
      </div>
    </div>
  );
}
