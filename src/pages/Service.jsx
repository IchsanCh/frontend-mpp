import { useState, useEffect } from "react";
import { authService, serviceService, unitService } from "../services/api";
import Pagination from "../components/admin/Pagination";
import { showToast } from "../utils/toast";

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
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

  const [formData, setFormData] = useState({
    code: "",
    nama_service: "",
    loket: "",
    limits_queue: 0,
    is_active: "y",
  });
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const user = authService.getUser();
  const isUnitRole = user?.role === "unit";

  useEffect(() => {
    fetchServices();
  }, [filterActive, searchTerm, page]);

  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [searchTerm]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await serviceService.getAll({
        isActive: filterActive,
        search: searchTerm.trim(),
        page: page,
        limit: limit,
      });

      setServices(response.data || []);
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

    if (!formData.code.trim()) {
      errors.code = "Kode layanan wajib diisi";
    } else if (!/^[A-Z]{1,2}$/.test(formData.code)) {
      errors.code =
        "Kode layanan harus 1-2 huruf (A-Z), tanpa angka atau karakter khusus";
    }

    if (!formData.nama_service.trim()) {
      errors.nama_service = "Nama layanan wajib diisi";
    }

    if (!formData.loket.trim()) {
      errors.loket = "Loket wajib diisi";
    }

    if (formData.limits_queue < 0) {
      errors.limits_queue = "Batas antrian tidak boleh negatif";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await serviceService.create({
        ...formData,
      });
      showToast("Layanan berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      code: service.code,
      nama_service: service.nama_service,
      loket: service.loket,
      limits_queue: service.limits_queue,
      is_active: service.is_active,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await serviceService.update(editingService.id, {
        ...formData,
      });
      showToast("Layanan berhasil diupdate");
      setShowEditModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (service) => {
    setDeletingService(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await serviceService.hardDelete(deletingService.id);
      showToast("Layanan berhasil dihapus");
      setShowDeleteModal(false);
      setDeletingService(null);
      fetchServices();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      nama_service: "",
      loket: "",
      limits_queue: 0,
      is_active: "y",
    });
    setFormErrors({});
    setEditingService(null);
  };

  const filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.code.toLowerCase().includes(searchLower) ||
      service.nama_service.toLowerCase().includes(searchLower) ||
      service.loket?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Management Layanan
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          Kelola data layanan per unit
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Cari kode atau nama layanan..."
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

            {isUnitRole && (
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
                Tambah Layanan
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
                  <th className="min-w-[80px]">Kode</th>
                  <th className="min-w-[150px]">Nama Layanan</th>
                  <th className="min-w-[100px]">Loket</th>
                  <th className="min-w-[80px]">Batas Antrian</th>
                  <th className="min-w-[100px]">Status</th>
                  <th className="min-w-[130px]">Dibuat</th>
                  {isUnitRole && <th className="text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isUnitRole ? 8 : 7}
                      className="text-center py-8"
                    >
                      <span className="loading loading-spinner loading-lg"></span>
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isUnitRole ? 8 : 7}
                      className="text-center py-8 text-base-content/70"
                    >
                      Tidak ada data layanan
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service, index) => (
                    <tr key={service.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <span className="font-mono font-semibold">
                          {service.code}
                        </span>
                      </td>
                      <td>{service.nama_service}</td>
                      <td>
                        <span className="badge badge-outline">
                          {service.loket}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-semibold">
                          {service.limits_queue}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            service.is_active === "y"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {service.is_active === "y" ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td>
                        {new Date(service.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>
                      {isUnitRole && (
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleEdit(service)}
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
                              onClick={() => handleDelete(service)}
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

      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-6">Tambah Layanan Baru</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Kode Layanan <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: LOKET"
                  maxLength={2}
                  className={`input-base input-0 w-full ${
                    formErrors.code ? "input-error" : ""
                  }`}
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "");
                    setFormData({ ...formData, code: value });
                  }}
                />
                <div className="label">
                  {formErrors.code ? (
                    <span className="label-text-alt text-error">
                      {formErrors.code}
                    </span>
                  ) : (
                    <span className="label-text-alt">
                      1-2 huruf (A-Z), tanpa angka atau simbol
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Nama Layanan <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Loket Pendaftaran"
                  className={`input-base input-0 w-full ${
                    formErrors.nama_service ? "input-error" : ""
                  }`}
                  value={formData.nama_service}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_service: e.target.value })
                  }
                />
                <div className="label">
                  {formErrors.nama_service && (
                    <span className="label-text-alt text-error">
                      {formErrors.nama_service}
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Loket <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: 1, 2"
                  className={`input-base input-0 w-full ${
                    formErrors.loket ? "input-error" : ""
                  }`}
                  value={formData.loket}
                  onChange={(e) =>
                    setFormData({ ...formData, loket: e.target.value })
                  }
                />
                <div className="label">
                  {formErrors.loket && (
                    <span className="label-text-alt text-error">
                      {formErrors.loket}
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Batas Antrian <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={`input-base input-0 w-full ${
                    formErrors.limits_queue ? "input-error" : ""
                  }`}
                  value={formData.limits_queue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits_queue: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <div className="label">
                  {formErrors.limits_queue ? (
                    <span className="label-text-alt text-error">
                      {formErrors.limits_queue}
                    </span>
                  ) : (
                    <span className="label-text-alt">
                      Maksimal antrian per hari (0 = unlimited)
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Status
                  </span>
                </div>
                <select
                  className="select select-0 w-full"
                  value={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.value })
                  }
                >
                  <option value="y">Aktif</option>
                  <option value="n">Tidak Aktif</option>
                </select>
              </label>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
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
          ></div>
        </div>
      )}

      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-6">Edit Layanan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Kode Layanan <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={2}
                  className={`input-base input-0 w-full ${
                    formErrors.code ? "input-error" : ""
                  }`}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                    })
                  }
                />
                <div className="label">
                  {formErrors.code ? (
                    <span className="label-text-alt text-error">
                      {formErrors.code}
                    </span>
                  ) : (
                    <span className="label-text-alt">
                      1-2 huruf (A-Z), tanpa angka atau simbol
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Nama Layanan <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  className={`input-base input-0 w-full ${
                    formErrors.nama_service ? "input-error" : ""
                  }`}
                  value={formData.nama_service}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_service: e.target.value })
                  }
                />
                <div className="label">
                  {formErrors.nama_service && (
                    <span className="label-text-alt text-error">
                      {formErrors.nama_service}
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Loket <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  className={`input-base input-0 w-full ${
                    formErrors.loket ? "input-error" : ""
                  }`}
                  value={formData.loket}
                  onChange={(e) =>
                    setFormData({ ...formData, loket: e.target.value })
                  }
                />
                <div className="label">
                  {formErrors.loket && (
                    <span className="label-text-alt text-error">
                      {formErrors.loket}
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Batas Antrian <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  className={`input-base input-0 w-full ${
                    formErrors.limits_queue ? "input-error" : ""
                  }`}
                  value={formData.limits_queue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits_queue: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <div className="label">
                  {formErrors.limits_queue ? (
                    <span className="label-text-alt text-error">
                      {formErrors.limits_queue}
                    </span>
                  ) : (
                    <span className="label-text-alt">
                      Maksimal antrian per hari (0 = unlimited)
                    </span>
                  )}
                </div>
              </label>

              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text text-black font-medium">
                    Status
                  </span>
                </div>
                <select
                  className="select select-0 w-full"
                  value={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.value })
                  }
                >
                  <option value="y">Aktif</option>
                  <option value="n">Tidak Aktif</option>
                </select>
              </label>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
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
          ></div>
        </div>
      )}

      {showDeleteModal && deletingService && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold text-error mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="py-4">
              Apakah Anda yakin ingin menghapus layanan{" "}
              <span className="font-semibold">
                {deletingService.nama_service}
              </span>
              ?
            </p>
            <p className="text-sm text-base-content/70">
              Data layanan akan dihapus{" "}
              <span className="font-medium text-error">permanen</span> dan tidak
              dapat dikembalikan.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingService(null);
                }}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-error"
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
              setDeletingService(null);
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
