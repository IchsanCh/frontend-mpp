import { useState, useEffect } from "react";
import { authService, configService, backupService } from "../services/api";
import { showToast } from "../utils/toast";

export default function ConfigManagement() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [formData, setFormData] = useState({ text_marque: "" });
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
        setFormData({ text_marque: response.data.text_marque || "" });
      }
    } catch (error) {
      if (error.message.includes("belum")) {
        setHasData(false);
        setFormData({ text_marque: "" });
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.text_marque.trim()) {
      errors.text_marque = "Text marquee wajib diisi";
    } else if (formData.text_marque.length > 255) {
      errors.text_marque = "Text marquee maksimal 255 karakter";
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
      setTimeout(() => setDownloadProgress(0), 2000);
    } catch (error) {
      showToast(error.message || "Gagal melakukan backup database", "error");
      setDownloadProgress(0);
    } finally {
      setBacking(false);
    }
  };

  const handleTextMarqueChange = (value) => {
    if (value.length <= 255) setFormData({ ...formData, text_marque: value });
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
          Atur text marquee yang ditampilkan pada layar antrian
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
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

      <div className="alert alert-info mb-4">
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
            Text marquee akan ditampilkan sebagai informasi berjalan pada layar
            antrian. Untuk mengatur jam operasional per unit, gunakan menu{" "}
            <strong>Jam Operasional</strong>.
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="form-control">
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
            <div className="flex justify-between mt-1">
              <span className="text-base-content/70 text-xs">
                Text ini akan ditampilkan sebagai informasi berjalan pada layar
                antrian
              </span>
              <span
                className={`text-xs ${
                  remainingChars < 50 ? "text-warning" : "text-base-content/70"
                } ${remainingChars === 0 ? "text-error font-semibold" : ""}`}
              >
                {remainingChars} karakter tersisa
              </span>
            </div>
            {formErrors.text_marque && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {formErrors.text_marque}
                </span>
              </label>
            )}
          </div>

          {isSuperUser && (
            <div className="card-actions justify-end mt-6">
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
                  <>{hasData ? "Update Konfigurasi" : "Simpan Konfigurasi"}</>
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

      {hasData && formData.text_marque && (
        <div className="card bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title text-lg">Preview Text Marquee</h2>
            <div className="mt-2 p-4 bg-base-100 rounded-lg border-2 border-info shadow-lg overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-lg font-medium text-info">
                {formData.text_marque}
              </div>
            </div>
          </div>
        </div>
      )}

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
