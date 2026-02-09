import { useState, useEffect } from "react";
import { authService, faqService } from "../services/api";
import Pagination from "../components/admin/Pagination";
import { showToast } from "../utils/toast";

export default function FAQManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    is_active: "y",
    sort_order: 1,
  });
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [deletingFAQ, setDeletingFAQ] = useState(null);
  const [viewingFAQ, setViewingFAQ] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";

  useEffect(() => {
    fetchFAQs();
  }, [filterActive, searchTerm, page]);

  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [searchTerm]);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const response = await faqService.getAll({
        isActive: filterActive,
        search: searchTerm.trim(),
        page: page,
        limit: limit,
      });

      setFaqs(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_data || 0);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.question.trim()) {
      errors.question = "Pertanyaan wajib diisi";
    } else if (formData.question.length > 255) {
      errors.question = "Pertanyaan maksimal 255 karakter";
    }

    if (!formData.answer.trim()) {
      errors.answer = "Jawaban wajib diisi";
    } else if (formData.answer.length > 3000) {
      errors.answer = "Jawaban maksimal 3000 karakter";
    }

    if (!formData.sort_order || formData.sort_order < 1) {
      errors.sort_order = "Urutan harus minimal 1";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await faqService.create(formData);
      showToast("FAQ berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      fetchFAQs();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      is_active: faq.is_active,
      sort_order: faq.sort_order,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await faqService.update(editingFAQ.id, formData);
      showToast("FAQ berhasil diupdate");
      setShowEditModal(false);
      resetForm();
      fetchFAQs();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (faq) => {
    setDeletingFAQ(faq);
    setShowDeleteModal(true);
  };

  const handleView = (faq) => {
    setViewingFAQ(faq);
    setShowViewModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await faqService.hardDelete(deletingFAQ.id);
      showToast("FAQ berhasil dihapus");
      setShowDeleteModal(false);
      setDeletingFAQ(null);
      fetchFAQs();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      is_active: "y",
      sort_order: 1,
    });
    setFormErrors({});
    setEditingFAQ(null);
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredFAQs = faqs;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">Management FAQ</h1>
        <p className="text-sm text-base-content/70 mt-1">
          Kelola pertanyaan yang sering diajukan
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Cari pertanyaan atau jawaban..."
                className="input-base input-0 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="select select-0 w-full sm:w-40"
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="y">Aktif</option>
                <option value="n">Tidak Aktif</option>
              </select>
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
                Tambah FAQ
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
                  <th className="min-w-[50px]">Urutan</th>
                  <th className="min-w-[200px]">Pertanyaan</th>
                  <th className="min-w-[250px]">Jawaban</th>
                  <th className="min-w-[100px]">Status</th>
                  <th className="min-w-[130px]">Dibuat</th>
                  {isSuperUser && (
                    <th className="text-center min-w-[150px]">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 7 : 6}
                      className="text-center py-8"
                    >
                      <span className="loading loading-spinner loading-lg"></span>
                    </td>
                  </tr>
                ) : filteredFAQs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 7 : 6}
                      className="text-center py-8 text-base-content/70"
                    >
                      Tidak ada data FAQ
                    </td>
                  </tr>
                ) : (
                  filteredFAQs.map((faq, index) => (
                    <tr key={faq.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <span className="badge badge-neutral font-semibold">
                          {faq.sort_order}
                        </span>
                      </td>
                      <td>
                        <div className="max-w-xs">
                          {truncateText(faq.question, 80)}
                        </div>
                      </td>
                      <td>
                        <div className="max-w-sm text-sm text-base-content/80">
                          {truncateText(faq.answer, 100)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            faq.is_active === "y"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {faq.is_active === "y" ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td>
                        {new Date(faq.created_at).toLocaleDateString("id-ID", {
                          timeZone: "UTC",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {isSuperUser && (
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              className="btn btn-sm btn-accent"
                              onClick={() => handleView(faq)}
                              title="Lihat Detail"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
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
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleEdit(faq)}
                              title="Edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => handleDelete(faq)}
                              title="Hapus"
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
      />

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">Tambah FAQ Baru</h3>
              <p className="text-xs text-base-content/80">
                Isi pertanyaan dan jawaban yang sering diajukan
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Pertanyaan <span className="text-error">*</span>
                  </span>
                  <span className="label-text-alt text-base-content/60">
                    {formData.question.length}/255
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Apa itu SANDIGI?"
                  maxLength={255}
                  className={`input-base input-0 ${
                    formErrors.question ? "input-error" : ""
                  }`}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                />
                {formErrors.question && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.question}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Jawaban <span className="text-error">*</span>
                  </span>
                  <span className="label-text-alt text-base-content/60">
                    {formData.answer.length}/3000
                  </span>
                </label>
                <textarea
                  placeholder="Tulis jawaban lengkap di sini..."
                  maxLength={3000}
                  rows={6}
                  className={`input-base input-0 resize-none ${
                    formErrors.answer ? "input-error" : ""
                  }`}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                />
                {formErrors.answer && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.answer}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Urutan <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className={`input-base input-0 ${
                      formErrors.sort_order ? "input-error" : ""
                    }`}
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  {formErrors.sort_order && (
                    <span className="mt-1 text-xs text-error">
                      {formErrors.sort_order}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-base-content/80">
                    Urutan FAQ di halaman publik
                  </p>
                </div>

                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Status
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-0"
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value })
                    }
                  >
                    <option value="y">Aktif</option>
                    <option value="n">Tidak Aktif</option>
                  </select>
                </div>
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
                  "Simpan"
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

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">Edit FAQ</h3>
              <p className="text-xs text-base-content/80">
                Perbarui pertanyaan dan jawaban
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Pertanyaan <span className="text-error">*</span>
                  </span>
                  <span className="label-text-alt text-base-content/60">
                    {formData.question.length}/255
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={255}
                  className={`input-base input-0 ${
                    formErrors.question ? "input-error" : ""
                  }`}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                />
                {formErrors.question && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.question}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Jawaban <span className="text-error">*</span>
                  </span>
                  <span className="label-text-alt text-base-content/60">
                    {formData.answer.length}/3000
                  </span>
                </label>
                <textarea
                  maxLength={3000}
                  rows={6}
                  className={`input-base input-0 resize-none ${
                    formErrors.answer ? "input-error" : ""
                  }`}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                />
                {formErrors.answer && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.answer}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Urutan <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`input-base input-0 ${
                      formErrors.sort_order ? "input-error" : ""
                    }`}
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  {formErrors.sort_order && (
                    <span className="mt-1 text-xs text-error">
                      {formErrors.sort_order}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-base-content/80">
                    Urutan FAQ di halaman publik
                  </p>
                </div>

                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Status
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-0"
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value })
                    }
                  >
                    <option value="y">Aktif</option>
                    <option value="n">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Batal
              </button>

              <button
                className="btn bg-0 text-white hover:bg-3 hover:text-black hover:border hover:border-black transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => {
              setShowEditModal(false);
              resetForm();
            }}
          />
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && viewingFAQ && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">Detail FAQ</h3>
              <div className="flex gap-2 mt-2">
                <span
                  className={`badge font-semibold ${
                    viewingFAQ.is_active === "y"
                      ? "badge-success"
                      : "badge-error"
                  }`}
                >
                  {viewingFAQ.is_active === "y" ? "Aktif" : "Tidak Aktif"}
                </span>
                <span className="badge badge-neutral font-semibold">
                  Urutan: {viewingFAQ.sort_order}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base-content mb-2">
                  Pertanyaan:
                </h4>
                <p className="text-base-content/90">{viewingFAQ.question}</p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-2">
                  Jawaban:
                </h4>
                <div className="text-base-content/90 whitespace-pre-line">
                  {viewingFAQ.answer}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t borderc3 text-sm text-base-content/70">
                <div>
                  <span className="font-medium">Dibuat:</span>{" "}
                  {new Date(viewingFAQ.created_at).toLocaleString("id-ID", {
                    timeZone: "UTC",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div>
                  <span className="font-medium">Diupdate:</span>{" "}
                  {new Date(viewingFAQ.updated_at).toLocaleString("id-ID", {
                    timeZone: "UTC",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingFAQ(null);
                }}
              >
                Tutup
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => {
              setShowViewModal(false);
              setViewingFAQ(null);
            }}
          />
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && deletingFAQ && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold text-red-600">
                Konfirmasi Hapus
              </h3>
            </div>

            <div className="space-y-3">
              <p>Apakah Anda yakin ingin menghapus FAQ dengan pertanyaan:</p>
              <p className="font-semibold text-base-content">
                "{truncateText(deletingFAQ.question, 100)}"
              </p>

              <p className="text-sm text-base-content/80">
                Data FAQ akan dihapus{" "}
                <span className="font-medium text-red-600">permanen</span> dan
                tidak dapat dikembalikan.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingFAQ(null);
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
              setDeletingFAQ(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
