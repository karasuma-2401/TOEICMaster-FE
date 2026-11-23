"use client";

import { useEffect, useRef, useState } from "react";
import { useVoiceRecorder } from "@/features/speaking/hooks/use-voice-recorder";
import {
  microphoneMessages,
  useMicSession,
} from "@/features/speaking/mic/mic-session-provider";
import { Waveform } from "../ui/primitives";

/** Permission, a five-second test, then explicit playback confirmation. */
export function MicCheckPanel({
  onStart,
  starting = false,
  requireDevices = true,
}: {
  onStart: (withoutRecording?: boolean) => void;
  starting?: boolean;
  requireDevices?: boolean;
}) {
  const mic = useMicSession();
  const recorder = useVoiceRecorder();
  const [testing, setTesting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [heard, setHeard] = useState(false);
  const [listened, setListened] = useState(false);
  const [take, setTake] = useState(0);
  const [testError, setTestError] = useState<string | null>(null);
  const currentLevel = useRef(mic.level);
  useEffect(() => {
    currentLevel.current = mic.level;
  }, [mic.level]);
  const { stop } = recorder;
  useEffect(() => {
    if (mic.status === "ready") return;
    stop();
    const task = window.setTimeout(() => {
      setHeard(false);
      setListened(false);
      setTesting(false);
      setTake(0);
    }, 0);
    return () => window.clearTimeout(task);
  }, [mic.status, stop]);
  useEffect(() => {
    if (!testing) return;
    const startedAt = performance.now();
    let previous = startedAt;
    let voiceMilliseconds = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      // Bound gaps so returning from a background tab cannot count as sustained voice.
      if (currentLevel.current >= 0.15)
        voiceMilliseconds += Math.min(150, now - previous);
      previous = now;
      setElapsed(Math.min(5, Math.floor((now - startedAt) / 1000)));
      if (now - startedAt >= 5000) {
        stop();
        setTesting(false);
        setHeard(voiceMilliseconds >= 1000);
        if (voiceMilliseconds < 1000)
          setTestError(
            "Not enough voice signal detected. Please check your microphone and try again.",
          );
      }
    }, 100);
    return () => {
      window.clearInterval(timer);
      stop();
    };
  }, [testing, stop]);

  const recordTest = () => {
    mic.resetVerification();
    setHeard(false);
    setListened(false);
    setTestError(null);
    const next = take + 1;
    setTake(next);
    recorder.start(next);
    setElapsed(0);
    setTesting(true);
  };
  const recording = recorder.recordings[take];
  const ready = mic.status === "ready";
  return (
    <section className="sp-card mx-auto max-w-[640px] space-y-5 p-6">
      <h2 className="text-xl font-semibold">Device check · 3 steps</h2>
      <div>
        <h3 className="font-semibold">
          1. Grant permission and select microphone
        </h3>
        <p aria-live="polite" className="mt-2 text-sm">
          {microphoneMessages[mic.status]}
        </p>
        <button
          className="sp-btn sp-btn-outline mt-3"
          disabled={starting || testing || mic.status === "requesting"}
          onClick={() => void mic.acquire()}
          type="button"
        >
          Allow microphone
        </button>
        {ready && mic.devices.length > 0 && (
          <label className="mt-3 block text-sm">
            Microphone
            <select
              className="mt-1 block w-full rounded-lg border p-2"
              disabled={starting || testing}
              value={mic.deviceId}
              onChange={(event) => {
                setHeard(false);
                setListened(false);
                setTake(0);
                void mic.acquire(event.target.value);
              }}
            >
              {mic.devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Microphone"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div>
        <h3 className="font-semibold">2. Speak for 5 seconds</h3>
        <p className="mt-2 text-sm" lang="en">
          Hello, I am ready for the TOEIC Speaking test.
        </p>
        <Waveform bars={36} level={ready ? mic.level : 0} />
        <button
          className="sp-btn sp-btn-outline mt-3"
          disabled={!ready || testing || starting}
          onClick={recordTest}
          type="button"
        >
          {testing ? `Recording test ${elapsed}/5s…` : "Record 5-second test"}
        </button>
        {testError && (
          <p role="alert" className="mt-2 text-sm text-(--sp-danger)">
            {testError}
          </p>
        )}
      </div>
      <div>
        <h3 className="font-semibold">3. Play back and confirm</h3>
        {recording && !testing && (
          <audio
            aria-label="Test recording"
            className="mt-3 w-full"
            controls
            src={recording.url}
            onEnded={() => setListened(true)}
          >
            <track kind="captions" />
          </audio>
        )}
        <button
          className="sp-btn sp-btn-outline mt-3"
          disabled={!ready || !heard || !listened || testing || starting}
          onClick={mic.verify}
          type="button"
        >
          I can hear my recording clearly
        </button>
        <p aria-live="polite" className="mt-2 text-sm">
          {mic.verified
            ? "Device check passed."
            : "Listen to the full recording and confirm before starting."}
        </p>
      </div>
      <button
        className="sp-btn sp-btn-cta sp-btn-lg w-full"
        disabled={!ready || !mic.verified || testing || starting}
        onClick={() => onStart(false)}
        type="button"
      >
        {starting ? "Creating attempt…" : "Start test →"}
      </button>
      {!requireDevices && (
        <button
          className="sp-btn sp-btn-outline w-full"
          disabled={starting || testing}
          onClick={() => onStart(true)}
          type="button"
        >
          Practice without recording
        </button>
      )}
      <p className="text-xs text-(--sp-ink-3)">
        Your microphone stays connected during the attempt so you will not be
        asked for permission again. Aside from the local test recording, audio
        is only recorded during the response phase; the test recording is never
        sent to the server.
      </p>
    </section>
  );
}
