import { useState, useEffect } from "react";
import { authService, userService, unitService } from "../services/api";
import Pagination from "../components/admin/Pagination";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBanned, setFilterBanned] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    user_email: "",
    password: "",
    role: "unit",
    is_banned: "n",
    unit_id: null,
  });
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";

  useEffect(() => {
    fetchUsers();
    fetchUnits();
  }, [filterBanned, searchTerm, page]);

  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({
        isBanned: filterBanned,
        search: searchTerm.trim(),
        page: page,
        limit: limit,
      });

      setUsers(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_data || 0);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await unitService.getAll();
      setUnits(res.data || []);
    } catch (err) {
      console.error(err.message);
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

    if (!formData.nama.trim()) {
      errors.nama = "Nama wajib diisi";
    }

    if (!formData.user_email.trim()) {
      errors.user_email = "Email wajib diisi";
    } else if (!formData.user_email.includes("@")) {
      errors.user_email = "Format email tidak valid";
    }

    if (!editingUser && !formData.password) {
      errors.password = "Password wajib diisi";
    }

    if (formData.password && formData.password.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }

    if (formData.role === "unit" && !formData.unit_id) {
      errors.unit_id = "Unit wajib dipilih untuk role Unit";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        unit_id: formData.role === "unit" ? formData.unit_id : null,
      };
      await userService.create(payload);
      showToast("User berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      user_email: user.email,
      password: "",
      role: user.role,
      is_banned: user.is_banned,
      unit_id: user.unit_id,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        unit_id: formData.role === "unit" ? formData.unit_id : 0,
      };

      if (!formData.password) {
        delete payload.password;
      }

      await userService.update(editingUser.id, payload);
      showToast("User berhasil diupdate");
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await userService.hardDelete(deletingUser.id);
      showToast("User berhasil dihapus");
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      user_email: "",
      password: "",
      role: "unit",
      is_banned: "n",
      unit_id: null,
    });
    setFormErrors({});
    setEditingUser(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Management User
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          Kelola data pengguna sistem
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                placeholder="Cari nama atau email..."
                className="input-base input-0 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="select select-0 w-full sm:w-40"
                value={filterBanned}
                onChange={(e) => {
                  setFilterBanned(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="n">Aktif</option>
                <option value="y">Banned</option>
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
                Tambah User
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
                  <th className="min-w-[150px]">Nama</th>
                  <th className="min-w-[180px]">Email</th>
                  <th className="min-w-[150px]">Role</th>
                  <th className="min-w-[150px]">Unit</th>
                  <th className="min-w-[100px]">Status</th>
                  <th className="min-w-[130px]">Dibuat</th>
                  {isSuperUser && <th className="text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 8 : 7}
                      className="text-center py-8"
                    >
                      <span className="loading loading-spinner loading-lg"></span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperUser ? 8 : 7}
                      className="text-center py-8 text-base-content/70"
                    >
                      Tidak ada data user
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>{user.nama}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            user.role === "super_user"
                              ? "badge-primary"
                              : "badge-info"
                          }`}
                        >
                          {user.role === "super_user" ? "Super User" : "Unit"}
                        </span>
                      </td>
                      <td>
                        {user.unit_name ? (
                          <span className="text-sm">{user.unit_name}</span>
                        ) : (
                          <span className="text-sm text-base-content/50">
                            -
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge font-semibold ${
                            user.is_banned === "n"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {user.is_banned === "n" ? "Aktif" : "Banned"}
                        </span>
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
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
                              onClick={() => handleEdit(user)}
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
                              onClick={() => handleDelete(user)}
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
              <h3 className="text-lg font-semibold color0">Tambah User Baru</h3>
              <p className="text-xs text-base-content/80">
                Isi data pengguna dengan benar
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Nama Lengkap <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: John Doe"
                  className={`input-base input-0 ${
                    formErrors.nama ? "input-error" : ""
                  }`}
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
                {formErrors.nama && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.nama}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Email <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: user@example.com"
                  className={`input-base input-0 ${
                    formErrors.user_email ? "input-error" : ""
                  }`}
                  value={formData.user_email}
                  onChange={(e) =>
                    setFormData({ ...formData, user_email: e.target.value })
                  }
                />
                {formErrors.user_email && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.user_email}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Password <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  className={`input-base input-0 ${
                    formErrors.password ? "input-error" : ""
                  }`}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                {formErrors.password && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.password}
                  </span>
                )}
              </div>

              <div className="form-control gap-2 flex">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Role <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="unit">Unit</option>
                  <option value="super_user">Super User</option>
                </select>
              </div>

              {formData.role === "unit" && (
                <div className="form-control gap-2 flex">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Unit <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    className={`select select-bordered select-0 ${
                      formErrors.unit_id ? "select-error" : ""
                    }`}
                    value={formData.unit_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">Pilih Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.nama_unit}
                      </option>
                    ))}
                  </select>
                  {formErrors.unit_id && (
                    <span className="mt-1 text-xs text-error">
                      {formErrors.unit_id}
                    </span>
                  )}
                </div>
              )}

              <div className="form-control gap-2 flex">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Status
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.is_banned}
                  onChange={(e) =>
                    setFormData({ ...formData, is_banned: e.target.value })
                  }
                >
                  <option value="n">Aktif</option>
                  <option value="y">Banned</option>
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
              <h3 className="text-lg font-semibold color0">Edit User</h3>
              <p className="text-xs text-base-content/80">
                Perbarui data pengguna
              </p>
            </div>

            <div className="space-y-5">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Nama Lengkap <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`input-base input-0 ${
                    formErrors.nama ? "input-error" : ""
                  }`}
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
                {formErrors.nama && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.nama}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Email <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  className={`input-base input-0 ${
                    formErrors.user_email ? "input-error" : ""
                  }`}
                  value={formData.user_email}
                  onChange={(e) =>
                    setFormData({ ...formData, user_email: e.target.value })
                  }
                />
                {formErrors.user_email && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.user_email}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Password Baru
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className={`input-base input-0 ${
                    formErrors.password ? "input-error" : ""
                  }`}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                {formErrors.password && (
                  <span className="mt-1 text-xs text-error">
                    {formErrors.password}
                  </span>
                )}
                <p className="mt-1 text-xs text-base-content/80">
                  Kosongkan jika tidak ingin mengubah password
                </p>
              </div>

              <div className="form-control flex gap-2">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Role <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="unit">Unit</option>
                  <option value="super_user">Super User</option>
                </select>
              </div>

              {formData.role === "unit" && (
                <div className="form-control flex gap-2">
                  <label className="label pb-1">
                    <span className="label-text font-medium text-black">
                      Unit <span className="text-error">*</span>
                    </span>
                  </label>
                  <select
                    className={`select select-bordered select-0 ${
                      formErrors.unit_id ? "select-error" : ""
                    }`}
                    value={formData.unit_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">Pilih Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.nama_unit}
                      </option>
                    ))}
                  </select>
                  {formErrors.unit_id && (
                    <span className="mt-1 text-xs text-error">
                      {formErrors.unit_id}
                    </span>
                  )}
                </div>
              )}

              <div className="form-control flex gap-2">
                <label className="label pb-1">
                  <span className="label-text font-medium text-black">
                    Status
                  </span>
                </label>
                <select
                  className="select select-bordered select-0"
                  value={formData.is_banned}
                  onChange={(e) =>
                    setFormData({ ...formData, is_banned: e.target.value })
                  }
                >
                  <option value="n">Aktif</option>
                  <option value="y">Banned</option>
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

      {showDeleteModal && deletingUser && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 border-b borderc3 pb-3">
              <h3 className="text-lg font-semibold text-red-600">
                Konfirmasi Hapus
              </h3>
            </div>

            <div className="space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus user{" "}
                <span className="font-semibold">{deletingUser.nama}</span>?
              </p>
              <p className="text-sm text-base-content/80">
                Data user akan dihapus{" "}
                <span className="font-medium text-red-600">permanen</span> dan
                tidak dapat dikembalikan.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUser(null);
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
              setDeletingUser(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
