/**
 * AudioManager - Mengelola pemutaran audio tanpa gap
 */
class AudioManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.audioContext = null;
    this.audioBuffers = new Map(); // Cache audio buffers
    this.isPlaying = false;
    this.queue = [];
    this.currentSources = []; // Track all playing sources
    this.nextScheduledTime = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize AudioContext (harus dipanggil setelah user interaction)
   */
  async initialize() {
    // Sudah ada context dan running — tidak perlu apa-apa
    if (this.audioContext && this.audioContext.state !== "closed") {
      console.log("[AudioManager] Already initialized");
      this.isInitialized = true; // pastikan flag selalu sync
      return true;
    }

    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume context if suspended (untuk iOS/Safari)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log(
        "[AudioManager] ✅ Initialized, sample rate:",
        this.audioContext.sampleRate,
        "state:",
        this.audioContext.state
      );
      return true;
    } catch (error) {
      console.error("[AudioManager] ❌ Failed to initialize:", error);
      return false;
    }
  }

  /**
   * Pastikan AudioContext siap — auto-init jika belum ada.
   * Browser modern membuat AudioContext dalam state "suspended" jika
   * belum ada user gesture, tapi kita tetap bisa decode & schedule buffer.
   * Context akan resume otomatis saat ada gesture berikutnya.
   */
  async ensureReady() {
    if (!this.audioContext || this.audioContext.state === "closed") {
      console.log("[AudioManager] Auto-initializing AudioContext...");
      const ok = await this.initialize();
      if (!ok) return false;
    }

    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        console.log("[AudioManager] ▶️ Context resumed");
      } catch (e) {
        // Suspended karena belum ada user gesture — akan resume saat ada interaksi
        console.warn(
          "[AudioManager] ⚠️ Context still suspended, will resume on user gesture:",
          e.message
        );
      }
    }

    return true;
  }

  /**
   * Preload audio file dan cache buffer-nya
   */
  async preloadAudio(audioPath) {
    const fullUrl = this.baseUrl
      ? `${this.baseUrl}/${audioPath}`
      : `/${audioPath}`;

    // Cek cache dulu
    if (this.audioBuffers.has(audioPath)) {
      console.log(`[AudioManager] 💾 Cache hit: ${audioPath}`);
      return this.audioBuffers.get(audioPath);
    }

    // Pastikan context ada untuk decode
    await this.ensureReady();

    if (!this.audioContext) {
      console.error(
        `[AudioManager] ❌ No AudioContext, cannot preload ${audioPath}`
      );
      return null;
    }

    try {
      console.log(`[AudioManager] 📥 Preloading: ${audioPath}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(fullUrl, {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Cache it
      this.audioBuffers.set(audioPath, audioBuffer);

      console.log(
        `[AudioManager] ✅ Preloaded: ${audioPath} (${audioBuffer.duration.toFixed(
          2
        )}s)`
      );
      return audioBuffer;
    } catch (error) {
      console.error(`[AudioManager] ❌ Failed to preload ${audioPath}:`, error);
      return null;
    }
  }

  /**
   * Preload multiple audio files sekaligus
   */
  async preloadMultiple(audioPaths) {
    if (!audioPaths || audioPaths.length === 0) {
      console.warn("[AudioManager] ⚠️ No audio paths to preload");
      return [];
    }

    console.log(`[AudioManager] 📦 Preloading ${audioPaths.length} files...`);
    const startTime = performance.now();

    const promises = audioPaths.map((path) => this.preloadAudio(path));
    const results = await Promise.allSettled(promises);

    const endTime = performance.now();
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[AudioManager] 📊 Preload complete: ${successful} success, ${failed} failed in ${(
        endTime - startTime
      ).toFixed(0)}ms`
    );

    return results;
  }

  /**
   * Play audio sequence tanpa gap menggunakan precise scheduling
   */
  async playSequence(audioPaths, onComplete, onError) {
    // Auto-init: jangan langsung error, coba init dulu
    const ready = await this.ensureReady();
    if (!ready) {
      console.error("[AudioManager] ❌ AudioContext not available!");
      if (onError) onError(new Error("AudioManager not initialized"));
      if (onComplete) onComplete(); // tetap lanjut biar UI tidak stuck
      return;
    }

    if (this.isPlaying) {
      console.log("[AudioManager] 🔄 Already playing, queueing...");
      this.queue.push({ audioPaths, onComplete, onError });
      return;
    }

    this.isPlaying = true;
    console.log(
      `[AudioManager] ▶️ Playing sequence: ${audioPaths.length} files`
    );

    try {
      // Preload semua audio (jika belum di-cache)
      await this.preloadMultiple(audioPaths);

      // Resume context sekali lagi setelah preload selesai
      // (mungkin user sudah gesture di sela-sela preload)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Kumpulkan buffer yang berhasil di-load
      const buffers = audioPaths
        .map((path) => ({ path, buffer: this.audioBuffers.get(path) }))
        .filter(({ buffer }) => {
          return buffer != null;
        });

      if (buffers.length === 0) {
        console.warn("[AudioManager] ⚠️ No valid buffers to play");
        this.isPlaying = false;
        if (onComplete) onComplete();
        this.playNextInQueue();
        return;
      }

      // Reset scheduling time
      this.nextScheduledTime = this.audioContext.currentTime + 0.05;
      this.currentSources = [];

      // Schedule semua audio dengan precise timing (zero gap)
      buffers.forEach(({ path, buffer }, i) => {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(this.nextScheduledTime);

        console.log(
          `[AudioManager] 🎵 Scheduled ${path} at ${this.nextScheduledTime.toFixed(
            3
          )}s` + ` (duration: ${buffer.duration.toFixed(3)}s)`
        );

        this.nextScheduledTime += buffer.duration;
        this.currentSources.push(source);

        // Completion callback hanya pada source terakhir
        if (i === buffers.length - 1) {
          source.onended = () => {
            console.log("[AudioManager] ✅ Sequence complete");
            this.isPlaying = false;
            this.currentSources = [];
            if (onComplete) onComplete();
            this.playNextInQueue();
          };
        }
      });
    } catch (error) {
      console.error("[AudioManager] ❌ Playback error:", error);
      this.isPlaying = false;
      this.currentSources = [];
      if (onError) onError(error);
      if (onComplete) onComplete();
      this.playNextInQueue();
    }
  }

  /**
   * Play next audio in queue
   */
  async playNextInQueue() {
    if (this.queue.length === 0) {
      console.log("[AudioManager] 📭 Queue empty");
      return;
    }

    const next = this.queue.shift();
    console.log(
      `[AudioManager] ⏭️ Playing next from queue (${this.queue.length} remaining)`
    );

    await this.playSequence(next.audioPaths, next.onComplete, next.onError);
  }

  /**
   * Stop current playback
   */
  stop() {
    console.log("[AudioManager] ⏹️ Stopping playback");

    this.currentSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Already stopped or disconnected
      }
    });

    this.currentSources = [];
    this.isPlaying = false;
    this.queue = [];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.audioBuffers.clear();
    console.log("[AudioManager] 🧹 Cache cleared");
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    return {
      totalFiles: this.audioBuffers.size,
      files: Array.from(this.audioBuffers.keys()),
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      queueLength: this.queue.length,
    };
  }

  /**
   * Cleanup - panggil saat component unmount
   */
  cleanup() {
    console.log("[AudioManager] 🧹 Cleaning up...");

    this.stop();
    this.clearCache();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
    console.log("[AudioManager] ✅ Cleanup complete");
  }
}

// ============================================
// EXPORT
// ============================================

export { AudioManager };
