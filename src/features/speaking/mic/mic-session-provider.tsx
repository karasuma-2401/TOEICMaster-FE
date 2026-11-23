"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type MicrophoneStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "lost"
  | "denied"
  | "no-device"
  | "busy"
  | "insecure"
  | "unsupported";

export const microphoneMessages: Record<MicrophoneStatus, string> = {
  idle: "Click to enable your microphone. The attempt timer keeps running.",
  requesting: "Waiting for microphone permission...",
  ready: "Microphone connected.",
  lost: "Microphone connection lost. Please reconnect your device and try again.",
  denied:
    "Microphone access is blocked. Open site settings, allow Microphone, and try again.",
  "no-device": "No microphone found. Please connect a device and try again.",
  busy: "Could not open the microphone. Close any other app using the device and try again.",
  insecure: "Recording requires an HTTPS or localhost connection.",
  unsupported:
    "This browser does not support audio recording. Please use a different browser.",
};

function useMicrophone() {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [level, setLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [verified, setVerified] = useState(false);
  const [withoutRecording, setWithoutRecording] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<Promise<boolean> | null>(null);
  const generation = useRef(0);

  const clearResources = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void context.current?.close().catch(() => undefined);
    context.current = null;
    setLevel(0);
    setVerified(false);
  }, []);

  const release = useCallback(() => {
    generation.current++;
    pending.current = null;
    clearResources();
    setStatus("idle");
    setWithoutRecording(false);
  }, [clearResources]);

  const markLost = useCallback(() => {
    generation.current++;
    pending.current = null;
    clearResources();
    setStatus("lost");
  }, [clearResources]);

  const acquire = useCallback(
    (requestedDevice?: string): Promise<boolean> => {
      const track = stream.current?.getAudioTracks()[0];
      if (
        track?.readyState === "live" &&
        (!requestedDevice || track.getSettings().deviceId === requestedDevice)
      ) {
        void context.current?.resume().catch(() => undefined);
        return Promise.resolve(true);
      }
      if (pending.current) return pending.current;
      if (typeof window === "undefined" || !window.isSecureContext) {
        setStatus("insecure");
        return Promise.resolve(false);
      }
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined" ||
        typeof AudioContext === "undefined"
      ) {
        setStatus("unsupported");
        return Promise.resolve(false);
      }
      clearResources();
      const current = ++generation.current;
      setStatus("requesting");
      // Create/resume audio in the click handler so the phase tone can play later.
      try {
        context.current = new AudioContext();
        void context.current.resume().catch(() => undefined);
      } catch {
        setStatus("unsupported");
        return Promise.resolve(false);
      }
      const task = (async () => {
        try {
          const acquired = await navigator.mediaDevices.getUserMedia({
            audio: requestedDevice
              ? { deviceId: { exact: requestedDevice } }
              : true,
          });
          if (generation.current !== current) {
            acquired.getTracks().forEach((item) => item.stop());
            return false;
          }
          stream.current = acquired;
          const audioTrack = acquired.getAudioTracks()[0];
          if (!audioTrack || audioTrack.readyState !== "live")
            throw new DOMException("No live audio", "NotFoundError");
          audioTrack.addEventListener("ended", markLost, { once: true });
          setDeviceId(audioTrack.getSettings().deviceId ?? "");
          setDeviceLabel(audioTrack.label);
          const analyser = context.current!.createAnalyser();
          analyser.fftSize = 256;
          context.current!.createMediaStreamSource(acquired).connect(analyser);
          const samples = new Uint8Array(analyser.frequencyBinCount);
          const read = () => {
            analyser.getByteTimeDomainData(samples);
            let peak = 0;
            for (const sample of samples)
              peak = Math.max(peak, Math.abs(sample - 128));
            setLevel(Math.min(1, peak / 64));
            frame.current = requestAnimationFrame(read);
          };
          read();
          setStatus("ready");
          // Device labels may be unavailable until capture permission has been granted.
          try {
            const found = await navigator.mediaDevices.enumerateDevices();
            if (generation.current === current)
              setDevices(found.filter((item) => item.kind === "audioinput"));
          } catch {
            /* Capture still works when device enumeration is unavailable. */
          }
          return generation.current === current;
        } catch (error) {
          if (generation.current !== current) return false;
          clearResources();
          const name = error instanceof DOMException ? error.name : "";
          setStatus(
            name === "NotAllowedError" || name === "SecurityError"
              ? "denied"
              : name === "NotFoundError" || name === "OverconstrainedError"
                ? "no-device"
                : "busy",
          );
          return false;
        } finally {
          if (generation.current === current) pending.current = null;
        }
      })();
      pending.current = task;
      return task;
    },
    [clearResources, markLost],
  );

  const restoreIfGranted = useCallback(async () => {
    if (
      stream.current
        ?.getAudioTracks()
        .some((track) => track.readyState === "live")
    )
      return true;
    const current = generation.current;
    try {
      const permission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (current === generation.current && permission.state === "granted")
        return acquire();
    } catch {
      /* An unknown permission requires an explicit user action. */
    }
    return false;
  }, [acquire]);

  const verify = useCallback(() => {
    if (
      stream.current
        ?.getAudioTracks()
        .some((track) => track.readyState === "live")
    )
      setVerified(true);
  }, []);
  const resetVerification = useCallback(() => setVerified(false), []);

  const beep = useCallback(async () => {
    const audio = context.current;
    if (!audio || audio.state !== "running") return;
    await new Promise<void>((resolve) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 1000;
      gain.gain.value = 0.15;
      oscillator.connect(gain).connect(audio.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        resolve();
      };
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.3);
    });
  }, []);

  useEffect(
    () => () => {
      generation.current++;
      clearResources();
    },
    [clearResources],
  );
  return useMemo(
    () => ({
      status,
      level,
      devices,
      deviceId,
      deviceLabel,
      verified,
      withoutRecording,
      setWithoutRecording,
      stream,
      acquire,
      restoreIfGranted,
      release,
      verify,
      resetVerification,
      markLost,
      beep,
    }),
    [
      status,
      level,
      devices,
      deviceId,
      deviceLabel,
      verified,
      withoutRecording,
      acquire,
      restoreIfGranted,
      release,
      verify,
      resetVerification,
      markLost,
      beep,
    ],
  );
}

const MicContext = createContext<ReturnType<typeof useMicrophone> | null>(null);

export function MicSessionProvider({ children }: { children: ReactNode }) {
  const microphone = useMicrophone();
  const pathname = usePathname();
  const { release } = microphone;
  useEffect(() => {
    if (
      !/^\/speaking\/(?:tests\/[^/]+\/practice|exercises\/[^/]+\/practice|attempts\/[^/]+)\/?$/.test(
        pathname,
      )
    )
      release();
  }, [pathname, release]);
  return (
    <MicContext.Provider value={microphone}>{children}</MicContext.Provider>
  );
}

export function useMicSession() {
  const microphone = useContext(MicContext);
  if (!microphone)
    throw new Error("Speaking microphone requires MicSessionProvider.");
  return microphone;
}
