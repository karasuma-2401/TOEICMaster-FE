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
            "Chưa nhận đủ tín hiệu giọng nói. Hãy kiểm tra micro và thu thử lại.",
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
      <h2 className="text-xl font-semibold">Kiểm tra thiết bị · 3 bước</h2>
      <div>
        <h3 className="font-semibold">1. Cấp quyền và chọn micro</h3>
        <p aria-live="polite" className="mt-2 text-sm">
          {microphoneMessages[mic.status]}
        </p>
        <button
          className="sp-btn sp-btn-outline mt-3"
          disabled={starting || testing || mic.status === "requesting"}
          onClick={() => void mic.acquire()}
          type="button"
        >
          Cho phép micro
        </button>
        {ready && mic.devices.length > 0 && (
          <label className="mt-3 block text-sm">
            Micro
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
                  {device.label || "Micro"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div>
        <h3 className="font-semibold">2. Nói thử trong 5 giây</h3>
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
          {testing ? `Đang thu thử ${elapsed}/5 giây…` : "Thu thử 5 giây"}
        </button>
        {testError && (
          <p role="alert" className="mt-2 text-sm text-(--sp-danger)">
            {testError}
          </p>
        )}
      </div>
      <div>
        <h3 className="font-semibold">3. Nghe lại và xác nhận</h3>
        {recording && !testing && (
          <audio
            aria-label="Bản thu kiểm tra"
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
          Tôi nghe rõ bản thu
        </button>
        <p aria-live="polite" className="mt-2 text-sm">
          {mic.verified
            ? "Kiểm tra thiết bị đã đạt."
            : "Nghe hết bản thu rồi xác nhận trước khi bắt đầu."}
        </p>
      </div>
      <button
        className="sp-btn sp-btn-cta sp-btn-lg w-full"
        disabled={!ready || !mic.verified || testing || starting}
        onClick={() => onStart(false)}
        type="button"
      >
        {starting ? "Đang tạo lượt làm…" : "Bắt đầu làm bài →"}
      </button>
      {!requireDevices && (
        <button
          className="sp-btn sp-btn-outline w-full"
          disabled={starting || testing}
          onClick={() => onStart(true)}
          type="button"
        >
          Luyện không ghi âm
        </button>
      )}
      <p className="text-xs text-(--sp-ink-3)">
        Micro được giữ kết nối trong lượt làm để tránh xin quyền lại. Ngoài bản
        thu thử trên máy, âm thanh chỉ được ghi trong pha trả lời; bản thu thử
        không được gửi lên máy chủ.
      </p>
    </section>
  );
}
