import { useState, useEffect } from "react";
import { authService, audioService } from "../services/api";

export default function AudioManagement() {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    tts_text: "",
    nama_audio: "",
    file: null,
  });
  const [deletingAudio, setDeletingAudio] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";

  useEffect(() => {
    fetchAudios();
  }, []);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);

  const fetchAudios = async () => {
    setLoading(true);
    try {
      const response = await audioService.getAll();
      setAudios(response.data || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = "toast toast-top toast-end z-50";

    const alertClass = type === "error" ? "alert-error" : "alert-success";
    const iconPath =
      type === "error"
        ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";

    toast.innerHTML = `
      <div class="alert ${alertClass} shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
        </svg>
        <div>
          <div class="font-semibold">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.tts_text.trim()) {
      errors.tts_text = "Deskripsi audio wajib diisi";
    }

    if (!formData.nama_audio.trim()) {
      errors.nama_audio = "Nama audio wajib diisi";
    } else if (
      !/^[a-z0-9_-]+$/i.test(formData.nama_audio.replace(/\.mp3$/i, ""))
    ) {
      errors.nama_audio =
        "Nama audio hanya boleh huruf, angka, underscore, dan dash";
    }

    if (!formData.file) {
      errors.file = "File audio wajib diupload";
    } else {
      const maxSize = 5 * 1024 * 1024;
      if (formData.file.size > maxSize) {
        errors.file = "Ukuran file maksimal 5MB";
      }

      const validTypes = ["audio/mpeg", "audio/mp3"];
      const fileExt = formData.file.name.split(".").pop().toLowerCase();
      if (!validTypes.includes(formData.file.type) && fileExt !== "mp3") {
        errors.file = "File harus berformat MP3";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("tts_text", formData.tts_text);
      formDataToSend.append("nama_audio", formData.nama_audio);
      formDataToSend.append("file", formData.file);

      await audioService.create(formDataToSend);
      showToast("Audio berhasil diupload");
      setShowCreateModal(false);
      resetForm();
      fetchAudios();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (audio) => {
    if (currentlyPlaying === audio.id) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setCurrentlyPlaying(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.onended = null;
      audioElement.onerror = null;
      audioElement.oncanplay = null;
      audioElement.src = "";
    }

    const newAudio = new Audio(
      `${import.meta.env.VITE_API_URL}/audio/${audio.nama_audio}`
    );

    newAudio.onended = () => {
      setCurrentlyPlaying(null);
    };

    newAudio.onerror = (e) => {
      console.error("Audio error:", e);
      if (newAudio.error && newAudio.error.code !== 0) {
        showToast("Gagal memutar audio", "error");
        setCurrentlyPlaying(null);
      }
    };

    newAudio.oncanplay = () => {
      setCurrentlyPlaying(audio.id);
    };

    newAudio
      .play()
      .then(() => {
        setAudioElement(newAudio);
      })
      .catch((err) => {
        console.error("Play error:", err);
        showToast("Gagal memutar audio: " + err.message, "error");
        setCurrentlyPlaying(null);
      });
  };

  const handleDelete = (audio) => {
    setDeletingAudio(audio);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await audioService.delete(deletingAudio.id);
      showToast("Audio berhasil dihapus");
      setShowDeleteModal(false);
      setDeletingAudio(null);
      fetchAudios();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tts_text: "",
      nama_audio: "",
      file: null,
    });
    setFormErrors({});
    const fileInput = document.getElementById("audio-file-input");
    if (fileInput) fileInput.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const filteredAudios = audios.filter((audio) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      audio.nama_audio.toLowerCase().includes(searchLower) ||
      audio.tts_text.toLowerCase().includes(searchLower)
    );
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Management Audio TTS
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          Kelola file audio untuk text-to-speech antrian
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Cari nama atau deskripsi audio..."
                className="input-base input-0 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isSuperUser && (
              <button
                className="btn bg-0 text-white hover:bg-3 hover:text-black hover:border hover:border-black transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => setShowCreateModal(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Upload Audio
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="min-w-[30px]">No</th>
                  <th className="min-w-[150px]">Nama File</th>
                  <th className="min-w-[200px]">Deskripsi</th>
                  <th className="min-w-[130px]">Dibuat</th>
                  {isSuperUser && <th className="text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 5 : 4}
                      className="text-center py-8"
                    >
                      <span className="loading loading-spinner loading-lg"></span>
                    </td>
                  </tr>
                ) : filteredAudios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 5 : 4}
                      className="text-center py-8 text-base-content/70"
                    >
                      Tidak ada data audio
                    </td>
                  </tr>
                ) : (
                  filteredAudios.map((audio, index) => (
                    <tr key={audio.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-primary"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-mono font-semibold">
                            {audio.nama_audio}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          className="max-w-xs truncate"
                          title={audio.tts_text}
                        >
                          {audio.tts_text}
                        </div>
                      </td>
                      <td>
                        {new Date(audio.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>
                      {isSuperUser && (
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              className={`btn btn-sm ${
                                currentlyPlaying === audio.id
                                  ? "btn-warning"
                                  : "btn-success"
                              }`}
                              onClick={() => handlePlay(audio)}
                              title={
                                currentlyPlaying === audio.id
                                  ? "Stop"
                                  : "Play Audio"
                              }
                            >
                              {currentlyPlaying === audio.id ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => handleDelete(audio)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">
                Upload Audio Baru
              </h3>
              <p className="text-xs text-base-content/80">
                Upload file audio MP3 untuk sistem antrian
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Nama Audio <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: satu atau sepuluh"
                  className={`input-base input-0 ${
                    formErrors.nama_audio ? "input-error" : ""
                  }`}
                  value={formData.nama_audio}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "");
                    setFormData({
                      ...formData,
                      nama_audio: value,
                    });
                  }}
                />
                {formErrors.nama_audio && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.nama_audio}
                  </span>
                )}
                <p className="mt-1 text-xs text-base-content/80">
                  Hanya huruf kecil, angka, underscore (_), dan dash (-).
                  Ekstensi .mp3 akan ditambahkan otomatis
                </p>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Deskripsi <span className="text-error">*</span>
                  </span>
                </label>
                <textarea
                  placeholder="Contoh: Audio untuk angka satu"
                  className={`textarea textarea-bordered textarea-0 ${
                    formErrors.tts_text ? "textarea-error" : ""
                  }`}
                  rows="3"
                  value={formData.tts_text}
                  onChange={(e) =>
                    setFormData({ ...formData, tts_text: e.target.value })
                  }
                />
                {formErrors.tts_text && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.tts_text}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    File Audio (MP3) <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  id="audio-file-input"
                  type="file"
                  accept=".mp3,audio/mpeg,audio/mp3"
                  className={`file-input file-input-bordered file-input-0 w-full ${
                    formErrors.file ? "file-input-error" : ""
                  }`}
                  onChange={handleFileChange}
                />
                {formErrors.file && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.file}
                  </span>
                )}
                {formData.file && (
                  <div className="mt-2 text-xs text-base-content/80">
                    <span className="font-medium">File terpilih:</span>{" "}
                    {formData.file.name} ({formatFileSize(formData.file.size)})
                  </div>
                )}
                <p className="mt-1 text-xs text-base-content/80">
                  Format: MP3, Maksimal: 5MB
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Batal
              </button>

              <button
                className="btn bg-0 text-white hover:bg-3 hover:text-black hover:border hover:border-black transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          />
        </div>
      )}

      {showDeleteModal && deletingAudio && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold text-red-600">
                Konfirmasi Hapus
              </h3>
            </div>

            <div className="space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus audio
                <span className="font-semibold">
                  {" "}
                  {deletingAudio.nama_audio}
                </span>
                ?
              </p>

              <p className="text-sm text-base-content/80">
                File audio akan dihapus{" "}
                <span className="font-medium text-red-600">permanen</span> dan
                tidak dapat dikembalikan.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingAudio(null);
                }}
                disabled={loading}
              >
                Batal
              </button>

              <button
                className="btn bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingAudio(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
