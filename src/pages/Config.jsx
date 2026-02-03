import { useState, useEffect } from "react";
import { authService, configService, backupService } from "../services/api";
import { showToast } from "../utils/toast";
import TimePicker from "../components/Flatpickr";

export default function ConfigManagement() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [formData, setFormData] = useState({
    jam_buka: "",
    jam_tutup: "",
    text_marque: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await configService.get();

      if (response.success && response.data) {
        setHasData(true);
        setConfigId(response.data.id);
        setFormData({
          jam_buka: response.data.jam_buka || "",
          jam_tutup: response.data.jam_tutup || "",
          text_marque: response.data.text_marque || "",
        });
      }
    } catch (error) {
      if (error.message.includes("belum")) {
        setHasData(false);
        setFormData({
          jam_buka: "",
          jam_tutup: "",
          text_marque: "",
        });
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.jam_buka.trim()) {
      errors.jam_buka = "Jam buka wajib diisi";
    } else if (
      !/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(formData.jam_buka)
    ) {
      errors.jam_buka = "Format waktu harus HH:MM:SS (contoh: 08:00:00)";
    }

    if (!formData.jam_tutup.trim()) {
      errors.jam_tutup = "Jam tutup wajib diisi";
    } else if (
      !/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(formData.jam_tutup)
    ) {
      errors.jam_tutup = "Format waktu harus HH:MM:SS (contoh: 17:00:00)";
    }

    if (!formData.text_marque.trim()) {
      errors.text_marque = "Text marquee wajib diisi";
    } else if (formData.text_marque.length > 255) {
      errors.text_marque = "Text marquee maksimal 255 karakter";
    }

    if (
      formData.jam_buka &&
      formData.jam_tutup &&
      !errors.jam_buka &&
      !errors.jam_tutup
    ) {
      if (formData.jam_tutup <= formData.jam_buka) {
        errors.jam_tutup = "Jam tutup harus lebih besar dari jam buka";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (hasData) {
        await configService.update(formData);
        showToast("Konfigurasi berhasil diupdate");
      } else {
        await configService.create(formData);
        showToast("Konfigurasi berhasil dibuat");
        setHasData(true);
      }

      fetchConfig();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDatabase = async () => {
    setBacking(true);
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

      await backupService.exportDatabase();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      showToast("Backup database berhasil didownload", "success");

      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    } catch (error) {
      showToast(error.message || "Gagal melakukan backup database", "error");
      setDownloadProgress(0);
    } finally {
      setBacking(false);
    }
  };

  const handleTimeInput = (field, value) => {
    let formatted = value.replace(/[^0-9:]/g, "");

    if (formatted.length === 2 && !formatted.includes(":")) {
      formatted += ":";
    } else if (formatted.length === 5 && formatted.split(":").length === 2) {
      formatted += ":";
    }

    setFormData({ ...formData, [field]: formatted });
  };

  const handleTextMarqueChange = (value) => {
    if (value.length <= 255) {
      setFormData({ ...formData, text_marque: value });
    }
  };

  const remainingChars = 255 - formData.text_marque.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-base-content">
          Konfigurasi Sistem
        </h1>
        <p className="text-sm text-base-content/80 mt-2">
          Atur jam operasional pelayanan antrian dan text marquee
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {hasData ? (
            <span className="badge badge-success font-semibold gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Sudah Dikonfigurasi
            </span>
          ) : (
            <span className="badge badge-warning gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Belum Dikonfigurasi
            </span>
          )}
        </div>
      </div>

      <div className="alert alert-info mt-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-bold">Informasi</h3>
          <div className="text-sm">
            Jam operasional ini akan digunakan untuk mengatur ketersediaan
            layanan antrian. Pastikan jam tutup lebih besar dari jam buka. Text
            marquee akan ditampilkan sebagai informasi berjalan pada layar
            antrian.
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mt-2 shadow-xl">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-black mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline-block mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Jam Buka <span className="text-error">*</span>
                </span>
              </label>
              <TimePicker
                value={formData.jam_buka}
                placeholder="08:00:00"
                disabled={!isSuperUser}
                error={formErrors.jam_buka}
                onChange={(value) => handleTimeInput("jam_buka", value)}
              />
              <label className="">
                <span className="text-base-content/70 text-xs">
                  Format: HH:MM:SS (contoh: 08:00:00)
                </span>
              </label>
            </div>

            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-semibold text-black mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline-block mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Jam Tutup <span className="text-error">*</span>
                </span>
              </label>
              <TimePicker
                value={formData.jam_tutup}
                placeholder="17:00:00"
                disabled={!isSuperUser}
                error={formErrors.jam_tutup}
                onChange={(value) => handleTimeInput("jam_tutup", value)}
              />
              <label className="">
                <span className="text-base-content/70 text-xs">
                  Format: HH:MM:SS (contoh: 17:00:00)
                </span>
              </label>
            </div>
          </div>

          <div className="form-control mt-6">
            <label className="label">
              <span className="label-text font-semibold text-black mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Text Marquee <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              value={formData.text_marque}
              onChange={(e) => handleTextMarqueChange(e.target.value)}
              placeholder="Masukkan text yang akan ditampilkan pada marquee..."
              disabled={!isSuperUser}
              className={`input-base input-0 w-full h-24 ${
                formErrors.text_marque ? "textarea-error" : ""
              }`}
              maxLength={255}
            />
            <label className="">
              <span className="text-base-content/70">
                Text ini akan ditampilkan sebagai informasi berjalan pada layar
                antrian
              </span>
              <span
                className={`label-text-alt ${
                  remainingChars < 50 ? "text-warning" : "text-base-content/70"
                } ${remainingChars === 0 ? "text-error font-semibold" : ""}`}
              >
                {remainingChars} karakter tersisa
              </span>
            </label>
            {formErrors.text_marque && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {formErrors.text_marque}
                </span>
              </label>
            )}
          </div>

          {isSuperUser && (
            <div className="card-actions justify-end mt-8">
              <button
                onClick={handleSubmit}
                className="btn bg-0 text-white hover:bg-3 hover:text-black hover:border hover:border-black transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    {hasData ? "Update Konfigurasi" : "Simpan Konfigurasi"}
                  </>
                )}
              </button>
            </div>
          )}

          {!isSuperUser && (
            <div className="alert alert-warning mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Anda tidak memiliki akses untuk mengubah konfigurasi. Hanya
                Super User yang dapat melakukan perubahan.
              </span>
            </div>
          )}
        </div>
      </div>

      {isSuperUser && (
        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
              Backup Database
            </h2>
            <p className="text-sm text-base-content/70 mt-2">
              Download backup database dalam format SQL. File backup akan
              mencakup seluruh data sistem antrian.
            </p>

            {backing && downloadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress Download</span>
                  <span className="font-semibold">{downloadProgress}%</span>
                </div>
                <progress
                  className="progress color-0 w-full"
                  value={downloadProgress}
                  max="100"
                ></progress>
              </div>
            )}

            <div className="card-actions justify-end mt-4">
              <button
                onClick={handleBackupDatabase}
                className="btn bg-0 text-white hover:bg-3 hover:text-black hover:border hover:border-black transition-all duration-200 shadow-lg hover:shadow-xl gap-2"
                disabled={backing}
              >
                {backing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Memproses Backup...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download Backup Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasData && (
        <div className="card bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Preview Konfigurasi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="stat bg-base-100 rounded-lg border-2 border-warning shadow-lg">
                <div className="stat-figure text-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="stat-title font-bold text-black">Jam Buka</div>
                <div className="stat-value text-warning text-3xl">
                  {formData.jam_buka}
                </div>
              </div>

              <div className="stat bg-base-100 rounded-lg border-2 border-neutral shadow-lg">
                <div className="stat-figure text-neutral">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </div>
                <div className="stat-title font-bold text-black">Jam Tutup</div>
                <div className="stat-value text-neutral text-3xl">
                  {formData.jam_tutup}
                </div>
              </div>
            </div>

            {formData.text_marque && (
              <div className="mt-4 p-4 bg-base-100 rounded-lg border-2 border-info shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-info"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold text-black">Text Marquee:</span>
                </div>
                <div className="overflow-hidden">
                  <div className="animate-marquee whitespace-nowrap text-lg font-medium text-info">
                    {formData.text_marque}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
