import { useState, useEffect, useCallback } from "react";
import { Clock, Save, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { authService, unitService, scheduleService } from "../services/api";
import { showToast } from "../utils/toast";

const DAYS = [
  { value: 0, label: "Minggu", type: "weekend" },
  { value: 1, label: "Senin", type: "weekday" },
  { value: 2, label: "Selasa", type: "weekday" },
  { value: 3, label: "Rabu", type: "weekday" },
  { value: 4, label: "Kamis", type: "weekday" },
  { value: 5, label: "Jumat", type: "friday" },
  { value: 6, label: "Sabtu", type: "weekend" },
];

const PALETTE = {
  brown0: "#8c6a4b",
  brown1: "#ad8b73",
  brown2: "#ceab93",
  brown3: "#e3caa5",
  brown4: "#fffbe9",
};

const defaultSchedules = () =>
  DAYS.map((d) => ({
    day_of_week: d.value,
    jam_buka: "08:00:00",
    jam_tutup: "16:00:00",
    is_active: d.value === 0 || d.value === 6 ? "n" : "y",
  }));

const toHHMM = (t) => (t ? t.slice(0, 5) : "08:00");
const toHHMMSS = (t) => (t?.length === 5 ? t + ":00" : t);

const getDuration = (open, close) => {
  if (!open || !close) return null;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const total = ch * 60 + cm - (oh * 60 + om);
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function UnitButton({ unit, isSelected, onClick, scheduleCount }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group transition-all duration-150 rounded-xl px-3 py-2.5 flex items-center gap-3"
      style={{
        backgroundColor: isSelected ? PALETTE.brown0 : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = PALETTE.brown4;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold tracking-wide"
        style={{
          backgroundColor: isSelected
            ? "rgba(255,255,255,0.2)"
            : PALETTE.brown3,
          color: isSelected ? "#fff" : PALETTE.brown0,
        }}
      >
        {getInitials(unit.nama_unit)}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate leading-tight"
          style={{ color: isSelected ? "#fff" : "#1a1a1a" }}
        >
          {unit.nama_unit}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "#9a8a7a" }}
        >
          {unit.code}
          {scheduleCount !== undefined && (
            <span> · {scheduleCount} hari aktif</span>
          )}
        </p>
      </div>

      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            unit.is_active === "y"
              ? isSelected
                ? "#86efac"
                : "#22c55e"
              : "#ef4444",
        }}
      />
    </button>
  );
}

function DayRow({ s, isSuperUser, onToggle, onChange }) {
  const day = DAYS[s.day_of_week];
  const isOpen = s.is_active === "y";
  const duration = getDuration(toHHMM(s.jam_buka), toHHMM(s.jam_tutup));
  const isWeekend = day.type === "weekend";
  const isFriday = day.type === "friday";

  return (
    <div
      className="grid items-center gap-x-4 py-3.5 border-b border-dashed transition-all duration-200"
      style={{
        gridTemplateColumns: "140px 80px 1fr auto",
        borderColor: "#e8ddd4",
        opacity: isOpen ? 1 : 0.45,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-semibold text-sm"
          style={{ color: isOpen ? "#1a1a1a" : "#9a8a7a" }}
        >
          {day.label}
        </span>
        {isWeekend && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            Weekend
          </span>
        )}
        {isFriday && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: PALETTE.brown3, color: PALETTE.brown0 }}
          >
            Jum'at
          </span>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            style={{ "--tglbg": isOpen ? PALETTE.brown0 : "#d1d5db" }}
            checked={isOpen}
            onChange={() => isSuperUser && onToggle(s.day_of_week)}
            disabled={!isSuperUser}
          />
          <span
            className="text-xs font-medium"
            style={{ color: isOpen ? PALETTE.brown0 : "#9ca3af" }}
          >
            {isOpen ? "Buka" : "Tutup"}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        {isOpen ? (
          <>
            <input
              type="time"
              value={toHHMM(s.jam_buka)}
              onChange={(e) =>
                onChange(s.day_of_week, "jam_buka", toHHMMSS(e.target.value))
              }
              disabled={!isSuperUser}
              className="input-base input-0 w-[108px] text-sm font-medium disabled:opacity-40"
            />
            <span className="text-base-content/30 text-sm select-none">—</span>
            <input
              type="time"
              value={toHHMM(s.jam_tutup)}
              onChange={(e) =>
                onChange(s.day_of_week, "jam_tutup", toHHMMSS(e.target.value))
              }
              disabled={!isSuperUser}
              className="input-base input-0 w-[108px] text-sm font-medium disabled:opacity-40"
            />
          </>
        ) : (
          <span className="text-sm italic" style={{ color: "#c4b9b0" }}>
            Tidak beroperasi
          </span>
        )}
      </div>

      <div className="w-16 text-right">
        {isOpen && duration ? (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: PALETTE.brown3, color: PALETTE.brown0 }}
          >
            {duration}
          </span>
        ) : (
          <span className="w-16 inline-block" />
        )}
      </div>
    </div>
  );
}

function DayCard({ s, isSuperUser, onToggle, onChange }) {
  const day = DAYS[s.day_of_week];
  const isOpen = s.is_active === "y";
  const duration = getDuration(toHHMM(s.jam_buka), toHHMM(s.jam_tutup));

  return (
    <div
      className="rounded-xl p-3.5 border transition-all duration-200"
      style={{
        borderColor: isOpen ? PALETTE.brown2 : "#e5e7eb",
        backgroundColor: isOpen ? PALETTE.brown4 : "#f9fafb",
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-sm"
            style={{ color: isOpen ? "#1a1a1a" : "#9ca3af" }}
          >
            {day.label}
          </span>
          {day.type === "weekend" && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
            >
              Weekend
            </span>
          )}
          {isOpen && duration && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: PALETTE.brown3, color: PALETTE.brown0 }}
            >
              {duration}
            </span>
          )}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            style={{ "--tglbg": isOpen ? PALETTE.brown0 : "#d1d5db" }}
            checked={isOpen}
            onChange={() => isSuperUser && onToggle(s.day_of_week)}
            disabled={!isSuperUser}
          />
          <span
            className="text-xs font-semibold w-9"
            style={{ color: isOpen ? PALETTE.brown0 : "#9ca3af" }}
          >
            {isOpen ? "Buka" : "Tutup"}
          </span>
        </label>
      </div>

      {isOpen ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-wide mb-1"
              style={{ color: "#9a8a7a" }}
            >
              Buka
            </p>
            <input
              type="time"
              value={toHHMM(s.jam_buka)}
              onChange={(e) =>
                onChange(s.day_of_week, "jam_buka", toHHMMSS(e.target.value))
              }
              disabled={!isSuperUser}
              className="input-base input-0 w-full text-sm font-medium"
            />
          </div>
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-wide mb-1"
              style={{ color: "#9a8a7a" }}
            >
              Tutup
            </p>
            <input
              type="time"
              value={toHHMM(s.jam_tutup)}
              onChange={(e) =>
                onChange(s.day_of_week, "jam_tutup", toHHMMSS(e.target.value))
              }
              disabled={!isSuperUser}
              className="input-base input-0 w-full text-sm font-medium"
            />
          </div>
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: "#c4b9b0" }}>
          Unit tidak beroperasi pada hari ini
        </p>
      )}
    </div>
  );
}

export default function JamOperasional() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [schedules, setSchedules] = useState(defaultSchedules());
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileUnitOpen, setMobileUnitOpen] = useState(false);

  const user = authService.getUser();
  const isSuperUser = user?.role === "super_user";
  const activeCount = schedules.filter((s) => s.is_active === "y").length;

  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const res = await unitService.getAllNoPaginate({ isActive: "" });
      setUnits(res.data || []);
      if (res.data?.length > 0) setSelectedUnit(res.data[0]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const fetchSchedules = useCallback(async (unitId) => {
    setLoadingSchedules(true);
    try {
      const res = await scheduleService.getByUnit(unitId);
      const existing = res.data?.schedules || [];
      const merged = DAYS.map((d) => {
        const found = existing.find((s) => s.day_of_week === d.value);
        return found
          ? {
              day_of_week: found.day_of_week,
              jam_buka: found.jam_buka || "08:00:00",
              jam_tutup: found.jam_tutup || "16:00:00",
              is_active: found.is_active,
            }
          : {
              day_of_week: d.value,
              jam_buka: "08:00:00",
              jam_tutup: "16:00:00",
              is_active: d.value === 0 || d.value === 6 ? "n" : "y",
            };
      });
      setSchedules(merged);
    } catch {
      setSchedules(defaultSchedules());
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);
  useEffect(() => {
    if (selectedUnit) fetchSchedules(selectedUnit.id);
  }, [selectedUnit, fetchSchedules]);

  const handleToggle = (dow) => {
    if (!isSuperUser) return;
    setSchedules((p) =>
      p.map((s) =>
        s.day_of_week === dow
          ? { ...s, is_active: s.is_active === "y" ? "n" : "y" }
          : s
      )
    );
  };
  const handleChange = (dow, field, value) => {
    setSchedules((p) =>
      p.map((s) => (s.day_of_week === dow ? { ...s, [field]: value } : s))
    );
  };
  const validateSchedules = () => {
    const re = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    for (const s of schedules) {
      if (s.is_active === "y") {
        if (!re.test(s.jam_buka)) {
          showToast(
            `Jam buka tidak valid: ${DAYS[s.day_of_week].label}`,
            "error"
          );
          return false;
        }
        if (!re.test(s.jam_tutup)) {
          showToast(
            `Jam tutup tidak valid: ${DAYS[s.day_of_week].label}`,
            "error"
          );
          return false;
        }
      }
    }
    return true;
  };
  const handleSave = async () => {
    if (!selectedUnit || !validateSchedules()) return;
    setSaving(true);
    try {
      await scheduleService.upsert(selectedUnit.id, schedules);
      showToast("Jadwal berhasil disimpan");
      fetchSchedules(selectedUnit.id);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadingUnits) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span
            className="loading loading-spinner loading-lg"
            style={{ color: PALETTE.brown0 }}
          />
          <p className="text-sm" style={{ color: "#9a8a7a" }}>
            Memuat data unit…
          </p>
        </div>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <PageHeader />
        <div className="flex flex-col items-center py-24 gap-3">
          <Clock size={40} style={{ color: PALETTE.brown2 }} />
          <p className="font-semibold text-base-content/60">
            Belum ada unit tersedia
          </p>
          <p className="text-sm text-base-content/40">
            Buat unit di menu Kelola Unit terlebih dahulu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader />

      <div className="lg:hidden mb-4 relative z-10">
        <button
          onClick={() => setMobileUnitOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold bg-white transition-all"
          style={{ borderColor: PALETTE.brown2, color: "#1a1a1a" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: PALETTE.brown3, color: PALETTE.brown0 }}
            >
              {getInitials(selectedUnit?.nama_unit || "")}
            </div>
            {selectedUnit?.nama_unit ?? "Pilih Unit"}
          </div>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200`}
            style={{
              transform: mobileUnitOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: PALETTE.brown1,
            }}
          />
        </button>

        {mobileUnitOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden shadow-lg bg-white animate-fadeIn"
            style={{ borderColor: PALETTE.brown3 }}
          >
            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => {
                  setSelectedUnit(unit);
                  setMobileUnitOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[#fffbe9]"
                style={
                  selectedUnit?.id === unit.id
                    ? { backgroundColor: PALETTE.brown4, fontWeight: 600 }
                    : {}
                }
              >
                <span>{unit.nama_unit}</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      unit.is_active === "y" ? "#dcfce7" : "#fee2e2",
                    color: unit.is_active === "y" ? "#166534" : "#991b1b",
                  }}
                >
                  {unit.is_active === "y" ? "Aktif" : "Non-aktif"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-start">
        <aside
          className="hidden lg:block rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: "#ede5dc" }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "#ede5dc", backgroundColor: PALETTE.brown4 }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: PALETTE.brown1 }}
            >
              Unit
            </p>
          </div>

          <div className="overflow-y-auto p-2" style={{ maxHeight: "610px" }}>
            {units.map((unit) => (
              <UnitButton
                key={unit.id}
                unit={unit}
                isSelected={selectedUnit?.id === unit.id}
                onClick={() => setSelectedUnit(unit)}
                scheduleCount={
                  selectedUnit?.id === unit.id ? activeCount : undefined
                }
              />
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          {selectedUnit ? (
            <>
              <div
                className="rounded-2xl border px-5 py-4 bg-white flex flex-wrap items-center justify-between gap-3"
                style={{ borderColor: "#ede5dc" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2
                      className="text-xl font-bold tracking-tight"
                      style={{
                        color: "#1a1a1a",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {selectedUnit.nama_unit}
                    </h2>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          selectedUnit.is_active === "y"
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          selectedUnit.is_active === "y"
                            ? "#166534"
                            : "#991b1b",
                      }}
                    >
                      {selectedUnit.is_active === "y" ? "Aktif" : "Non-aktif"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "#9a8a7a" }}>
                    {selectedUnit.code} &nbsp;·&nbsp;
                    <span style={{ color: PALETTE.brown0, fontWeight: 600 }}>
                      {activeCount} hari
                    </span>{" "}
                    beroperasi minggu ini
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {schedules.map((s) => {
                    const d = DAYS[s.day_of_week];
                    const open = s.is_active === "y";
                    return (
                      <div
                        key={s.day_of_week}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                          style={{
                            backgroundColor: open ? PALETTE.brown0 : "#f3f4f6",
                            color: open ? "#fff" : "#d1d5db",
                          }}
                        >
                          {d.label.slice(0, 1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-2xl border bg-white overflow-hidden"
                style={{ borderColor: "#ede5dc" }}
              >
                <div
                  className="px-5 py-3.5 border-b flex items-center justify-between"
                  style={{
                    borderColor: "#ede5dc",
                    backgroundColor: PALETTE.brown4,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: PALETTE.brown0 }} />
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: PALETTE.brown1 }}
                    >
                      Jadwal Mingguan
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#9a8a7a" }}>
                    {activeCount} / 7 hari aktif
                  </span>
                </div>

                {loadingSchedules ? (
                  <div className="flex justify-center py-16">
                    <span
                      className="loading loading-spinner"
                      style={{ color: PALETTE.brown0 }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block px-5">
                      <div
                        className="grid py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b"
                        style={{
                          gridTemplateColumns: "140px 80px 1fr auto",
                          color: "#b8a898",
                          borderColor: "#ede5dc",
                        }}
                      >
                        <span>Hari</span>
                        <span>Status</span>
                        <span>Jam Operasional</span>
                        <span className="w-16 text-right">Durasi</span>
                      </div>

                      {schedules.map((s) => (
                        <DayRow
                          key={s.day_of_week}
                          s={s}
                          isSuperUser={isSuperUser}
                          onToggle={handleToggle}
                          onChange={handleChange}
                        />
                      ))}

                      <style>{`.last-row-no-border > div:last-child { border-bottom: none; }`}</style>
                    </div>

                    <div className="md:hidden p-4 space-y-2.5">
                      {schedules.map((s) => (
                        <DayCard
                          key={s.day_of_week}
                          s={s}
                          isSuperUser={isSuperUser}
                          onToggle={handleToggle}
                          onChange={handleChange}
                        />
                      ))}
                    </div>

                    <div
                      className="flex items-start gap-2.5 px-5 py-3 border-t text-xs"
                      style={{ borderColor: "#ede5dc", color: "#9a8a7a" }}
                    >
                      <Info
                        size={12}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: PALETTE.brown2 }}
                      />
                      <span>
                        Hari dengan status{" "}
                        <strong style={{ color: PALETTE.brown0 }}>Tutup</strong>{" "}
                        tidak menerima antrian. Pengunjung tidak dapat mengambil
                        nomor pada hari tersebut.
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!loadingSchedules &&
                (isSuperUser ? (
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
                      style={{ backgroundColor: PALETTE.brown0 }}
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm" />
                          Menyimpan…
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Simpan Jadwal
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm"
                    style={{
                      borderColor: "#fed7aa",
                      backgroundColor: "#fff7ed",
                      color: "#9a3412",
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "#f97316" }}
                    />
                    <span>
                      Hanya <strong>Super User</strong> yang dapat mengubah
                      jadwal operasional.
                    </span>
                  </div>
                ))}
            </>
          ) : (
            <div
              className="rounded-2xl border bg-white flex flex-col items-center justify-center py-20 gap-3"
              style={{ borderColor: "#ede5dc" }}
            >
              <Clock size={32} style={{ color: PALETTE.brown2 }} />
              <p className="font-semibold" style={{ color: "#9a8a7a" }}>
                Pilih unit untuk melihat jadwal
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ color: "#1a1a1a", fontFamily: "'Georgia', serif" }}
      >
        Jam Operasional
      </h1>
      <p className="mt-1 text-sm" style={{ color: "#9a8a7a" }}>
        Atur jam buka &amp; tutup per unit untuk setiap hari dalam seminggu
      </p>
    </div>
  );
}
