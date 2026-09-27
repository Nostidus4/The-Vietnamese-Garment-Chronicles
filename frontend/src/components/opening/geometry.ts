// Camera math for full-screen 16:9 artwork.
//
// The image is drawn in a "box" that covers the viewport (like object-fit: cover) and is shifted
// toward the screen's focal point on narrow screens. The camera then scales/translates that box
// with transform-origin 0 0, so a point p (px inside the box) lands on screen at:
//   screen = offset + t + s * p

import type { Camera } from "@/lib/types";

export const IMAGE_ASPECT = 1672 / 941;

export interface Box {
  vw: number;
  vh: number;
  bw: number; // box width (px)
  bh: number;
  ox: number; // box offset from the viewport's top-left at scale 1
  oy: number;
}

export interface CamXform {
  tx: number;
  ty: number;
  s: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeBox(vw: number, vh: number, focal: { x: number; y: number }): Box {
  const bw = Math.max(vw, vh * IMAGE_ASPECT);
  const bh = bw / IMAGE_ASPECT;
  // Keep the focal point as close to the middle as the cover crop allows
  const ox = clamp(vw / 2 - (focal.x / 100) * bw, vw - bw, 0);
  const oy = clamp(vh / 2 - (focal.y / 100) * bh, vh - bh, 0);
  return { vw, vh, bw, bh, ox, oy };
}

export function cameraXform(box: Box, cam: Pick<Camera, "s" | "x" | "y" | "mode">): CamXform {
  const s = cam.s;
  const px = (cam.x / 100) * box.bw;
  const py = (cam.y / 100) * box.bh;
  let tx: number;
  let ty: number;
  if (cam.mode === "center") {
    tx = box.vw / 2 - box.ox - s * px;
    ty = box.vh / 2 - box.oy - s * py;
  } else {
    tx = px * (1 - s);
    ty = py * (1 - s);
  }
  // Never reveal the edge of the artwork
  tx = clamp(tx, box.vw - s * box.bw - box.ox, -box.ox);
  ty = clamp(ty, box.vh - s * box.bh - box.oy, -box.oy);
  return { tx, ty, s };
}

/** Where an image point (in %) currently is on screen, given the camera transform. */
export function pointOnScreen(box: Box, cam: CamXform, x: number, y: number) {
  return {
    x: box.ox + cam.tx + cam.s * (x / 100) * box.bw,
    y: box.oy + cam.ty + cam.s * (y / 100) * box.bh,
  };
}

export const EASE: Record<Camera["ease"], [number, number, number, number] | "linear"> = {
  linear: "linear",
  inOut: [0.65, 0, 0.35, 1],
  out: [0.16, 1, 0.3, 1],
  in: [0.55, 0, 1, 0.45],
};
