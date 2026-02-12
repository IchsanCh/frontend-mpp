import React, { useEffect, useRef, useState } from "react";
import { showToast } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9080";
const BASE_AUDIO_URL = API_URL;
const CONFIG_API_URL = `${API_URL}/api/config`;

const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
const WS_URL = `${wsProtocol}://${API_URL.replace(
  /^https?:\/\//,
  ""
)}/ws/queue`;

const MAX_RETRIES = 5;
const truncate = (text, max = 10) =>
  text.length > max ? text.slice(0, max) + "…" : text;
const DisplayAntrian = () => {
  const [queues, setQueues] = useState([]);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [currentlyDisplayed, setCurrentlyDisplayed] = useState(null);
  const [loketData, setLoketData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marqueeText, setMarqueeText] = useState(
    "Selamat Datang di Mal Pelayanan Publik"
  );
  const [audioInteracted, setAudioInteracted] = useState(false);
  const [activeLoket, setActiveLoket] = useState(null);
  const [selectedLoket, setSelectedLoket] = useState(null);

  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const processedCallsRef = useRef(new Set());
  const scrollContainerRef = useRef(null);
  const activeCardRef = useRef(null);
  const currentAudioRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeLoketTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const hasShownMaxRetryToast = useRef(false);
  const uiUpdateQueueRef = useRef([]);

  useEffect(() => {
    return () => {
      console.log("[CLEANUP] Component unmounting");

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }

      audioQueueRef.current = [];
      uiUpdateQueueRef.current = [];
      isPlayingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (activeLoketTimeoutRef.current) {
        clearTimeout(activeLoketTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      processedCallsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(CONFIG_API_URL);
        const result = await response.json();
        if (result.success && result.data?.text_marque) {
          setMarqueeText(result.data.text_marque);
        }
      } catch (err) {
        console.error("[CONFIG] Failed to fetch:", err);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  useEffect(() => {
    if (!queues || queues.length === 0) return;

    const loketMap = new Map();

    queues.forEach((queue) => {
      const unitId = queue.unit_id;

      if (!loketMap.has(unitId)) {
        loketMap.set(unitId, {
          unit_id: unitId,
          unit_name: queue.unit_name,
          loket: queue.loket,
          services: [],
          lastCall: null,
          lastCalledTime: null,
        });
      }

      const loket = loketMap.get(unitId);

      const existingService = loket.services.find(
        (s) => s.service_id === queue.service_id
      );

      if (!existingService) {
        loket.services.push({
          service_id: queue.service_id,
          service_name: queue.service_name,
          service_code: queue.service_code,
          ticket_code: queue.ticket_code,
          status: queue.status,
          last_called_at: queue.last_called_at,
        });
      }

      if (queue.last_called_at) {
        const callTime = new Date(queue.last_called_at);

        if (!loket.lastCalledTime || callTime > loket.lastCalledTime) {
          loket.lastCalledTime = callTime;
          loket.lastCall = {
            ticket_code: queue.ticket_code,
            service_name: queue.service_name,
            last_called_at: queue.last_called_at,
            status: queue.status,
          };
        }
      }
    });

    const loketArray = Array.from(loketMap.values()).sort((a, b) =>
      a.unit_name.localeCompare(b.unit_name)
    );

    setLoketData(loketArray);
  }, [queues]);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      if (retryCountRef.current >= MAX_RETRIES) {
        console.error(`[WS] Max retries (${MAX_RETRIES}) reached`);

        if (!hasShownMaxRetryToast.current) {
          hasShownMaxRetryToast.current = true;
          showToast(
            "Koneksi gagal. Halaman akan di-refresh otomatis dalam 5 detik...",
            "error"
          );

          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
        return;
      }

      if (retryCountRef.current > 0) {
        console.log(
          `[WS] Retry attempt ${retryCountRef.current}/${MAX_RETRIES}`
        );
        showToast(
          `Mencoba koneksi ulang... (${retryCountRef.current}/${MAX_RETRIES})`,
          "warning"
        );
      }

      console.log("[WS] Connecting to:", WS_URL);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");

        if (retryCountRef.current > 0) {
          showToast("Koneksi berhasil dipulihkan!", "success");
        }
        retryCountRef.current = 0;
        hasShownMaxRetryToast.current = false;

        processedCallsRef.current.clear();
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        console.log("[WS] Raw data received:", event.data);

        try {
          const message = JSON.parse(event.data);
          console.log("[WS] Parsed message:", message);

          if (message.type !== "queue_update") return;

          setQueues(message.data || []);

          if (!message.currently_playing) {
            if (!isPlayingRef.current) {
              setCurrentlyDisplayed(null);
              setPendingUpdate(null);
              setActiveLoket(null);
            }
            return;
          }

          const current = message.currently_playing;
          const playKey = `${current.id}_${current.last_called_at}`;

          if (processedCallsRef.current.has(playKey)) {
            console.log(`[WS] Already processed: ${playKey}`);
            return;
          }

          processedCallsRef.current.add(playKey);
          console.log(`[WS] New call: ${current.ticket_code} (${playKey})`);

          if (isPlayingRef.current) {
            console.log(
              `[UI] Audio playing, queueing update for ${current.ticket_code}`
            );
            uiUpdateQueueRef.current.push(current);
            return;
          }

          processCall(current);
        } catch (err) {
          console.error("[WS] Message parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
      };

      ws.onclose = (event) => {
        console.warn("[WS] Closed:", event.code, event.reason);
        wsRef.current = null;

        if (isMounted && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;

          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current - 1),
            10000
          );

          console.log(
            `[WS] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeLoket && activeCardRef.current && scrollContainerRef.current) {
      const timeout = setTimeout(() => {
        activeCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [activeLoket]);

  const processCall = (callData) => {
    console.log(`[UI] Processing call: ${callData.ticket_code}`);

    setCurrentlyDisplayed(callData);
    setActiveLoket(callData.unit_name);

    if (activeLoketTimeoutRef.current) {
      clearTimeout(activeLoketTimeoutRef.current);
    }

    if (!callData.should_play_audio) {
      console.log(`[AUDIO] Muted for ${callData.ticket_code}`);

      activeLoketTimeoutRef.current = setTimeout(() => {
        setActiveLoket(null);
      }, 3000);

      processNextQueuedUpdate();
      return;
    }

    if (
      Array.isArray(callData.audio_paths) &&
      callData.audio_paths.length > 0
    ) {
      console.log(`[AUDIO] Enqueuing: ${callData.ticket_code}`);
      enqueueAudio(callData, () => {
        console.log(`[AUDIO] Finished: ${callData.ticket_code}`);

        activeLoketTimeoutRef.current = setTimeout(() => {
          setActiveLoket(null);
        }, 3000);

        processNextQueuedUpdate();
      });
    } else {
      activeLoketTimeoutRef.current = setTimeout(() => {
        setActiveLoket(null);
      }, 3000);

      processNextQueuedUpdate();
    }
  };

  const processNextQueuedUpdate = () => {
    console.log(
      `[UI] Checking queue, length: ${uiUpdateQueueRef.current.length}`
    );

    if (uiUpdateQueueRef.current.length > 0) {
      const nextUpdate = uiUpdateQueueRef.current.shift();
      console.log(`[UI] Processing queued update: ${nextUpdate.ticket_code}`);

      processCall(nextUpdate);
    }
  };

  const enqueueAudio = (queueData, onFinishCallback) => {
    audioQueueRef.current.push({ queueData, onFinishCallback });
    console.log(
      `[AUDIO] Queue length: ${audioQueueRef.current.length}, isPlaying: ${isPlayingRef.current}`
    );
    playNextAudio();
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current) {
      console.log("[AUDIO] Already playing, waiting...");
      return;
    }

    if (audioQueueRef.current.length === 0) {
      console.log("[AUDIO] Queue empty");
      return;
    }

    const next = audioQueueRef.current.shift();
    const { queueData, onFinishCallback } = next;

    isPlayingRef.current = true;
    console.log(`[AUDIO] START playing: ${queueData.ticket_code}`);

    try {
      for (const path of queueData.audio_paths) {
        await playAudio(`${BASE_AUDIO_URL}/${path}`);
      }
      console.log(`[AUDIO] DONE playing: ${queueData.ticket_code}`);

      if (onFinishCallback) {
        onFinishCallback();
      }
    } catch (err) {
      console.error("[AUDIO] Playback error:", err);
    } finally {
      isPlayingRef.current = false;
      playNextAudio();
    }
  };

  const playAudio = (src) =>
    new Promise((resolve, reject) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
      }

      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      audio.playbackRate = 1.0;
      currentAudioRef.current = audio;

      audio.addEventListener(
        "canplaythrough",
        () => {
          audio
            .play()
            .then(() => {
              console.log(`[AUDIO] Playing: ${src}`);
            })
            .catch((err) => {
              console.error(`[AUDIO] Play error: ${err.message}`);
              currentAudioRef.current = null;
              resolve();
            });
        },
        { once: true }
      );

      audio.onended = () => {
        currentAudioRef.current = null;
        resolve();
      };

      audio.onerror = (err) => {
        console.error(`[AUDIO] Failed to load: ${src}`, err);
        currentAudioRef.current = null;
        resolve();
      };

      audio.load();
    });

  const handleAudioInteraction = () => {
    setAudioInteracted(true);
    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silentAudio.play().catch(() => {});
  };

  const handleLoketClick = (loket) => {
    setSelectedLoket(loket);
    document.getElementById("loket_modal").showModal();
  };

  const formatText = (text) => text?.replace(/_/g, " ").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-center md:text-left">
            DISPLAY ANTRIAN MPP
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl md:text-3xl font-mono text-emerald-400 font-bold">
              {formatTime(currentTime)}
            </span>
            {!audioInteracted && (
              <button
                onClick={handleAudioInteraction}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50"
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
      </header>

      <main className="flex-1 p-3 md:p-6 overflow-y-auto pb-20">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <section className="mb-6">
            <div
              className={`rounded-2xl p-6 flex flex-col justify-center items-center transition-all duration-500 ${
                currentlyDisplayed
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50 scale-[1.02]"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {currentlyDisplayed ? (
                <>
                  <p className="text-sm text-white/90 mb-2">
                    Sekarang Melayani
                  </p>
                  <p className="text-5xl font-bold mb-4 animate-pulse">
                    {currentlyDisplayed.ticket_code}
                  </p>
                  <p className="text-xl font-semibold text-center">
                    {currentlyDisplayed.service_name}
                  </p>

                  <div className="mt-6 bg-white/20 backdrop-blur px-8 py-3 rounded-xl">
                    <p className="text-md text-center font-semibold">Loket</p>
                    <p className="text-3xl font-bold">
                      {formatText(currentlyDisplayed.loket)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xl text-slate-500">Menunggu Antrian</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 text-slate-300">
              Daftar Loket
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {loketData.map((loket) => {
                const isActive = activeLoket === loket.unit_name;
                const displayTicket = loket.lastCall?.ticket_code ?? "-";

                return (
                  <div
                    key={loket.unit_id}
                    ref={isActive ? activeCardRef : null}
                    onClick={() => handleLoketClick(loket)}
                    className={`rounded-xl p-4 text-center transition-all duration-500 border-2 cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/50 scale-105"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                        isActive ? "bg-white/20" : "bg-slate-800"
                      }`}
                    >
                      LOKET {formatText(loket.loket)}
                    </div>
                    <p
                      className={`text-3xl font-bold ${
                        isActive ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {displayTicket}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex gap-6 max-w-7xl mx-auto h-[calc(100vh-200px)]">
          <section className="w-2/5 flex-shrink-0">
            <div
              className={`h-full rounded-2xl p-8 flex flex-col justify-center items-center transition-all duration-500 ${
                currentlyDisplayed
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {currentlyDisplayed ? (
                <>
                  <p className="text-xl text-white/90 mb-2">
                    Sekarang Melayani
                  </p>
                  <p className="text-7xl font-bold mb-4 animate-pulse">
                    {currentlyDisplayed.ticket_code}
                  </p>
                  <p className="text-3xl font-semibold text-center">
                    {currentlyDisplayed.service_name}
                  </p>
                  <div className="mt-8 bg-white/20 backdrop-blur px-10 py-4 rounded-xl">
                    <p className="text-md text-center text-white font-semibold">
                      Loket
                    </p>
                    <p className="text-3xl font-bold">
                      {formatText(currentlyDisplayed.loket)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-2xl text-slate-500">Menunggu Antrian</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex-1 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-slate-300 flex-shrink-0">
              Daftar Loket
            </h2>
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-2 scrollbar-thin"
            >
              <div className="grid grid-cols-3 gap-4 pb-4">
                {loketData.map((loket, index) => {
                  const isActive = activeLoket === loket.unit_name;
                  const displayTicket = loket.lastCall?.ticket_code ?? "-";

                  const hasRealData = loket.services.some((service) => {
                    const code = loket.lastCall?.ticket_code;
                    return code && code !== "-" && !code.endsWith("000");
                  });

                  return (
                    <div
                      key={loket.unit_id}
                      ref={isActive ? activeCardRef : null}
                      onClick={() => handleLoketClick(loket)}
                      className={`rounded-xl p-6 text-center transition-all duration-500 border-2 cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/50 scale-100"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                      style={{
                        transition: "all 500ms ease",
                        order: index,
                      }}
                    >
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                          isActive ? "bg-white/20" : "bg-slate-800"
                        }`}
                      >
                        LOKET {formatText(loket.loket)}
                      </div>
                      <p
                        className={`text-4xl font-bold ${
                          isActive ? "text-white" : "text-slate-200"
                        }`}
                      >
                        {displayTicket}
                      </p>

                      {/* Service list - only show if loket has real data */}
                      {hasRealData && (
                        <div className="mt-4 text-left pt-4 border-t border-slate-700/50">
                          <div className="space-y-1">
                            {loket.services.map((service) => (
                              <div
                                key={service.service_id}
                                className={`text-sm ${
                                  isActive ? "text-white/90" : "text-slate-300"
                                }`}
                              >
                                <span className="font-medium">
                                  {truncate(service.service_name ?? "", 15)}:
                                </span>{" "}
                                <span className={"font-bold text-white"}>
                                  {service.status === "called"
                                    ? service.ticket_code
                                    : "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-3 overflow-hidden shadow-lg">
        <div className="marquee-wrapper">
          <div className="marquee-content">
            <span className="text-sm md:text-base text-slate-300 font-medium whitespace-nowrap">
              {marqueeText}
            </span>
          </div>
        </div>
      </footer>

      {/* Modal - DaisyUI v5 */}
      <dialog id="loket_modal" className="modal">
        <div className="modal-box bg-slate-900 border border-slate-700 max-w-2xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle absolute right-2 top-2 border-white border-1 bg-transparent text-white hover:border-red-500 hover:text-black hover:bg-red-500">
              ✕
            </button>
          </form>

          {selectedLoket && (
            <>
              <h3 className="font-bold text-2xl mb-2 text-emerald-400">
                {formatText(selectedLoket.loket)}
              </h3>

              <div className="space-y-3">
                <h4 className="font-semibold text-lg text-slate-300 mb-3">
                  Layanan & Antrian Terkini:
                </h4>

                {selectedLoket.services.map((service) => (
                  <div
                    key={service.service_id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {service.service_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                          {service.status === "called"
                            ? service.ticket_code
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <style jsx>{`
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .marquee-content {
          display: inline-flex;
          animation: marquee 25s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }

        @keyframes marquee {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .marquee-wrapper:hover .marquee-content {
          animation-play-state: paused;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default DisplayAntrian;
