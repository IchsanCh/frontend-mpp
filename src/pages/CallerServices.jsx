import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { queueService } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9080";
const BASE_AUDIO_URL = API_URL;
const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
const WS_URL = `${wsProtocol}://${API_URL.replace(
  /^https?:\/\//,
  ""
)}/ws/queue`;

export default function CallerService() {
  const { serviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const serviceData = location.state?.service;
  const unitInfo = location.state?.unitInfo;

  const [currentTicket, setCurrentTicket] = useState(null);
  const [nextTicket, setNextTicket] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioInteracted, setAudioInteracted] = useState(false);

  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const processedCallsRef = useRef(new Set());
  const currentAudioRef = useRef(null);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    audioQueueRef.current = [];
    processedCallsRef.current.clear();
    isPlayingRef.current = false;

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, [serviceId]);

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to queue updates");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type !== "queue_update") return;

      const stats = message.service_stats?.[serviceId];
      if (stats) {
        setWaitingCount(stats.waiting_count);
        setHasNext(stats.has_next);
      } else {
        setWaitingCount(0);
        setHasNext(false);
      }

      const serviceTickets = (message.data || []).filter(
        (q) => q.service_id === parseInt(serviceId)
      );

      const called = serviceTickets.find((q) => q.status === "called");
      const waiting = serviceTickets.filter((q) => q.status === "waiting");

      setCurrentTicket(called || null);
      setNextTicket(waiting[0] || null);

      if (
        called &&
        called.service_id === parseInt(serviceId) &&
        called.last_called_at
      ) {
        const playKey = `${called.id}_${called.last_called_at}`;

        if (processedCallsRef.current.has(playKey)) {
          return;
        }

        if (
          Array.isArray(called.audio_paths) &&
          called.audio_paths.length > 0
        ) {
          console.log(`[AUDIO] Enqueuing audio for ${called.ticket_code}`);
          processedCallsRef.current.add(playKey);
          enqueueAudio(called);
        }
      }

      console.log("WS message data:", message.data);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error", err);
    };

    ws.onclose = () => {
      console.warn("[WS] Closed, reconnecting in 3s...");
      setTimeout(connectWebSocket, 3000);
    };
  };

  const enqueueAudio = (queueData) => {
    audioQueueRef.current.push(queueData);
    playNextAudio();
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const next = audioQueueRef.current.shift();
    if (next.service_id !== parseInt(serviceId)) {
      isPlayingRef.current = false;
      playNextAudio();
      return;
    }
    isPlayingRef.current = true;

    console.log(`[AUDIO] Playing ${next.ticket_code}`);

    try {
      for (const path of next.audio_paths) {
        await playAudio(`${BASE_AUDIO_URL}/${path}`);
      }
      console.log(`[AUDIO] Finished playing ${next.ticket_code}`);
    } catch (err) {
      console.error("[AUDIO] Playback error", err);
    } finally {
      isPlayingRef.current = false;
      setTimeout(playNextAudio, 500);
    }
  };
  console.log(nextTicket);

  const playAudio = (src) =>
    new Promise((resolve) => {
      const audio = new Audio(src);
      currentAudioRef.current = audio;
      audio.onended = resolve;
      audio.onerror = () => {
        console.error(`[AUDIO] Failed to load: ${src}`);
        resolve();
      };
      audio.play().catch((err) => {
        console.error(`[AUDIO] Play error: ${err.message}`);
        resolve();
      });
    });

  const handleAudioInteraction = () => {
    setAudioInteracted(true);
    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silentAudio.play().catch(() => {});
  };

  const handleNext = async () => {
    if (loading || !hasNext) return;

    try {
      setLoading(true);

      const res = await queueService.callNext(
        { service_id: parseInt(serviceId) },
        token
      );

      if (!res.success) {
        alert(res.error || "Gagal memanggil antrian");
      }
    } catch (err) {
      console.error("Error calling next:", err);
      alert(err.response?.data?.error || "Gagal memanggil antrian");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (loading || !hasNext) return;

    const confirm = window.confirm(
      `Skip antrian ${currentTicket?.ticket_code || "ini"}?`
    );
    if (!confirm) return;

    try {
      setLoading(true);

      const res = await queueService.skipAndNext(
        { service_id: parseInt(serviceId) },
        token
      );

      if (!res.success) {
        alert(res.error || "Gagal skip antrian");
      }
    } catch (err) {
      console.error("Error skipping:", err);
      alert(err.response?.data?.error || "Gagal skip antrian");
    } finally {
      setLoading(false);
    }
  };
  const handleRecall = async () => {
    if (!currentTicket || loading) return;

    const confirm = window.confirm(
      `Recall antrian ${currentTicket.ticket_code}?`
    );
    if (!confirm) return;

    try {
      setLoading(true);

      const res = await queueService.recall(currentTicket.id, token);

      if (!res.success) {
        alert(res.error || "Gagal recall antrian");
      }
    } catch (err) {
      console.error("Error recalling:", err);
      alert(err.response?.data?.error || "Gagal recall antrian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors border border-slate-700/50"
              >
                <svg
                  className="w-5 h-5 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {serviceData?.nama_service || "Caller"}
                </h1>
                <p className="text-sm text-slate-400">
                  {unitInfo?.name} • Loket {serviceData?.loket}
                </p>
              </div>
            </div>

            {!audioInteracted && (
              <button
                onClick={handleAudioInteraction}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Aktifkan Audio
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <div
              className={`rounded-3xl p-8 md:p-12 transition-all duration-500 ${
                currentTicket
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-500/30"
                  : "bg-slate-900/50 border-2 border-dashed border-slate-700/50"
              }`}
            >
              {currentTicket ? (
                <div className="text-center">
                  <p className="text-white/80 text-sm md:text-base mb-3">
                    Sedang Melayani
                  </p>
                  <p className="text-6xl md:text-8xl font-black text-white mb-6 tracking-wider animate-pulse">
                    {currentTicket.ticket_code}
                  </p>
                  <div className="inline-block bg-white/20 backdrop-blur px-8 py-4 rounded-2xl">
                    <p className="text-white/80 text-xs mb-1">Loket</p>
                    <p className="text-4xl md:text-5xl font-bold text-white">
                      {currentTicket.loket}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-20 h-20 mx-auto mb-4 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xl text-slate-500 font-semibold">
                    Belum ada antrian dipanggil
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Klik "Next" untuk memanggil antrian pertama
                  </p>
                </div>
              )}
            </div>

            {currentTicket && (
              <button
                onClick={handleRecall}
                disabled={loading}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                Recall
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Antrian Menunggu</p>
                  <p className="text-3xl font-bold text-white">
                    {waitingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Antrian Selanjutnya</p>
                  <p className="text-3xl font-bold text-white">
                    {nextTicket?.ticket_code || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleNext}
              disabled={!hasNext || loading}
              className={`relative group overflow-hidden rounded-2xl p-6 font-bold text-lg transition-all duration-300 ${
                hasNext && !loading
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-1"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed border-2 border-slate-700/50"
              }`}
            >
              {hasNext && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              )}
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <span>Next</span>
                  </>
                )}
              </div>
            </button>

            <button
              onClick={handleSkip}
              disabled={!hasNext || loading}
              className={`relative group overflow-hidden rounded-2xl p-6 font-bold text-lg transition-all duration-300 ${
                hasNext && !loading
                  ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/50 hover:-translate-y-1"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed border-2 border-slate-700/50"
              }`}
            >
              {hasNext && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              )}
              <div className="relative flex items-center justify-center gap-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Skip</span>
              </div>
            </button>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium mb-1">
                  Informasi
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>
                    • Klik <strong className="text-white">Next</strong> untuk
                    memanggil antrian berikutnya
                  </li>
                  <li>
                    • Klik <strong className="text-white">Skip</strong> untuk
                    skip antrian saat ini
                  </li>
                  <li>
                    • Klik <strong className="text-white">Recall</strong> untuk
                    memanggil ulang antrian yang sedang dipanggil
                  </li>
                  <li>• Audio akan berbunyi otomatis saat memanggil antrian</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
