import React, { useEffect, useRef, useState } from "react";
import { showToast } from "../utils/toast";
import { useAudioManager } from "../utils/useAudioManager";
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
  const [activeLoket, setActiveLoket] = useState(null);
  const [selectedLoket, setSelectedLoket] = useState(null);

  const wsRef = useRef(null);
  const processedCallsRef = useRef(new Set());
  const scrollContainerRef = useRef(null);
  const activeCardRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeLoketTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const hasShownMaxRetryToast = useRef(false);
  const uiUpdateQueueRef = useRef([]);
  const autoScrollIntervalRef = useRef(null);
  const scrollDirectionRef = useRef(1);

  const { playSequence, initializeAudio } = useAudioManager(BASE_AUDIO_URL);
  const audioInitializedRef = useRef(false);
  const isAudioPlayingRef = useRef(false);

  const handleUserInteraction = async () => {
    if (!audioInitializedRef.current) {
      const ok = await initializeAudio();
      if (ok) {
        audioInitializedRef.current = true;
        console.log("[AUDIO] AudioContext initialized via user interaction");
      }
    }
  };

  useEffect(() => {
    return () => {
      console.log("[CLEANUP] Component unmounting");

      uiUpdateQueueRef.current = [];

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (activeLoketTimeoutRef.current) {
        clearTimeout(activeLoketTimeoutRef.current);
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      processedCallsRef.current.clear();
      scrollDirectionRef.current = 1;
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
      } else {
        // Update kalau sudah ada
        existingService.ticket_code = queue.ticket_code;
        existingService.status = queue.status;
        existingService.last_called_at = queue.last_called_at;
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
            setCurrentlyDisplayed(null);
            setPendingUpdate(null);
            setActiveLoket(null);
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

          if (isAudioPlayingRef.current) {
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
    const container = scrollContainerRef.current;
    if (!container) return;

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    if (activeLoket) {
      console.log("[AUTO-SCROLL] ⏸️ PAUSED - active loket:", activeLoket);
      return;
    }

    console.log("[AUTO-SCROLL] ▶️ STARTING/RESUMING auto-scroll");

    const scrollSpeed = 1;

    autoScrollIntervalRef.current = setInterval(() => {
      const currentContainer = scrollContainerRef.current;
      if (!currentContainer) return;

      const maxScroll =
        currentContainer.scrollHeight - currentContainer.clientHeight;
      const currentScroll = currentContainer.scrollTop;

      if (scrollDirectionRef.current === 1 && currentScroll >= maxScroll - 5) {
        scrollDirectionRef.current = -1;
        console.log("[AUTO-SCROLL] 🔼 Reached bottom, now scrolling UP");
      } else if (scrollDirectionRef.current === -1 && currentScroll <= 5) {
        scrollDirectionRef.current = 1;
        console.log("[AUTO-SCROLL] 🔽 Reached top, now scrolling DOWN");
      }

      currentContainer.scrollTop += scrollDirectionRef.current * scrollSpeed;
    }, 30);

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
        console.log("[AUTO-SCROLL] 🧹 Cleaned up");
      }
    };
  }, [activeLoket]);

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
      const normalizedPaths = callData.audio_paths.map((p) =>
        p.replace(/^public\//, "")
      );

      console.log(
        `[AUDIO] Playing sequence for ${callData.ticket_code}:`,
        normalizedPaths
      );

      isAudioPlayingRef.current = true;

      playSequence(
        normalizedPaths,
        () => {
          console.log(`[AUDIO] Finished: ${callData.ticket_code}`);
          isAudioPlayingRef.current = false;
          activeLoketTimeoutRef.current = setTimeout(() => {
            setActiveLoket(null);
          }, 3000);
          processNextQueuedUpdate();
        },
        (err) => {
          console.error(`[AUDIO] Error playing ${callData.ticket_code}:`, err);
          isAudioPlayingRef.current = false;
          activeLoketTimeoutRef.current = setTimeout(() => {
            setActiveLoket(null);
          }, 3000);
          processNextQueuedUpdate();
        }
      );
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

  const handleLoketClick = (loket) => {
    setSelectedLoket(loket);
    document.getElementById("loket_modal").showModal();
  };

  const formatText = (text) => text?.replace(/_/g, " ").toUpperCase();

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex flex-col"
      onClick={handleUserInteraction}
    >
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-center md:text-left">
            DISPLAY ANTRIAN MPP
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl md:text-3xl font-mono text-emerald-400 font-bold">
              {formatTime(currentTime)}
            </span>
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
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50"
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
                        ? "bg-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/50"
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
          {/* Smaller "Sekarang Melayani" Card */}
          <section className="w-1/4 flex-shrink-0">
            <div
              className={`h-full rounded-2xl p-6 flex flex-col justify-center items-center transition-all duration-500 ${
                currentlyDisplayed
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {currentlyDisplayed ? (
                <>
                  <p className="text-sm text-white/90 mb-2">
                    Sekarang Melayani
                  </p>
                  <p className="text-5xl font-bold mb-3 animate-pulse">
                    {currentlyDisplayed.ticket_code}
                  </p>
                  <p className="text-xl font-semibold text-center">
                    {currentlyDisplayed.service_name}
                  </p>
                  <div className="mt-6 bg-white/20 backdrop-blur px-6 py-3 rounded-xl">
                    <p className="text-xs text-center text-white font-semibold">
                      Loket
                    </p>
                    <p className="text-2xl font-bold">
                      {formatText(currentlyDisplayed.loket)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-20 h-20 mx-auto mb-4 text-slate-600"
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
                  <p className="text-lg text-slate-500">Menunggu Antrian</p>
                </div>
              )}
            </div>
          </section>

          {/* Daftar Loket with 4 columns and auto-scroll */}
          <section className="flex-1 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-slate-300 flex-shrink-0">
              Daftar Loket
            </h2>
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-2 scrollbar-thin"
            >
              <div className="grid grid-cols-4 gap-2 pb-4">
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
                      className={`rounded-xl p-4 text-center transition-all duration-500 border-2 cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 border-emerald-400 shadow-xl shadow-emerald-500/50"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                      style={{
                        transition: "all 500ms ease",
                        order: index,
                      }}
                    >
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
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

                      {/* Service list - only show if loket has real data */}
                      {hasRealData && (
                        <div className="mt-3 text-left pt-3 border-t border-slate-700/50">
                          <div className="space-y-1">
                            {loket.services.map((service) => (
                              <div
                                key={service.service_id}
                                className={`text-xs ${
                                  isActive ? "text-white/90" : "text-slate-300"
                                }`}
                              >
                                <span className="font-medium">
                                  {truncate(service.service_name ?? "", 12)}:
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
