"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Camera, OpeningScreen } from "@/lib/types";
import { EffectsLayer, type TimedEffect } from "./Effects";
import { EASE, cameraXform, computeBox, pointOnScreen, type Box } from "./geometry";
import { BlockView, buildBlocks } from "./Text";
import { asset } from "@/lib/base";

export const IMAGE_SIZES = "(min-aspect-ratio: 16/9) 100vw, 178vh";

export interface SceneHandle {
  layer: HTMLDivElement | null;
  box: () => Box;
  /** Move the camera; resolves when the move ends. */
  moveCamera: (cam: Partial<Camera> & Pick<Camera, "s" | "x" | "y">, ms: number, ease?: Camera["ease"] | [number, number, number, number]) => Promise<void>;
  /** Screen position (px) of an image point (%) right now. */
  screenPoint: (x: number, y: number) => { x: number; y: number };
  shake: (strength: number) => void;
  ready: Promise<void>;
}

interface Props {
  screen: OpeningScreen;
  shown: number; // beats shown
  beatTimes: number[]; // performance.now() when each beat appeared
  enteredAt: number; // when the screen became active (ambient effects start from here)
  instant: number; // bump to finish typing immediately
  reduced: boolean;
  compact: boolean; // narrow / portrait layout
  debug: boolean;
  hidden?: boolean; // mounted but invisible (waiting for its entrance)
  viewport: { w: number; h: number };
}

export const Scene = forwardRef<SceneHandle, Props>(function Scene(
  { screen, shown, beatTimes, enteredAt, instant, reduced, compact, debug, hidden, viewport },
  ref,
) {
  const layerRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const box = useMemo(() => computeBox(viewport.w, viewport.h, screen.focal), [viewport.w, viewport.h, screen.focal]);

  // Camera as motion values (transform-origin 0 0 on the image box)
  const start = cameraXform(box, screen.camera_start);
  const tx = useMotionValue(start.tx);
  const ty = useMotionValue(start.ty);
  const s = useMotionValue(start.s);
  const camSpec = useRef<Pick<Camera, "s" | "x" | "y" | "mode">>(screen.camera_start);

  // Keep the camera correct when the window is resized
  useLayoutEffect(() => {
    const c = cameraXform(box, camSpec.current);
    tx.set(c.tx);
    ty.set(c.ty);
    s.set(c.s);
  }, [box, tx, ty, s]);

  const [loaded, setLoaded] = useState(false);
  const readyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (readyRef.current == null) {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    readyRef.current = { promise, resolve };
  }
  useEffect(() => {
    if (loaded) readyRef.current?.resolve();
  }, [loaded]);

  const moveCamera = useCallback<SceneHandle["moveCamera"]>(
    (cam, ms, ease = "inOut") => {
      const spec = { mode: "anchor" as const, ...cam };
      camSpec.current = spec;
      const c = cameraXform(box, spec);
      const opts = {
        duration: reduced ? 0 : ms / 1000,
        ease: typeof ease === "string" ? EASE[ease] : ease,
      } as const;
      return Promise.all([animate(tx, c.tx, opts), animate(ty, c.ty, opts), animate(s, c.s, opts)]).then(() => undefined);
    },
    [box, reduced, tx, ty, s],
  );

  useImperativeHandle(
    ref,
    () => ({
      layer: layerRef.current,
      box: () => box,
      moveCamera,
      screenPoint: (x, y) => pointOnScreen(box, { tx: tx.get(), ty: ty.get(), s: s.get() }, x, y),
      shake: (strength) => {
        if (reduced || !shakeRef.current) return;
        const a = 10 * strength;
        animate(shakeRef.current, { x: [0, -a, a * 0.8, -a * 0.5, a * 0.3, 0] }, { duration: 0.34 });
      },
      ready: readyRef.current!.promise,
    }),
    [box, moveCamera, reduced, tx, ty, s],
  );

  // Effects: ambient ones from the screen + ones attached to beats already shown
  const effects: TimedEffect[] = useMemo(() => {
    const out: TimedEffect[] = screen.effects.map((e, i) => ({ ...e, key: `${screen.id}-a${i}`, startAt: enteredAt + e.at }));
    screen.beats.slice(0, shown).forEach((b, bi) =>
      b.effects
        .filter((e) => e.type !== "shake")
        .forEach((e, i) => out.push({ ...e, key: `${screen.id}-b${bi}-${i}`, startAt: (beatTimes[bi] ?? enteredAt) + e.at })),
    );
    return out;
  }, [screen, shown, beatTimes, enteredAt]);

  const blocks = buildBlocks(screen.beats, shown, screen.id);
  // what part of the artwork is visible with the resting camera (text is clamped into it)
  const rest = cameraXform(box, screen.camera_start);
  const visible = {
    x0: ((-box.ox - rest.tx) / (rest.s * box.bw)) * 100,
    y0: ((-box.oy - rest.ty) / (rest.s * box.bh)) * 100,
    x1: ((box.vw - box.ox - rest.tx) / (rest.s * box.bw)) * 100,
    y1: ((box.vh - box.oy - rest.ty) / (rest.s * box.bh)) * 100,
  };
  const imageBlocks = blocks.filter((b) => b.beat.space === "image" && !(compact && isDialog(b.beat.kind)));
  const screenBlocks = blocks.filter((b) => b.beat.space === "screen" && !(compact && isDialog(b.beat.kind)));
  const compactBlocks = compact ? blocks.filter((b) => isDialog(b.beat.kind)) : [];

  return (
    <div
      ref={layerRef}
      // Hidden via a class, never via React-managed inline style: transitions own inline opacity
      className={`scene absolute inset-0 overflow-hidden ${screen.mood === "memory" ? "scene--memory" : ""} ${hidden ? "opacity-0" : ""}`}
      aria-hidden={hidden}
    >
      <div ref={shakeRef} className="absolute inset-0">
        <motion.div
          className="absolute origin-top-left"
          style={{
            left: box.ox,
            top: box.oy,
            width: box.bw,
            height: box.bh,
            x: tx,
            y: ty,
            scale: s,
            ["--bw" as string]: `${box.bw}px`,
          }}
        >
          <Image
            src={asset(screen.image)}
            alt={screen.title}
            fill
            priority
            quality={88}
            sizes={IMAGE_SIZES}
            className="select-none object-cover"
            draggable={false}
            onLoad={() => setLoaded(true)}
          />
          {screen.mood === "memory" && <div className="memory-grade pointer-events-none absolute inset-0" />}
          <EffectsLayer effects={effects} reduced={reduced} />
          {imageBlocks.map((bl) => (
            <BlockView key={bl.key} block={bl} instant={instant} compact={false} visible={visible} />
          ))}
          {debug && <DebugGrid />}
        </motion.div>
      </div>

      {/* Screen-space text (narration that follows the viewer, finale lines) */}
      <div className="pointer-events-none absolute inset-0">
        {screenBlocks.map((bl) => (
          <BlockView key={bl.key} block={bl} instant={instant} compact={false} />
        ))}
      </div>

      {/* Phones / portrait: dialogue gathers in a paper strip at the bottom */}
      {compact && compactBlocks.length > 0 && (
        <div className="compact-strip pointer-events-none absolute inset-x-3 bottom-14 flex flex-col gap-2">
          {compactBlocks.map((bl) => (
            <BlockView key={bl.key} block={bl} instant={instant} compact />
          ))}
        </div>
      )}
      {screen.mood === "memory" && <div className="film-grain pointer-events-none absolute inset-0" />}
    </div>
  );
});

const isDialog = (k: string) => k === "narration" || k === "speech";

function DebugGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={`v${i}`} className="absolute top-0 h-full border-l border-fuchsia-500/60" style={{ left: `${(i + 1) * 10}%` }}>
          <span className="absolute top-1 ml-1 rounded bg-fuchsia-600 px-1 text-[10px] text-white">{(i + 1) * 10}</span>
        </div>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <div key={`h${i}`} className="absolute left-0 w-full border-t border-fuchsia-500/60" style={{ top: `${(i + 1) * 10}%` }}>
          <span className="absolute left-1 mt-0.5 rounded bg-fuchsia-600 px-1 text-[10px] text-white">{(i + 1) * 10}</span>
        </div>
      ))}
    </div>
  );
}
