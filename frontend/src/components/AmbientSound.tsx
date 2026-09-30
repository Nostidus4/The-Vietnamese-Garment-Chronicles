"use client";

// Background music for the whole site, with a mute button in the top bar.
// - The file is frontend/public/audio/ambient.mp3 (looped); without it the button stays hidden.
// - Browsers block sound until the first click or key press, so the music starts then, fading in.
// - The choice (on / off) is remembered on this device. While the opening's voice-over speaks, the music ducks.

import { useEffect, useRef, useState } from "react";

const SRC = "/audio/ambient.mp3";
const KEY = "vpdk-bgm";
const VOLUME = 0.22;
const DUCKED = 0.06;

function fade(el: HTMLAudioElement, to: number, ms = 800) {
  const from = el.volume;
  const start = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / ms);
    el.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function AmbientSound() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = useState(false);
  const [on, setOn] = useState(() => {
    try {
      return typeof window === "undefined" || localStorage.getItem(KEY) !== "off";
    } catch {
      return true;
    }
  });
  const voice = useRef(false);

  // is there a music file at all?
  useEffect(() => {
    let alive = true;
    fetch(SRC, { method: "HEAD" })
      .then((r) => alive && r.ok && setAvailable(true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // start on the first gesture (autoplay rules), then follow the on / off choice
  useEffect(() => {
    if (!available) return;
    audio.current ??= Object.assign(new Audio(SRC), { loop: true, volume: 0 });
    const el = audio.current;
    const play = () => {
      if (!on) return;
      el.play()
        .then(() => fade(el, voice.current ? DUCKED : VOLUME))
        .catch(() => {});
    };
    if (on) play();
    else fade(el, 0, 400);
    const pause = setTimeout(() => !on && el.pause(), 450);
    window.addEventListener("pointerdown", play, { once: true });
    window.addEventListener("keydown", play, { once: true });
    return () => {
      clearTimeout(pause);
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
    };
  }, [available, on]);

  // the opening's narrator speaks: lower the music, then bring it back
  useEffect(() => {
    const onVoice = (e: Event) => {
      voice.current = !!(e as CustomEvent<boolean>).detail;
      if (audio.current && on && !audio.current.paused) fade(audio.current, voice.current ? DUCKED : VOLUME, 500);
    };
    window.addEventListener("vpdk-voice", onVoice);
    return () => window.removeEventListener("vpdk-voice", onVoice);
  }, [on]);

  if (!available) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          localStorage.setItem(KEY, next ? "on" : "off");
        } catch {
          // private mode: the choice lasts for this visit
        }
      }}
      aria-pressed={on}
      aria-label={on ? "Tắt nhạc nền" : "Bật nhạc nền"}
      title={on ? "Tắt nhạc nền" : "Bật nhạc nền"}
    >
      {on ? "🔊 Nhạc" : "🔇 Nhạc"}
    </button>
  );
}
