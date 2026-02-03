import { useEffect, useState, useCallback, useRef } from "react";
import { unitService, queueService } from "../services/api";
import logo from "../assets/images/logo.webp";

const API_URL = import.meta.env.VITE_API_URL;

export default function UnitPage() {
  const [units, setUnits] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [loadingTake, setLoadingTake] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await unitService.getAll({
        isActive: "y",
        page: 1,
        limit: 100,
      });
      setUnits(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openUnit = async (unit) => {
    if (queueStatus?.queue === "closed") {
      alert(
        `Antrian belum dibuka\nJam operasional: ${queueStatus.jam_buka} - ${queueStatus.jam_tutup}`
      );
      return;
    }

    setSelectedUnit(unit);
    setModalOpen(true);

    try {
      const res = await unitService.getServicesStatus(unit.id);
      setServices(res.data?.services || []);
    } catch (err) {
      console.error(err);
      setServices([]);
    }
  };

  const handleTakeQueue = async (service) => {
    if (!selectedUnit || loadingTake) return;

    try {
      setLoadingTake(true);
      const res = await queueService.take({
        unit_id: selectedUnit.id,
        service_id: service.id,
      });

      if (res.success) {
        setTicketData(res.data);
        console.log(res.data);
        setModalOpen(false);
        setTicketModal(true);

        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal mengambil antrian");
    } finally {
      setLoadingTake(false);
    }
  };

  const closeTicketModal = () => {
    setTicketModal(false);
    setTicketData(null);
    setSelectedUnit(null);
    setServices([]);
  };

  useEffect(() => {
    loadUnits();

    const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${API_URL.replace(
      /^https?:\/\//,
      ""
    )}/ws/units`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "units_updated") {
        loadUnits();
      }
      if (payload.type === "status" || payload.type === "config_update") {
        setQueueStatus(payload);
      }
    };

    return () => ws.close();
  }, [loadUnits]);
  useEffect(() => {
    const handleAfterPrint = () => {
      if (ticketModal) {
        setTimeout(() => {
          closeTicketModal();
        }, 300);
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [ticketModal]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/60">Memuat data unit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-md">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-base-200/30 print:hidden">
        <div className="container mx-auto px-4 py-8 md:py-4 max-w-6xl">
          <div className="text-center justify-center items-center flex flex-col mb-6 space-y-3">
            <img src={logo} alt="Logo Kabupaten" className="h-20 w-20" />
            <p className="text-black font-bold text-lg">PILIH LOKET LAYANAN</p>
          </div>

          {queueStatus?.queue === "closed" && (
            <div className="alert alert-error mb-6 shadow-lg">
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-bold">{queueStatus.message}</p>
                <p className="text-sm">
                  Jam operasional: {queueStatus.jam_buka} -{" "}
                  {queueStatus.jam_tutup}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
            {units.map((unit, index) => {
              const isQueueClosed = queueStatus?.queue === "closed";

              return (
                <div
                  key={unit.id}
                  onClick={() => !isQueueClosed && openUnit(unit)}
                  className={`group ${
                    isQueueClosed
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`card bg-base-100 border-2 transition-all duration-300 ${
                      isQueueClosed
                        ? "border-base-300"
                        : "border-base-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
                    }`}
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2
                            className={`card-title text-xl md:text-2xl mb-2 transition-colors ${
                              isQueueClosed ? "" : "group-hover:text-primary"
                            }`}
                          >
                            {unit.nama_unit}
                          </h2>
                          <p className="text-sm text-base-content/60">
                            {isQueueClosed
                              ? "Antrian belum dibuka"
                              : "Klik untuk melihat layanan tersedia"}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                              isQueueClosed
                                ? "bg-base-300"
                                : "bg-primary/10 group-hover:bg-primary/20"
                            }`}
                          >
                            {isQueueClosed ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-base-content/40"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-primary"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {units.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-8 bg-base-100 rounded-2xl border-2 border-dashed border-base-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16 mx-auto mb-4 text-base-content/40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                  />
                </svg>
                <p className="text-lg font-semibold mb-1">
                  Belum ada unit tersedia
                </p>
                <p className="text-sm text-base-content/60">
                  Silakan hubungi administrator
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <dialog className={`modal ${modalOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-base-300">
            <div>
              <h3 className="font-bold text-2xl">{selectedUnit?.nama_unit}</h3>
              <p className="text-sm text-base-content/60 mt-1">
                Pilih layanan yang Anda butuhkan
              </p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {services.map((service) => {
              const isUnlimited = service.limits_queue === 0;
              const isAvailable =
                service.is_active === "y" &&
                service.status === "available" &&
                (isUnlimited || service.remaining_quota > 0);

              return (
                <div
                  key={service.id}
                  className={`card border-2 transition-all ${
                    isAvailable
                      ? "border-base-300 hover:border-primary bg-base-100 hover:shadow-lg cursor-pointer"
                      : "border-base-300 bg-base-200 opacity-60"
                  }`}
                  onClick={() => isAvailable && handleTakeQueue(service)}
                >
                  <div className="card-body p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">
                            {service.nama_service}
                          </h4>
                          <span
                            className={`badge badge-sm ${
                              isAvailable
                                ? isUnlimited
                                  ? "badge-info"
                                  : "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {isUnlimited && isAvailable
                              ? "Unlimited"
                              : isAvailable
                              ? "Tersedia"
                              : "Tutup"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-base-content/70">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 6h.008v.008H6V6z"
                              />
                            </svg>
                            <span>Loket {service.loket}</span>
                          </div>

                          {isAvailable ? (
                            <div className="flex items-center gap-2 text-success">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-medium">
                                {isUnlimited
                                  ? "Kuota tidak terbatas"
                                  : `Sisa ${service.remaining_quota} kuota`}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-error">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                              </svg>
                              <span className="font-medium">
                                {service.status_message}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isAvailable && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-5 h-5 text-primary"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {services.length === 0 && (
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16 mx-auto mb-4 text-base-content/40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
                <p className="text-base-content/60">
                  Tidak ada layanan tersedia
                </p>
              </div>
            )}
          </div>

          {loadingTake && (
            <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 font-semibold">Mengambil nomor antrian...</p>
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setModalOpen(false)}>close</button>
        </form>
      </dialog>

      <dialog className={`modal ${ticketModal ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md print:shadow-none print:max-w-full print:m-0">
          <div className="text-center space-y-6 print:hidden">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-12 h-12 text-success"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-2xl mb-2">Nomor Antrian Anda</h3>
              <p className="text-base-content/60">
                Silakan tunggu nomor Anda dipanggil
              </p>
            </div>

            <div className="card bg-base-100 border-4 border-base-300">
              <div className="card-body p-8">
                <div className="text-center space-y-4">
                  <p className="text-sm text-base-content/60">
                    {new Date(ticketData?.ticket?.created_at).toLocaleString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "UTC",
                      }
                    )}
                  </p>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">
                      Layanan Antri
                    </p>
                    <p className="font-bold text-lg">
                      {ticketData?.unit_name?.toUpperCase()}
                    </p>
                  </div>
                  <div className="border-t-2 border-b-2 border-dashed border-base-300 py-4 my-4">
                    <p className="text-7xl font-black tracking-wider">
                      {ticketData?.ticket?.ticket_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">
                      Di Loket{" "}
                      {
                        services.find(
                          (s) => s.id === ticketData?.ticket?.service_id
                        )?.loket
                      }
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      Harap tunggu giliran Anda
                    </p>
                    <p className="text-xs text-base-content/60 mt-2">
                      Menunggu: {ticketData?.queue_number - 1} orang
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="btn btn-primary flex-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                  />
                </svg>
                Cetak Tiket
              </button>
              <button
                onClick={closeTicketModal}
                className="btn btn-outline flex-1"
              >
                Selesai
              </button>
            </div>
          </div>

          <div className="hidden print:block ticket-thermal">
            <div className="text-center" style={{ padding: "3mm 4mm" }}>
              <p
                style={{
                  fontSize: "12pt",
                  fontWeight: "bold",
                  marginBottom: "0.5mm",
                  color: "#000",
                  lineHeight: "1.3",
                  letterSpacing: "0.5px",
                }}
              >
                MAL PELAYANAN PUBLIK
              </p>
              <p
                style={{
                  fontSize: "10pt",
                  fontWeight: "bold",
                  marginBottom: "2mm",
                  color: "#000",
                  lineHeight: "1.3",
                }}
              >
                KABUPATEN PEKALONGAN
              </p>

              <div
                style={{
                  borderTop: "1px dashed #000",
                  margin: "2mm 0",
                  width: "100%",
                }}
              ></div>

              <p
                style={{
                  fontSize: "7pt",
                  fontWeight: "bold",
                  marginBottom: "2mm",
                  color: "#000",
                  lineHeight: "1.2",
                  letterSpacing: "1px",
                }}
              >
                NOMOR ANTRIAN
              </p>

              <p
                style={{
                  fontSize: "32pt",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  margin: "2mm 0",
                  lineHeight: "1",
                }}
              >
                {ticketData?.ticket?.ticket_code}
              </p>

              <div
                style={{
                  borderTop: "1px dashed #000",
                  margin: "2mm 0",
                  width: "100%",
                }}
              ></div>

              <p
                style={{
                  fontSize: "7pt",
                  marginBottom: "1mm",
                  color: "#000",
                  lineHeight: "1.3",
                }}
              >
                Silakan menuju ke loket
              </p>
              <p
                style={{
                  fontSize: "8pt",
                  fontWeight: "bold",
                  marginBottom: "0.5mm",
                  color: "#000",
                  lineHeight: "1.3",
                }}
              >
                {ticketData?.unit_name}
              </p>
              <p
                style={{
                  fontSize: "8pt",
                  fontWeight: "bold",
                  marginBottom: "2mm",
                  color: "#000",
                  lineHeight: "1.3",
                }}
              >
                ({ticketData?.service_name})
              </p>

              <p
                style={{
                  fontSize: "6.5pt",
                  fontWeight: "normal",
                  marginBottom: "1.5mm",
                  lineHeight: "1.3",
                  fontStyle: "italic",
                }}
              >
                Harap menunggu panggilan
              </p>

              <p style={{ fontSize: "6pt", color: "#000", lineHeight: "1.2" }}>
                Dicetak:{" "}
                {ticketData?.ticket?.created_at &&
                  new Date(ticketData.ticket.created_at).toLocaleString(
                    "id-ID",
                    {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }
                  ) +
                    " pukul " +
                    new Date(ticketData.ticket.created_at).toLocaleString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      }
                    )}
              </p>
            </div>
          </div>
        </div>
      </dialog>

      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            max-height: 100mm;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            height: auto;
          }
          
          body * {
            visibility: hidden;
            overflow: hidden;
          }
          
          .modal-box,
          .modal-box * {
            visibility: visible;
          }
          
          .modal-box {
            position: fixed !important;
            left: 0;
            top: 0;
            width: 80mm;
            height: auto;
            max-width: 80mm;
            max-height: 100mm;
            box-shadow: none;
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible;
          }
          
          .ticket-thermal {
            width: 80mm;
            height: auto;
            max-height: 100mm;
            font-family: 'Courier New', monospace;
            color: #000;
            overflow: visible;
            box-sizing: border-box;
          }
        }
      `}</style>
    </>
  );
}
