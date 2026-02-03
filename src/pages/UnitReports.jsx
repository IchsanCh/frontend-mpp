import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import { reportService } from "../services/api";
import Chart from "react-apexcharts";
import ScrollCard from "../components/admin/stats/ScrollCard";
import SummaryCard from "../components/admin/stats/SummaryCard";

export default function UnitReportManagement() {
  const [exporting, setExporting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);

  const formatDate = (date) => date.toLocaleDateString("en-CA");
  const getDefaultDates = () => {
    const today = new Date();

    return {
      start: formatDate(today),
      end: formatDate(today),
    };
  };

  const defaultDates = getDefaultDates();

  const [formData, setFormData] = useState({
    start_date: defaultDates.start,
    end_date: defaultDates.end,
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.start_date.trim()) {
      errors.start_date = "Tanggal mulai wajib diisi";
    }

    if (!formData.end_date.trim()) {
      errors.end_date = "Tanggal akhir wajib diisi";
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);

      if (end < start) {
        errors.end_date = "Tanggal akhir harus lebih besar dari tanggal mulai";
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        errors.end_date = "Rentang tanggal maksimal 1 tahun";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExport = async () => {
    if (!validateForm()) return;

    setExporting(true);
    setDownloadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await reportService.exportUnitVisitors({
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      clearInterval(progressInterval);
      setDownloadProgress(100);

      showToast("Laporan berhasil didownload", "success");

      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    } catch (error) {
      showToast(error.message || "Gagal mengexport laporan", "error");
      setDownloadProgress(0);
    } finally {
      setExporting(false);
    }
  };

  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const fetchStatistics = async () => {
    if (!formData.start_date || !formData.end_date) return;

    setLoading(true);
    try {
      const data = await reportService.getUnitStatistics({
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      setStatisticsData(data);
    } catch (error) {
      showToast(error.message || "Gagal mengambil data statistik", "error");
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [formData.start_date, formData.end_date]);

  const today = new Date().toISOString().split("T")[0];

  const formatDateRange = () => {
    if (!formData.start_date || !formData.end_date) return "Pilih periode";

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    return `${start.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} – ${end.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`;
  };

  const summary = statisticsData?.summary || {
    total_visitors: 0,
    total_layanan: 0,
  };

  const dailyVisitorsRaw = statisticsData?.daily_visitors || [];
  const layananData = statisticsData?.layanan_data || [];

  const formatDateDDMMYY = (iso) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  };

  const dailyVisitors = {
    labels: dailyVisitorsRaw.map((item) => formatDateDDMMYY(item.date)),
    data: dailyVisitorsRaw.map((item) => item.total),
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-base-content">
            Laporan Kunjungan Unit
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Kelola dan export laporan data kunjungan unit Anda
          </p>
        </div>

        <div className="card bg-white shadow-xl border-2 border-[#ceab93]">
          <div className="card-body p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8c6a4b] to-[#ad8b73] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#8c6a4b]">
                  Filter & Export Laporan
                </h2>
                <p className="text-xs md:text-sm text-[#ad8b73]">
                  Pilih rentang tanggal untuk laporan unit
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-[#8c6a4b] flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Tanggal Mulai <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    handleDateChange("start_date", e.target.value)
                  }
                  max={today}
                  className={`input-base input-0 ${
                    formErrors.start_date ? "input-error" : ""
                  }`}
                />
                {formErrors.start_date && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">
                      {formErrors.start_date}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-[#8c6a4b] flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Tanggal Akhir <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleDateChange("end_date", e.target.value)}
                  max={today}
                  min={formData.start_date}
                  className={`input-base input-0 ${
                    formErrors.end_date ? "input-error" : ""
                  }`}
                />
                {formErrors.end_date && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">
                      {formErrors.end_date}
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="alert bg-gradient-to-r from-[rgba(227,202,165,0.3)] to-[rgba(255,251,233,0.3)] border-2 border-[#ceab93] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#8c6a4b]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#ad8b73]">
                  Periode Dipilih:
                </div>
                <div className="text-sm md:text-base font-bold text-[#8c6a4b]">
                  {formatDateRange()}
                </div>
              </div>
            </div>

            {exporting && downloadProgress > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-[rgba(227,202,165,0.3)] to-[rgba(255,251,233,0.3)] rounded-lg border-2 border-[#ad8b73]">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[#8c6a4b]">
                    Progress Export
                  </span>
                  <span className="font-bold text-[#8c6a4b]">
                    {downloadProgress}%
                  </span>
                </div>
                <progress
                  className="progress progress-color-0 w-full h-3"
                  value={downloadProgress}
                  max="100"
                ></progress>
              </div>
            )}

            <button
              onClick={handleExport}
              className="btn w-full bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white hover:from-[#ad8b73] hover:to-[#8c6a4b] border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base h-12 md:h-14"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span className="loading loading-spinner loading-md"></span>
                  <span>Mengexport Laporan...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 md:h-6 md:w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold">Export Laporan (.xls)</span>
                </>
              )}
            </button>

            <div className="alert bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 mt-4">
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
                <span className="font-bold">Info:</span> Rentang tanggal
                maksimal 1 tahun. Format file: Microsoft Excel (.xls)
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="card bg-white shadow-xl border-2 border-[#ceab93] animate-pulse">
            <div className="card-body p-4 md:p-6">
              <div className="h-6 bg-[#e3caa5] rounded w-48 mb-4"></div>
              <div className="h-64 bg-[#ceab93]/20 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="card bg-white shadow-xl border-2 border-[#ceab93]">
            <div className="card-body p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8c6a4b] to-[#ad8b73] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-[#8c6a4b]">
                    Visualisasi Tren Harian
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs md:text-sm text-[#ad8b73]">
                      Total:
                    </span>
                    <span className="badge badge-lg bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white font-bold border-0">
                      {summary.total_visitors}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <Chart
                  type="area"
                  height={window.innerWidth < 768 ? 250 : 320}
                  series={[
                    {
                      name: "Kunjungan",
                      data: dailyVisitors.data,
                    },
                  ]}
                  options={{
                    chart: {
                      toolbar: { show: false },
                      background: "transparent",
                      foreColor: "#8c6a4b",
                      zoom: {
                        enabled: false,
                      },
                    },

                    colors: ["#8c6a4b"],

                    stroke: {
                      curve: "smooth",
                      width: 3,
                    },

                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 0.6,
                        opacityFrom: 0.45,
                        opacityTo: 0.08,
                        stops: [0, 85, 100],
                        colorStops: [
                          {
                            offset: 0,
                            color: "#8c6a4b",
                            opacity: 0.45,
                          },
                          {
                            offset: 100,
                            color: "#e3caa5",
                            opacity: 0.08,
                          },
                        ],
                      },
                    },

                    markers: {
                      size: window.innerWidth < 768 ? 3 : 4,
                      strokeWidth: 2,
                      strokeColors: "#8c6a4b",
                      fillColors: ["#fffbe9"],
                      hover: { size: window.innerWidth < 768 ? 5 : 6 },
                    },

                    grid: {
                      borderColor: "#e3caa5",
                      strokeDashArray: 4,
                    },

                    xaxis: {
                      categories: dailyVisitors.labels,
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                      labels: {
                        style: {
                          colors: "#ad8b73",
                          fontSize: window.innerWidth < 768 ? "10px" : "12px",
                        },
                        rotate: window.innerWidth < 768 ? -45 : 0,
                      },
                    },

                    yaxis: {
                      labels: {
                        style: {
                          colors: "#ad8b73",
                          fontSize: window.innerWidth < 768 ? "10px" : "12px",
                        },
                      },
                    },

                    tooltip: {
                      theme: "light",
                      style: {
                        fontSize: "12px",
                      },
                      y: {
                        formatter: (val) => `${val} pengunjung`,
                      },
                    },

                    dataLabels: {
                      enabled: false,
                    },
                  }}
                />
              </div>
            </div>
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
        )}
      </div>
    </div>
  );
}
