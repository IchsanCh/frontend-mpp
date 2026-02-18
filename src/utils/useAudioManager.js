import { useEffect, useRef, useState } from "react";
import { AudioManager } from "./audioManager";

/**
 * Custom hook untuk mengelola AudioManager
 *
 * Features:
 * - Auto-initialize AudioContext
 * - Auto-cleanup on unmount
 * - Preload semua audio dari API
 * - Handle user interaction requirement
 *
 * @param {string} baseUrl - Base URL untuk audio files
 * @returns {Object} { audioManager, isReady, preloadAllAudio, initializeAudio }
 */
export function useAudioManager(baseUrl) {
  const audioManagerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AudioManager instance (hanya sekali)
  useEffect(() => {
    console.log("[useAudioManager] Creating AudioManager instance");
    audioManagerRef.current = new AudioManager(baseUrl);

    // Cleanup on unmount
    return () => {
      console.log("[useAudioManager] Component unmounting, cleaning up...");
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
        audioManagerRef.current = null;
      }
      setIsReady(false);
      setIsInitialized(false);
    };
  }, [baseUrl]);

  /**
   * Initialize audio context (perlu user interaction)
   * Panggil ini setelah user click/tap
   */
  const initializeAudio = async () => {
    if (!audioManagerRef.current) {
      console.error("[useAudioManager] AudioManager not created");
      return false;
    }

    if (isInitialized) {
      console.log("[useAudioManager] Already initialized");
      return true;
    }

    console.log("[useAudioManager] Initializing audio context...");
    const success = await audioManagerRef.current.initialize();

    if (success) {
      setIsInitialized(true);
      console.log("[useAudioManager] ✅ Audio context initialized");
    } else {
      console.error("[useAudioManager] ❌ Failed to initialize audio context");
    }

    return success;
  };

  /**
   * Preload semua audio files dari API
   * @param {string} audioApiUrl - URL endpoint untuk get list audio
   */
  const preloadAllAudio = async (audioApiUrl) => {
    if (!audioManagerRef.current) {
      console.error("[useAudioManager] AudioManager not created");
      return false;
    }

    if (!isInitialized) {
      console.warn("[useAudioManager] Audio context not initialized yet");
      // Auto-initialize
      const initSuccess = await initializeAudio();
      if (!initSuccess) {
        console.error(
          "[useAudioManager] Cannot preload without initialized context"
        );
        return false;
      }
    }

    try {
      console.log("[useAudioManager] Fetching audio list from API...");
      const response = await fetch(audioApiUrl);
      const result = await response.json();

      if (!result.success || !result.data) {
        console.error("[useAudioManager] Invalid API response:", result);
        return false;
      }

      const audioFiles = result.data;
      console.log(`[useAudioManager] Found ${audioFiles.length} audio files`);

      // Extract audio paths - extract nama file dari path_audio
      // Contoh: "public/audio/ting.mp3" -> "audio/ting.mp3"
      const audioPaths = audioFiles.map((audio) => {
        // Ambil nama file dari path_audio (ting.mp3, nomor_antrian.mp3, etc)
        const fileName = audio.nama_audio || audio.path_audio.split("/").pop();
        // Return path yang benar: audio/nama_file.mp3
        return `audio/${fileName}`;
      });

      console.log("[useAudioManager] Sample paths:", audioPaths.slice(0, 3));

      // Preload semua audio
      console.log("[useAudioManager] Starting preload...");
      await audioManagerRef.current.preloadMultiple(audioPaths);

      setIsReady(true);
      console.log("[useAudioManager] ✅ All audio preloaded and ready!");

      // Log cache info
      const cacheInfo = audioManagerRef.current.getCacheInfo();
      console.log("[useAudioManager] Cache info:", cacheInfo);

      return true;
    } catch (error) {
      console.error("[useAudioManager] Failed to preload audio:", error);
      return false;
    }
  };

  /**
   * Play audio sequence
   * @param {string[]} audioPaths - Array of audio paths to play
   * @param {Function} onComplete - Callback when sequence completes
   * @param {Function} onError - Callback on error
   */
  const playSequence = async (audioPaths, onComplete, onError) => {
    if (!audioManagerRef.current) {
      console.error("[useAudioManager] AudioManager not available");
      if (onError) onError(new Error("AudioManager not available"));
      return;
    }

    if (!isInitialized) {
      console.warn(
        "[useAudioManager] Attempting to initialize before playing..."
      );
      const initSuccess = await initializeAudio();
      if (!initSuccess) {
        console.error(
          "[useAudioManager] Cannot play without initialized context"
        );
        if (onError) onError(new Error("Audio context not initialized"));
        return;
      }
    }

    await audioManagerRef.current.playSequence(audioPaths, onComplete, onError);
  };

  /**
   * Stop current playback
   */
  const stop = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
    }
  };

  /**
   * Get cache info
   */
  const getCacheInfo = () => {
    if (audioManagerRef.current) {
      return audioManagerRef.current.getCacheInfo();
    }
    return null;
  };

  return {
    audioManager: audioManagerRef.current,
    isReady, // true jika semua audio sudah di-preload
    isInitialized, // true jika AudioContext sudah di-initialize
    initializeAudio,
    preloadAllAudio,
    playSequence,
    stop,
    getCacheInfo,
  };
}
