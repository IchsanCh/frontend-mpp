import { useState, useEffect } from "react";
import { authService, unitService } from "../services/api";
import Pagination from "../components/admin/Pagination";
import { showToast } from "../utils/toast";

export default function UnitManagement() {
  const [units, setUnits] = useState([]);
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
    nama_unit: "",
    is_active: "y",
    main_display: "",
  });
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";

  useEffect(() => {
    fetchUnits();
  }, [filterActive, searchTerm, page]);

  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [searchTerm]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await unitService.getAll({
        isActive: filterActive,
        search: searchTerm.trim(),
        page: page,
        limit: limit,
      });

      setUnits(response.data || []);
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
      errors.code = "Kode unit wajib diisi";
    } else if (!/^[A-Z]{1,10}$/.test(formData.code)) {
      errors.code = "Kode unit hanya boleh huruf A–Z (maks. 10 karakter)";
    }

    if (!formData.nama_unit.trim()) {
      errors.nama_unit = "Nama unit wajib diisi";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await unitService.create(formData);
      showToast("Unit berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      fetchUnits();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      nama_unit: unit.nama_unit,
      is_active: unit.is_active,
      main_display: unit.main_display,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await unitService.update(editingUnit.id, formData);
      showToast("Unit berhasil diupdate");
      setShowEditModal(false);
      resetForm();
      fetchUnits();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (unit) => {
    setDeletingUnit(unit);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await unitService.hardDelete(deletingUnit.id);
      showToast("Unit berhasil dihapus");
      setShowDeleteModal(false);
      setDeletingUnit(null);
      fetchUnits();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      nama_unit: "",
      is_active: "y",
      main_display: "",
    });
    setFormErrors({});
    setEditingUnit(null);
  };

  const filteredUnits = units.filter((unit) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      unit.code.toLowerCase().includes(searchLower) ||
      unit.nama_unit.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Management Unit
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          Kelola data unit pelayanan
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Cari kode atau nama unit..."
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
                Tambah Unit
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
                  <th className="min-w-[150px]">Nama Unit</th>
                  <th className="min-w-[130px]">Status</th>
                  <th className="min-w-[130px]">Main Song</th>
                  <th className="min-w-[130px]">Dibuat</th>
                  {isSuperUser && <th className="text-center">Aksi</th>}
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
                ) : filteredUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 7 : 6}
                      className="text-center py-8 text-base-content/70"
                    >
                      Tidak ada data unit
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit, index) => (
                    <tr key={unit.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <span className="font-mono font-semibold">
                          {unit.code}
                        </span>
                      </td>
                      <td>{unit.nama_unit}</td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            unit.is_active === "y"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {unit.is_active === "y" ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            unit.main_display === "active"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {unit.main_display === "active"
                            ? "Aktif"
                            : "Tidak Aktif"}
                        </span>
                      </td>
                      <td>
                        {new Date(unit.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {isSuperUser && (
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleEdit(unit)}
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
                              onClick={() => handleDelete(unit)}
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
          <div className="modal-box w-full max-w-lg rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">Tambah Unit Baru</h3>
              <p className="text-xs text-base-content/80">
                Isi data unit pelayanan dengan benar
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Kode Unit <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SANDIGI"
                  maxLength={10}
                  className={`input-base input-0 ${
                    formErrors.code ? "input-error" : ""
                  }`}
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "");

                    setFormData({
                      ...formData,
                      code: value,
                    });
                  }}
                />
                {formErrors.code && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.code}
                  </span>
                )}
                <p className="mt-1 text-xs text-base-content/80">
                  Maksimal 10 huruf (A–Z), tanpa angka atau karakter khusus
                </p>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Nama Unit <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sistem Antrian Digital"
                  className={`input-base input-0 ${
                    formErrors.nama_unit ? "input-error" : ""
                  }`}
                  value={formData.nama_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_unit: e.target.value })
                  }
                />
                {formErrors.nama_unit && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.nama_unit}
                  </span>
                )}
              </div>

              <div className="form-control gap-2 flex">
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
              <div className="form-control gap-2 flex">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Main Song
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.main_display}
                  onChange={(e) =>
                    setFormData({ ...formData, main_display: e.target.value })
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
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

      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg rounded-2xl p-6">
            <div className="mb-6 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold color0">Edit Unit</h3>
              <p className="text-xs text-base-content/80">
                Perbarui data unit pelayanan
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Kode Unit <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  className={`input-base input-0 ${
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
                {formErrors.code && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.code}
                  </span>
                )}
                <p className="mt-1 text-xs text-base-content/80">
                  Maksimal 10 huruf (A–Z), tanpa angka atau karakter khusus
                </p>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Nama Unit <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input-base input-0 ${
                    formErrors.nama_unit ? "input-error" : ""
                  }`}
                  value={formData.nama_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_unit: e.target.value })
                  }
                />
                {formErrors.nama_unit && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.nama_unit}
                  </span>
                )}
              </div>

              <div className="form-control flex gap-2">
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
              <div className="form-control flex gap-2">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Main Song
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.main_display}
                  onChange={(e) =>
                    setFormData({ ...formData, main_display: e.target.value })
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
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

      {showDeleteModal && deletingUnit && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold text-red-600">
                Konfirmasi Hapus
              </h3>
            </div>

            <div className="space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus unit
                <span className="font-semibold"> {deletingUnit.nama_unit}</span>
                ?
              </p>

              <p className="text-sm text-base-content/80">
                Data unit akan dihapus{" "}
                <span className="font-medium text-red-600">permanen</span> dan
                tidak dapat dikembalikan.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUnit(null);
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
              setDeletingUnit(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
