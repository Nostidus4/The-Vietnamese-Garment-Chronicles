"use client";

import { animate, MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useBootstrap } from "@/lib/useBootstrap";
import { LogoIntro } from "../opening/LogoIntro";
import { OpeningPlayer } from "../opening/OpeningPlayer";

const SEEN_KEY = "vpdk-opening-seen";

// The desk and Bà's book are most of the page's code. A first visit sees the logo and the opening long before the
// desk, so its code is fetched once the logo has gone instead of before the logo can show (Lighthouse LCP, #64).
const loadDesk = () => import("../desk/DeskScene");
const DeskScene = dynamic(() => loadDesk().then((m) => m.DeskScene), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-40 bg-[#140c07]" />,
});

type Mode = "opening" | "desk";

function initialState() {
  const q = new URLSearchParams(window.location.search);
  let seen = false;
  try {
    seen = localStorage.getItem(SEEN_KEY) === "1";
  } catch {}
  return {
    mode: (q.get("opening") === "1" || !seen ? "opening" : "desk") as Mode,
    // demo = faster for the video; slow = 3× slower to study each transition
    pace: q.get("pace") === "demo" ? 0.6 : q.get("pace") === "slow" ? 3 : 1,
    debug: q.get("debug") === "1",
    noClick: q.get("noclick") === "1", // testing only: keyboard-driven, clicks ignored
    start: q.get("start"), // e.g. ?opening=1&start=s05 – open straight on a screen while tuning
    sound: q.get("sound") === "1" ? true : q.get("sound") === "0" ? false : null, // skip the voice-over question
  };
}

/** First visit: the opening story, then the book lands on Bà's table. Returning: straight to the table. */
export default function Home() {
  // This component only renders in the browser (see app/page.tsx), so reading window here is safe
  const [opts] = useState(initialState);
  // A first visit fetches the book's content once the logo's light has started to pass: until then the logo has the
  // connection to itself, and it waits at least 2.7 s for the content anyway (Lighthouse LCP on phones, #64)
  const [fetchContent, setFetchContent] = useState(opts.mode !== "opening");
  useEffect(() => {
    if (fetchContent) return;
    const t = setTimeout(() => setFetchContent(true), 1600);
    return () => clearTimeout(t);
  }, [fetchContent]);
  const { data, error } = useBootstrap(fetchContent);
  const [mode, setMode] = useState<Mode>(opts.mode);
  const [landing, setLanding] = useState<"flash" | "soft">("soft");
  const [flashEl, setFlashEl] = useState<HTMLDivElement | null>(null);
  // the logo opens every telling of the story; it holds the story until it starts to dissolve
  const [logo, setLogo] = useState<"on" | "leaving" | "off">(opts.mode === "opening" ? "on" : "off");
  useEffect(() => {
    if (logo === "off") void loadDesk();
  }, [logo]);

  function finishOpening() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setLanding("flash");
    setMode("desk");
    // T10 second half: the light clears while the camera pulls back to the desk
    if (flashEl) animate(flashEl, { opacity: [1, 0] }, { duration: 1.25, delay: 0.18, ease: [0.3, 0, 0.2, 1] });
    window.history.replaceState(null, "", window.location.pathname);
  }

  if (error) return <p className="p-8 text-red-700">{error}</p>;

  return (
    // with "reduce motion" on, every slide, zoom and turn of the opening and the desk becomes a plain fade: framer
    // keeps opacity and drops transforms (#96); the hand-made checks of `reduced` further down stay as they are
    <MotionConfig reducedMotion="user">
      {!data && logo === "off" && <div className="fixed inset-0 z-40 bg-[#140c07]" />}
      {logo !== "off" && <LogoIntro ready={!!data} onLeave={() => setLogo("leaving")} onDone={() => setLogo("off")} />}
      {mode === "opening" && data && data.opening.length > 0 && <OpeningPlayer screens={data.opening} flashEl={flashEl} onFinish={finishOpening} pace={opts.pace} debug={opts.debug} noClick={opts.noClick} startId={opts.start} hold={logo === "on"} sound={opts.sound} />}
      {(mode === "desk" || data?.opening.length === 0) && data && <DeskScene data={data} landing={landing} />}
      <div ref={setFlashEl} className="flash-layer pointer-events-none fixed inset-0 z-50 opacity-0" aria-hidden />
    </MotionConfig>
  );
}
