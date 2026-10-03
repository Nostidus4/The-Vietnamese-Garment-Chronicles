"use client";

// Bà's fitting room (/chapter/<region>): a virtual try-on. The mirror in the middle shows the look at once (a preview,
// then the AI picture), the rack on the left holds the garments, the drawers on the right hold the choices, and the
// Compass hangs on the mirror as a tag. The three steps of #39 (Chọn đồ → Compass → Thử) still drive it, so the
// browser's back button and the ⛔ rules work as before: one "Mặc lên người" button walks them for the reader.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HAS_API, runCompass, serverReady } from "@/lib/api";
import { asset } from "@/lib/base";
import { track } from "@/lib/track";
import { initStepper, readStep, stepper, withStep, type Step, type StepperAction, type StepperState } from "@/lib/tryonStepper";
import type { CompassResult, Garment, Selection } from "@/lib/types";
import { useBootstrap } from "@/lib/useBootstrap";
import { ComparePanel } from "./ComparePanel";
import { CompassPanel } from "./CompassPanel";
import { Fork } from "./CompassStep";
import { WeatherNote } from "./WeatherNote";
import { Mirror } from "../fitting/Mirror";
import { AboutSheet, Drawers, EventPicker, GarmentRack, type SheetTab } from "../fitting/Parts";
import { useTryOn } from "../fitting/useTryOn";

const lookOf = (g: Garment, occasion?: string): Selection => ({
  garment_id: g.id,
  occasion_id: occasion && g.occasions.includes(occasion) ? occasion : g.occasions[0],
  vibe: "traditional",
  colors: [],
  accessories: [],
  modifications: [],
});

export function ChapterView({ regionId, garmentId }: { regionId: string; garmentId?: string }) {
  const { data, error } = useBootstrap();
  const [sel, setSel] = useState<Selection | null>(null);
  // the verdict is kept with the look it scored, so a stale one never opens step 3 for a changed look
  const [compass, setCompass] = useState<{ key: string; result: CompassResult | null } | null>(null);
  const [rescore, setRescore] = useState(0);
  const [steps, setSteps] = useState(() => initStepper({ offline: !HAS_API }));
  const [comparing, setComparing] = useState(false);
  const [why, setWhy] = useState(false);
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [toast, setToast] = useState(false);
  const params = useSearchParams();
  const [event, setEvent] = useState<{ asked: boolean; occasion: string | null }>(() => ({ asked: params.get("entry") !== "event", occasion: null }));
  const tryon = useTryOn({ data: data ?? EMPTY });

  // wake a sleeping server while the viewer is still choosing, not after they press "Mặc lên người"
  useEffect(() => {
    void serverReady();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const region = data?.regions.find((r) => r.id === regionId);
  // the rack: this region's garments first, then the other open regions' (try-on stays closed where the community
  // has not read the chapter yet, as on the Mặc pages of the book)
  const open = new Set(data?.regions.filter((r) => r.status === "open").map((r) => r.id) ?? []);
  const rack = [
    ...(data?.garments.filter((g) => g.region === regionId) ?? []),
    ...(data?.garments.filter((g) => g.region !== regionId && open.has(g.region)) ?? []),
  ];
  // ?garment= is read in the browser: the page itself is prebuilt, one per region
  const wanted = garmentId ?? params.get("garment") ?? undefined;
  const first = rack.find((g) => g.id === wanted) ?? rack[0];
  const current: Selection | null = sel ?? (first ? lookOf(first) : null);

  // anonymous Impact events: which occasion was picked, and whether a flagged look got fixed
  const lastPick = useRef("");
  const flagged = useRef<Record<string, "review" | "distorted">>({});
  function report(sel: Selection, r: CompassResult) {
    track("compass_result", { state: r.state, garment_id: sel.garment_id, occasion_id: sel.occasion_id });
    const pick = `${sel.garment_id}/${sel.occasion_id}`;
    if (pick !== lastPick.current) {
      lastPick.current = pick;
      track("occasion_selected", { garment_id: sel.garment_id, occasion_id: sel.occasion_id, fits: !r.triggers.some((t) => t.type === "occasion") });
    }
    const was = flagged.current[sel.garment_id];
    if (r.state === "review" || r.state === "distorted") flagged.current[sel.garment_id] = r.state;
    else if (was) {
      track("look_fixed", { from_state: was, to_state: r.state, garment_id: sel.garment_id });
      delete flagged.current[sel.garment_id];
    }
  }

  // re-run the Compass on every change of the look
  const lookKey = JSON.stringify(current);
  useEffect(() => {
    if (!current || !HAS_API) return;
    let alive = true;
    const sel = current;
    runCompass(sel)
      .then((r) => {
        if (!alive) return;
        setCompass({ key: lookKey, result: r });
        report(sel, r);
      })
      .catch(() => alive && setCompass({ key: lookKey, result: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookKey, rescore]);
  const scored = compass?.key === lookKey ? compass : null;
  const verdict = scored?.result ?? null;

  // ---- the steps: the current one lives in ?step= so the browser's back button walks them ----
  function moveTo(next: StepperState) {
    if (next === steps) return;
    setSteps(next);
    if (next.step !== steps.step) window.history.pushState(null, "", withStep(window.location.search, next.step));
  }
  const act = (a: StepperAction) => moveTo(stepper(steps, a));
  const urlStep: Step = readStep(params) ?? 1; // the diary's "Mặc thử →" (?garment= only) opens step 1
  // the URL moved (back / forward button): follow it if the stepper allows, during render rather than in an effect
  const [seenUrlStep, setSeenUrlStep] = useState(urlStep);
  if (urlStep !== seenUrlStep) {
    setSeenUrlStep(urlStep);
    setSteps((s) => stepper(s, { type: "go", step: urlStep }));
  }
  useEffect(() => {
    // a ?step= that could not be honoured (a link to step 3, forward past a changed look): show where we really are
    const there = readStep(window.location.search);
    if (there !== null && there !== steps.step) window.history.replaceState(null, "", withStep(window.location.search, steps.step));
  }, [urlStep, steps.step]);

  /** A new look: the old picture no longer shows it, and the steps start again from the choices. */
  function choose(next: Selection) {
    setSel(next);
    tryon.clear();
    let s = stepper(steps, { type: "edit" });
    if (s.step !== 1) s = stepper(s, { type: "go", step: 1 });
    moveTo(s);
  }

  /** "Mặc lên người": through the Compass (stopping there for ⛔) and on to the render. */
  function wear() {
    if (!current || !verdict) return;
    let s = steps.step === 1 ? stepper(steps, { type: "next", verdict }) : steps;
    if (verdict.state === "distorted") return moveTo(s); // the fork shows on the mirror
    if (s.step === 2) s = stepper(s, { type: "next", verdict });
    moveTo(s);
    if (s.step === 3) void tryon.run(current);
  }
  function wearAlternative() {
    if (!verdict?.alternative) return;
    const s = stepper(steps, { type: "alternative" });
    moveTo(s);
    if (s.step === 3) void tryon.run(verdict.alternative);
  }

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return <p className="p-8">Đang mở phòng thử…</p>;
  if (!region)
    return (
      <p className="p-8">
        Không có vùng này.{" "}
        <Link href="/" className="underline">
          Về bản đồ
        </Link>
      </p>
    );
  if (region.status === "locked" || !current) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="font-hand text-4xl">{region.name}</h1>
        <p className="mt-4">🔒 {region.lock_note}</p>
        <Link href="/" className="mt-6 inline-block underline">
          ← Về bản đồ
        </Link>
      </main>
    );
  }

  const garment = rack.find((g) => g.id === current.garment_id) ?? first;
  const fork = steps.step === 2 && verdict?.state === "distorted";
  const offline = steps.offline;
  const place = region.name.split("/")[0].trim();

  return (
    <main className="fitting" style={{ backgroundImage: `linear-gradient(rgba(20,12,7,0.55), rgba(20,12,7,0.78)), url(${asset("/page/fitting-room.webp")}), url(${asset("/page/Desk.webp")})` }}>
      <header className="fitting-head">
        {/* back to the Mặc page this try-on was opened from (DeskScene reopens the book there); Link adds the base path */}
        <Link href={`/?region=${garment.region}&page=wear`} className="page-turn shrink-0 !text-[0.95rem]">
          ‹ Về trang Mặc
        </Link>
        <div className="min-w-0 text-center">
          <p className="m-0 text-[0.6rem] uppercase tracking-[0.3em] text-amber-100/70">Phòng thử đồ của Bà · {place}</p>
          <h1 className="font-hand m-0 truncate text-[1.7rem] leading-tight text-amber-50">{garment.name_vi}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setSheet("story")} className="page-turn !text-[0.95rem]">
            📖 <span className="hidden sm:inline">Hiểu bộ áo</span>
          </button>
          <button type="button" onClick={() => setSheet("teo")} className="page-turn !text-[0.95rem]" title="Hỏi Tèo">
            📌 <span className="hidden sm:inline">Hỏi Tèo</span>
          </button>
        </div>
      </header>

      {offline && (
        // the static site (GitHub Pages) has no server: choosing and the preview work, Compass and the render do not
        <p className="fitting-note">Bản web này chưa nối máy chủ: con chọn đồ và xem ảnh trước được, còn Compass chấm và mặc thử bằng AI sẽ chạy khi nhóm bật máy chủ.</p>
      )}

      <div className="fitting-grid">
        <GarmentRack
          garments={rack}
          data={data}
          current={garment.id}
          occasion={event.occasion}
          onPick={(g) => g.id !== garment.id && choose(lookOf(g, event.occasion ?? current.occasion_id))}
        />

        <div className="fitting-stage">
          <div className="fitting-weather empty:hidden">
            <WeatherNote regionId={garment.region} garmentId={garment.id} place={place} />
          </div>
          <Mirror
            key={garment.id}
            garmentId={garment.id}
            garmentName={garment.name_vi}
            verdict={verdict}
            scoring={!scored}
            offline={offline}
            tryon={tryon}
            onTag={() => verdict && setWhy(true)}
          >
            {fork && verdict && (
              <div className="absolute inset-x-3 bottom-3 max-h-[75%] overflow-y-auto rounded-lg bg-[var(--paper)]/95 p-3 shadow-xl">
                <Fork data={data} selection={current} verdict={verdict} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={wearAlternative} className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
                    Mặc phương án thay thế →
                  </button>
                  <button type="button" onClick={() => act({ type: "fix", verdict })} className="rounded-full border border-stone-700 px-4 py-1.5 text-sm">
                    ← Tự sửa lại
                  </button>
                </div>
              </div>
            )}
          </Mirror>
        </div>

        <Drawers garment={garment} data={data} value={current} onChange={choose} highlight={steps.highlight} />
      </div>

      <ActionBar>
        <PhotoPicker tryon={tryon} />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tryon.image && !tryon.busy && tryon.saveLabel ? (
            <>
              <button
                type="button"
                disabled={tryon.saved}
                className="page-turn page-turn-main"
                onClick={async () => {
                  if (await tryon.save()) setToast(true);
                }}
              >
                {tryon.saved ? "Đã lưu vào Du Ký ✓" : "Lưu vào Du Ký"}
              </button>
              <button type="button" disabled={tryon.locked} onClick={() => current && tryon.run(steps.alternative && verdict?.alternative ? verdict.alternative : current)} className="page-turn">
                {tryon.countdown ?? "↻ Dựng lại"}
              </button>
            </>
          ) : (
            <button type="button" disabled={offline || tryon.locked || !verdict} onClick={wear} className="page-turn page-turn-main !px-7">
              {offline
                ? "Mặc thử cần máy chủ"
                : tryon.busy
                  ? (tryon.stageLabel ?? "Đang may…")
                  : (tryon.countdown ??
                    (!verdict
                      ? scored
                        ? "Compass chưa chấm được"
                        : "Compass đang chấm…"
                      : verdict.state === "distorted"
                        ? "⛔ Xem cách sửa"
                        : tryon.photo
                          ? "✨ Mặc lên ảnh của con"
                          : "✨ Mặc lên người"))}
            </button>
          )}
          {scored && !verdict && !offline && (
            <button type="button" onClick={() => setRescore((n) => n + 1)} className="text-sm text-amber-50 underline">
              Chấm lại
            </button>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 text-sm text-amber-50">
          {!offline && (
            <button type="button" onClick={() => setComparing(true)} className="underline">
              So với bộ khác
            </button>
          )}
          <button type="button" onClick={() => setSheet("shops")} className="underline">
            Thuê / may ở đâu
          </button>
        </div>
      </ActionBar>

      {/* the Compass's "why", opened from the tag on the mirror */}
      {why && verdict && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#140c07]/55 p-4" role="dialog" aria-modal="true" aria-label="Compass: vì sao?" onClick={() => setWhy(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CompassPanel result={verdict} sources={data.sources} />
            <button type="button" onClick={() => setWhy(false)} className="mx-auto mt-3 block rounded-full bg-amber-50 px-4 py-1.5 text-sm">
              Đóng
            </button>
          </div>
        </div>
      )}

      <AboutSheet tab={sheet} onTab={setSheet} onClose={() => setSheet(null)} garment={garment} data={data} regionId={garment.region} />

      {/* kept mounted while closed so the pinned looks survive */}
      <CompareDrawer open={comparing} onClose={() => setComparing(false)}>
        <ComparePanel
          current={current}
          data={data}
          onUse={(s) => {
            choose(s);
            setComparing(false);
          }}
        />
      </CompareDrawer>

      {!event.asked && (
        <EventPicker
          data={data}
          onPick={(occasion) => {
            setEvent({ asked: true, occasion });
            if (!occasion) return;
            // the garment on the mirror should suit the event: keep it if it does, else the first that does
            const pick = garment.occasions.includes(occasion) ? garment : (rack.find((g) => g.occasions.includes(occasion)) ?? garment);
            choose(lookOf(pick, occasion));
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-lg bg-stone-900 px-4 py-3 text-sm text-amber-50 shadow-lg">
          <span>Đã lưu vào Du Ký ✓</span>
          <button type="button" onClick={() => setSheet("quiz-post")} className="underline">
            Thử lại: Việt hay không?
          </button>
          <a href={asset("/du-ky")} className="ml-auto font-semibold text-amber-200 underline">
            Mở Du Ký
          </a>
          <button type="button" aria-label="Đóng" onClick={() => setToast(false)} className="text-amber-50/70">
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

const EMPTY = { garments: [] } as unknown as NonNullable<ReturnType<typeof useBootstrap>["data"]>;

function ActionBar({ children }: { children: ReactNode }) {
  return <div className="fitting-bar">{children}</div>;
}

/** "Dùng ảnh của con" or the model: the photo stays in the browser until the render, never on the server. */
function PhotoPicker({ tryon }: { tryon: ReturnType<typeof useTryOn> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-amber-50">
      <label className={`page-turn cursor-pointer !text-[0.95rem] ${tryon.locked ? "pointer-events-none opacity-50" : ""}`} title="Nửa người, đứng thẳng, nền đơn giản. Ảnh không lưu trên máy chủ.">
        📷 {tryon.photo ? "Đổi ảnh" : "Dùng ảnh của con"}
        <input type="file" accept="image/*" className="sr-only" disabled={tryon.locked} onChange={(e) => tryon.setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      {tryon.photo && (
        <button type="button" disabled={tryon.locked} onClick={() => tryon.setPhoto(null)} className="underline disabled:opacity-50">
          Dùng người mẫu
        </button>
      )}
    </div>
  );
}

/** Side drawer (bottom sheet on phones) for "So với bộ khác". */
function CompareDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <div className={open ? "fixed inset-0 z-40" : "hidden"} role="dialog" aria-modal="true" aria-label="So với bộ khác">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-stone-900/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-[var(--paper)] p-4 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[34rem] sm:rounded-none sm:rounded-l-xl">
        <div className="mb-2 flex items-center">
          <p className="m-0 font-semibold">So với bộ khác</p>
          <button type="button" onClick={onClose} className="ml-auto text-sm underline">
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
