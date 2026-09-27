"use client";

import { animate } from "framer-motion";
import { useState } from "react";
import { useBootstrap } from "@/lib/useBootstrap";
import { DeskScene } from "../desk/DeskScene";
import { OpeningPlayer } from "../opening/OpeningPlayer";

const SEEN_KEY = "vpdk-opening-seen";

type Mode = "opening" | "desk";

function initialState() {
  const q = new URLSearchParams(window.location.search);
  let seen = false;
  try {
    seen = localStorage.getItem(SEEN_KEY) === "1";
  } catch {}
  return {
    mode: (q.get("opening") === "1" || !seen ? "opening" : "desk") as Mode,
    pace: q.get("pace") === "demo" ? 0.6 : 1,
    debug: q.get("debug") === "1",
  };
}

/** First visit: the opening story, then the book lands on Bà's table. Returning: straight to the table. */
export default function Home() {
  const { data, error } = useBootstrap();
  // This component only renders in the browser (see app/page.tsx), so reading window here is safe
  const [opts] = useState(initialState);
  const [mode, setMode] = useState<Mode>(opts.mode);
  const [landing, setLanding] = useState<"flash" | "soft">("soft");
  const [flashEl, setFlashEl] = useState<HTMLDivElement | null>(null);

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
    <>
      {!data && <div className="fixed inset-0 z-40 bg-[#140c07]" />}
      {mode === "opening" && data && data.opening.length > 0 && <OpeningPlayer screens={data.opening} flashEl={flashEl} onFinish={finishOpening} pace={opts.pace} debug={opts.debug} />}
      {(mode === "desk" || data?.opening.length === 0) && data && <DeskScene data={data} landing={landing} />}
      <div ref={setFlashEl} className="flash-layer pointer-events-none fixed inset-0 z-50 opacity-0" aria-hidden />
    </>
  );
}
