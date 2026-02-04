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

const DisplayAntrian = () => {
  const [queues, setQueues] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [displayedServices, setDisplayedServices] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marqueeText, setMarqueeText] = useState(
    "Selamat Datang di Mal Pelayanan Publik"
  );
  const [audioInteracted, setAudioInteracted] = useState(false);
  const [activeLoket, setActiveLoket] = useState(null);

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

  useEffect(() => {
    return () => {
      console.log("[CLEANUP] Component unmounting");

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }

      audioQueueRef.current = [];
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

        try {
          const message = JSON.parse(event.data);

          if (message.type !== "queue_update") return;

          setQueues(message.data || []);

          if (!message.currently_playing) {
            setCurrentlyPlaying(null);
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

          setCurrentlyPlaying(current);
          setActiveLoket(current.service_name);

          if (activeLoketTimeoutRef.current) {
            clearTimeout(activeLoketTimeoutRef.current);
          }

          if (!current.should_play_audio) {
            console.log(`[AUDIO] Muted for ${current.ticket_code}`);
            updateServiceDisplay(current.service_id, current.ticket_code);

            activeLoketTimeoutRef.current = setTimeout(() => {
              if (isMounted) setActiveLoket(null);
            }, 3000);
            return;
          }

          if (
            Array.isArray(current.audio_paths) &&
            current.audio_paths.length > 0
          ) {
            console.log(`[AUDIO] Enqueuing: ${current.ticket_code}`);
            enqueueAudio(current, () => {
              if (!isMounted) return;
              console.log(`[AUDIO] Finished: ${current.ticket_code}`);
              updateServiceDisplay(current.service_id, current.ticket_code);

              activeLoketTimeoutRef.current = setTimeout(() => {
                if (isMounted) setActiveLoket(null);
              }, 3000);
            });
          } else {
            updateServiceDisplay(current.service_id, current.ticket_code);
            activeLoketTimeoutRef.current = setTimeout(() => {
              if (isMounted) setActiveLoket(null);
            }, 3000);
          }
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

  const updateServiceDisplay = (serviceId, ticketCode) => {
    setDisplayedServices((prev) => ({
      ...prev,
      [serviceId]: ticketCode,
    }));
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

      setTimeout(() => {
        playNextAudio();
      }, 500);
    }
  };

  const playAudio = (src) =>
    new Promise((resolve) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
      }

      const audio = new Audio(src);
      currentAudioRef.current = audio;

      audio.onended = () => {
        currentAudioRef.current = null;
        resolve();
      };

      audio.onerror = (err) => {
        console.error(`[AUDIO] Failed to load: ${src}`, err);
        currentAudioRef.current = null;
        resolve();
      };

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
    });

  const handleAudioInteraction = () => {
    setAudioInteracted(true);
    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silentAudio.play().catch(() => {});
  };

  const serviceQueues = queues.reduce((acc, q) => {
    const key = q.service_id;
    if (!acc[key]) {
      acc[key] = {
        service_id: q.service_id,
        service_name: q.service_name,
        service_code: q.service_code,
        unit_name: q.unit_name,
        loket: q.loket,
        tickets: [],
      };
    }
    acc[key].tickets.push(q);
    return acc;
  }, {});

  let services = Object.values(serviceQueues);

  services.sort((a, b) => {
    const aLatestCalled = a.tickets
      .filter((t) => t.status === "called" && t.last_called_at)
      .sort(
        (x, y) => new Date(y.last_called_at) - new Date(x.last_called_at)
      )[0];

    const bLatestCalled = b.tickets
      .filter((t) => t.status === "called" && t.last_called_at)
      .sort(
        (x, y) => new Date(y.last_called_at) - new Date(x.last_called_at)
      )[0];

    if (aLatestCalled && !bLatestCalled) return -1;
    if (!aLatestCalled && bLatestCalled) return 1;

    if (aLatestCalled && bLatestCalled) {
      return (
        new Date(bLatestCalled.last_called_at) -
        new Date(aLatestCalled.last_called_at)
      );
    }

    return a.service_id - b.service_id;
  });
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
        <div className="md:hidden">
          <section className="mb-6">
            <div
              className={`rounded-2xl p-6 flex flex-col justify-center items-center transition-all duration-500 ${
                currentlyPlaying
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50 scale-[1.02]"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {currentlyPlaying ? (
                <>
                  <p className="text-sm text-white/90 mb-2">
                    Sekarang Melayani
                  </p>
                  <p className="text-5xl font-bold mb-4 animate-pulse">
                    {currentlyPlaying.ticket_code}
                  </p>
                  <p className="text-xl font-semibold text-center">
                    {currentlyPlaying.service_name}
                  </p>
                  <p className="text-base text-white/90 text-center">
                    {currentlyPlaying.unit_name}
                  </p>
                  <div className="mt-6 bg-white/20 backdrop-blur px-8 py-3 rounded-xl">
                    <p className="text-xs text-white/80">Loket</p>
                    <p className="text-3xl font-bold">
                      {formatText(currentlyPlaying.loket)}
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
              {services.map((service) => {
                let displayTicket;
                const displayedTicket = displayedServices[service.service_id];

                if (displayedTicket) {
                  displayTicket = service.tickets.find(
                    (t) => t.ticket_code === displayedTicket
                  );
                }

                if (!displayTicket) {
                  const latestCalled = service.tickets
                    .filter((t) => t.status === "called" && t.last_called_at)
                    .sort(
                      (a, b) =>
                        new Date(b.last_called_at) - new Date(a.last_called_at)
                    )[0];

                  displayTicket = latestCalled || service.tickets[0];
                }

                const isActive = activeLoket === service.service_name;

                return (
                  <div
                    key={service.service_id}
                    ref={isActive ? activeCardRef : null}
                    className={`rounded-xl p-4 text-center transition-all duration-500 border-2 ${
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
                      LOKET {formatText(service.loket)}
                    </div>
                    <p className="text-xs font-medium mb-3 truncate text-slate-300">
                      {service.service_name}
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        isActive ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {displayTicket?.ticket_code ||
                        `${service.service_code}000`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="hidden md:flex gap-6 max-w-7xl mx-auto h-[calc(100vh-200px)]">
          <section className="w-2/5 flex-shrink-0">
            <div
              className={`h-full rounded-2xl p-8 flex flex-col justify-center items-center transition-all duration-500 ${
                currentlyPlaying
                  ? "bg-emerald-600 shadow-2xl shadow-emerald-500/50"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {currentlyPlaying ? (
                <>
                  <p className="text-xl text-white/90 mb-2">
                    Sekarang Melayani
                  </p>
                  <p className="text-7xl font-bold mb-4 animate-pulse">
                    {currentlyPlaying.ticket_code}
                  </p>
                  <p className="text-3xl font-semibold text-center">
                    {currentlyPlaying.service_name}
                  </p>
                  <p className="text-xl text-white/90 text-center mt-2">
                    {currentlyPlaying.unit_name}
                  </p>
                  <div className="mt-8 bg-white/20 backdrop-blur px-10 py-4 rounded-xl">
                    <p className="text-sm text-white/80">Loket</p>
                    <p className="text-3xl font-bold">
                      {formatText(currentlyPlaying.loket)}
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
                {services.map((service, index) => {
                  let displayTicket;
                  const displayedTicket = displayedServices[service.service_id];

                  if (displayedTicket) {
                    displayTicket = service.tickets.find(
                      (t) => t.ticket_code === displayedTicket
                    );
                  }

                  if (!displayTicket) {
                    const latestCalled = service.tickets
                      .filter((t) => t.status === "called" && t.last_called_at)
                      .sort(
                        (a, b) =>
                          new Date(b.last_called_at) -
                          new Date(a.last_called_at)
                      )[0];

                    displayTicket = latestCalled || service.tickets[0];
                  }

                  const isActive = activeLoket === service.service_name;

                  return (
                    <div
                      key={service.service_id}
                      ref={isActive ? activeCardRef : null}
                      className={`rounded-xl p-6 text-center transition-all duration-500 border-2 ${
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
                        LOKET {formatText(service.loket)}
                      </div>
                      <p className="text-sm font-medium mb-3 truncate text-slate-300">
                        {service.service_name}
                      </p>
                      <p
                        className={`text-4xl font-bold ${
                          isActive ? "text-white" : "text-slate-200"
                        }`}
                      >
                        {displayTicket?.ticket_code ||
                          `${service.service_code}000`}
                      </p>
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
