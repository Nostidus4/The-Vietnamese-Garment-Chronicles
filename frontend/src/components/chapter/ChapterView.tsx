"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HAS_API, runCompass, serverReady } from "@/lib/api";
import { track } from "@/lib/track";
import { initStepper, readStep, stepper, withStep, type Step, type StepperAction } from "@/lib/tryonStepper";
import type { CompassResult, Selection } from "@/lib/types";
import { useBootstrap } from "@/lib/useBootstrap";
import { AskTeo } from "./AskTeo";
import { Builder } from "./Builder";
import { ChapterQuiz } from "./ChapterQuiz";
import { ComparePanel } from "./ComparePanel";
import { STATE } from "./CompassPanel";
import { CompassStep, MAIN_BUTTON } from "./CompassStep";
import { StoryCard } from "./StoryCard";
import { ShopList } from "./ShopList";
import { TryOnPanel } from "./TryOnPanel";
import { WeatherNote } from "./WeatherNote";

export function ChapterView({
  regionId,
  garmentId,
}: {
  regionId: string;
  garmentId?: string;
}) {
  const { data, error } = useBootstrap();
  const [sel, setSel] = useState<Selection | null>(null);
  // the verdict is kept with the look it scored, so a stale one never opens step 3 for a changed look
  const [compass, setCompass] = useState<{ key: string; result: CompassResult | null } | null>(null);
  const [rescore, setRescore] = useState(0);
  const [steps, setSteps] = useState(() => initStepper({ offline: !HAS_API }));
  const [comparing, setComparing] = useState(false);
  const stepsTop = useRef<HTMLDivElement>(null);
  const params = useSearchParams();

  // wake a sleeping server while the viewer is still choosing, not after they press "Thử"
  useEffect(() => {
    void serverReady();
  }, []);

  const region = data?.regions.find((r) => r.id === regionId);
  const garments = data?.garments.filter((g) => g.region === regionId) ?? [];
  // ?garment= is read in the browser: the page itself is prebuilt, one per region
  const wanted = garmentId ?? params.get("garment") ?? undefined;
  const first = garments.find((g) => g.id === wanted) ?? garments[0]; // "Mặc thử" in the diary picks the garment
  // Default selection until the user picks something
  const current: Selection | null =
    sel ??
    (first
      ? {
          garment_id: first.id,
          occasion_id: first.occasions[0],
          vibe: "traditional",
          colors: [],
          accessories: [],
          modifications: [],
        }
      : null);

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

  // Re-run the Compass on every change
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

  // ---- the three steps; the current one lives in ?step= so the browser's back button walks the steps ----
  function act(a: StepperAction) {
    const next = stepper(steps, a);
    if (next === steps) return;
    setSteps(next);
    if (next.step !== steps.step) {
      window.history.pushState(null, "", withStep(window.location.search, next.step));
      stepsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
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

  function choose(next: Selection) {
    setSel(next);
    act({ type: "edit" });
  }

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return <p className="p-8">Đang lật trang…</p>;
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

  const garment = garments.find((g) => g.id === current.garment_id) ?? first;
  const badge = verdict ? STATE[verdict.state] : null;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
      {!HAS_API && (
        // the static site (GitHub Pages) has no server: reading works, Compass / try-on / Hỏi Tèo do not
        <p className="m-0 rounded-md border border-dashed border-[#8a4b2a]/60 bg-[#f7e4c8]/70 px-4 py-2 text-sm text-[#6b3c12] lg:col-span-2">
          Bản web này chưa nối máy chủ: con đọc được câu chuyện và cách mặc, còn <b>Compass chấm look, thử đồ AI, Hỏi Tèo, thời tiết và
          cửa hàng</b> sẽ chạy khi nhóm bật máy chủ.
        </p>
      )}
      <div className="space-y-4">
        <Link href="/" className="text-sm underline">
          ← Về bản đồ
        </Link>
        <h1 className="font-hand text-4xl">{region.name}</h1>
        <WeatherNote regionId={regionId} garmentId={garment.id} place={region.name.split("/")[0].trim()} />
        <ChapterQuiz regionId={regionId} phase="pre" />
        <StoryCard garment={garment} sources={data.sources} />
        <AskTeo key={garment.id} garment={garment} data={data} />
      </div>
      <div className="space-y-4">
        <section ref={stepsTop} className="paper scroll-mt-20 space-y-4 rounded-lg p-5">
          <StepTabs current={steps.step} reached={steps.reached} offline={steps.offline} onGo={(step) => act({ type: "go", step })} />
          {steps.offline && (
            <p className="m-0 text-sm text-stone-600">
              Bước 2 (Compass chấm look) và bước 3 (thử lên người) cần máy chủ. Bản web này chưa nối máy chủ nên con chọn đồ được, còn chấm và
              dựng ảnh thì chưa.
            </p>
          )}

          {steps.step === 1 && (
            <>
              {garments.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {garments.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => choose({ ...current, garment_id: g.id, colors: [], accessories: [], modifications: [] })}
                      className={`rounded-full border px-4 py-1 ${g.id === garment.id ? "bg-stone-800 text-amber-50" : ""}`}
                    >
                      {g.name_vi}
                    </button>
                  ))}
                </div>
              )}
              {steps.highlight.length > 0 && (
                <p className="m-0 rounded-md border border-red-300 bg-red-50/70 px-3 py-2 text-sm">
                  Món viền đỏ là món làm look bị ⛔. Bỏ hoặc đổi món đó rồi đi tiếp.
                </p>
              )}
              <Builder garment={garment} data={data} value={current} onChange={choose} highlight={steps.highlight} />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={steps.offline} onClick={() => act({ type: "next", verdict })} className={MAIN_BUTTON}>
                  Tiếp: Compass chấm look →
                </button>
                {!steps.offline && (
                  <span className="text-sm text-stone-600" aria-live="polite">
                    Compass: {badge ? `${badge.icon} ${badge.name}` : scored ? "chưa chấm được" : "đang chấm…"}
                  </span>
                )}
              </div>
            </>
          )}

          {steps.step === 2 && (
            <CompassStep
              data={data}
              selection={current}
              verdict={verdict}
              failed={!!scored && !verdict}
              onRetry={() => setRescore((n) => n + 1)}
              onNext={() => act({ type: "next", verdict })}
              onFix={() => verdict && act({ type: "fix", verdict })}
              onAlternative={() => act({ type: "alternative" })}
              onCompare={() => setComparing(true)}
            />
          )}

          {steps.step === 3 && (
            <TryOnPanel
              selection={current}
              alternative={steps.alternative ? (verdict?.alternative ?? null) : null}
              regionId={regionId}
              data={data}
              onRestyle={() => act({ type: "go", step: 1 })}
            />
          )}
        </section>
        <ShopList garmentId={garment.id} garmentName={garment.name_vi} />
        <ChapterQuiz regionId={regionId} phase="post" />
      </div>
      {/* kept mounted while closed so the pinned looks survive trips back to step 1 */}
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
    </main>
  );
}

const STEP_NAMES: Record<Step, string> = { 1: "Chọn đồ", 2: "Compass", 3: "Thử" };

function StepTabs({ current, reached, offline, onGo }: { current: Step; reached: Step; offline: boolean; onGo: (s: Step) => void }) {
  return (
    <nav aria-label="Các bước thử đồ">
      <ol className="m-0 flex list-none items-center gap-1 p-0 sm:gap-2">
        {([1, 2, 3] as Step[]).map((n) => {
          const here = n === current;
          const open = n <= reached && (n === 1 || !offline);
          return (
            <li key={n} className={`flex items-center gap-1 sm:gap-2 ${n > 1 ? "flex-1" : ""}`}>
              {n > 1 && <span aria-hidden className={`h-px min-w-2 flex-1 ${n <= reached ? "bg-stone-700" : "bg-stone-300"}`} />}
              <button
                type="button"
                disabled={!open || here}
                aria-current={here ? "step" : undefined}
                onClick={() => onGo(n)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm sm:px-3 ${
                  here ? "bg-[#27354f] text-amber-50" : open ? "underline-offset-2 hover:underline" : "text-stone-400"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                    here ? "border-amber-50" : n < current || (open && n <= reached) ? "border-stone-700" : "border-stone-300"
                  }`}
                >
                  {n < current ? "✓" : n}
                </span>
                <span>{STEP_NAMES[n]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
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
