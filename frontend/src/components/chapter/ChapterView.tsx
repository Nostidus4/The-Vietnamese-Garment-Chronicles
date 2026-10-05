"use client";

// Tủ áo của Bà (/chapter/<region>): a paper-doll dress-up. The reader picks who wears (Nữ · Nam soon · Con with their
// own photo), opens the wardrobe and dresses the doll piece by piece; the Compass (lib/compass.ts, the same verdicts as
// the server's) judges every change at once, on its tag. "Xong rồi" drops a Việt phục card from the top, and the card
// is saved into the Du Ký. With "Con", the look is put on the reader's photo by the try-on (Gemini) first.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HAS_API, serverReady } from "@/lib/api";
import { asset } from "@/lib/base";
import { compassContent, evaluate } from "@/lib/compass";
import { addPage, addPhoto, dataUrlToBlob, ensureMigrated, newPage } from "@/lib/dukyBook";
import { track } from "@/lib/track";
import type { Bootstrap, CompassResult, Garment, Selection, WardrobeItem, WardrobeSlot } from "@/lib/types";
import { useBootstrap } from "@/lib/useBootstrap";
import { ComparePanel } from "./ComparePanel";
import { CompassPanel, STATE } from "./CompassPanel";
import { Fork } from "./CompassStep";
import { WeatherNote } from "./WeatherNote";
import { cardPicture, dollImage } from "../fitting/cardImage";
import { Mirror } from "../fitting/Mirror";
import { DRAWN, PaperDoll, type Dress } from "../fitting/PaperDoll";
import { AboutSheet, EventPicker, type SheetTab } from "../fitting/Parts";
import { useTryOn } from "../fitting/useTryOn";
import { baNote, DRAWERS, LookCard, OutfitList, STAMP, WardrobePanel, WhoPicker, type CardFace, type Drawer, type ItemState, type Who } from "../fitting/Wardrobe";

type Look = { worn: Partial<Record<WardrobeSlot, string>>; colors: string[]; mods: Selection["modifications"]; occasion: string };
const KEY = "vpdk-wardrobe";
const COUNT = "vpdk-card-count";

function remembered(): { who: Who | null; look: Look | null } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return { who: v?.who ?? null, look: v?.look ?? null };
  } catch {
    return { who: null, look: null };
  }
}

export function ChapterView({ regionId, garmentId }: { regionId: string; garmentId?: string }) {
  const { data, error } = useBootstrap();
  const params = useSearchParams();
  const [who, setWho] = useState<Who | null>(() => (typeof window === "undefined" ? null : remembered().who));
  const [askWho, setAskWho] = useState(false);
  const [look, setLook] = useState<Look | null>(null);
  const [history, setHistory] = useState<Look[]>([]);
  const [drawer, setDrawer] = useState<Drawer>("set");
  const [event, setEvent] = useState(() => ({ asked: params.get("entry") !== "event" }));
  const [card, setCard] = useState<CardFace | null>(null);
  const [saved, setSaved] = useState(false);
  const [fork, setFork] = useState(false);
  const [why, setWhy] = useState(false);
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [comparing, setComparing] = useState(false);
  const [real, setReal] = useState<string | null>(null); // "Xem ảnh thật" of a garment
  const [toast, setToast] = useState(false);
  const [pulse, setPulse] = useState(0); // the Compass tag swings on every change
  const doll = useRef<SVGSVGElement>(null); // a still copy of the doll, the source of the card's picture
  const tryon = useTryOn({ data: data ?? EMPTY });

  useEffect(() => {
    void serverReady();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const region = data?.regions.find((r) => r.id === regionId);
  const items = useMemo(() => {
    if (!data) return [];
    const open = new Set(data.regions.filter((r) => r.status === "open").map((r) => r.id));
    const regionOf = (it: WardrobeItem) => data.garments.find((g) => g.id === it.garment)?.region ?? "";
    const all = data.wardrobe ?? [];
    // this region's garments first, then the other open regions'; accessories after the garments
    const sets = all.filter((it) => it.garment && open.has(regionOf(it)));
    sets.sort((a, b) => Number(regionOf(b) === regionId) - Number(regionOf(a) === regionId));
    return [...sets, ...all.filter((it) => it.accessory)];
  }, [data, regionId]);
  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const compass = useMemo(() => (data?.rules ? compassContent({ ...data, rules: data.rules } as Parameters<typeof compassContent>[0]) : null), [data]);

  // the first look: what this reader left last time, or the garment the diary's "Mặc thử" asked for
  const wanted = garmentId ?? params.get("garment") ?? undefined;
  const start: Look | null = useMemo(() => {
    if (!data) return null;
    const last = typeof window === "undefined" ? null : remembered().look;
    const set = items.find((it) => it.garment === wanted) ?? (last?.worn.set ? byId.get(last.worn.set) : undefined) ?? items.find((it) => it.slot === "set");
    const g = data.garments.find((x) => x.id === set?.garment);
    if (last && set && last.worn.set === set.id) return last;
    return { worn: set ? { set: set.id } : {}, colors: [], mods: [], occasion: g?.occasions[0] ?? data.occasions[0].id };
  }, [data, items, byId, wanted]);
  const current = look ?? start;

  const setItem = current?.worn.set ? byId.get(current.worn.set) : undefined;
  const garment = data?.garments.find((g) => g.id === setItem?.garment) ?? null;
  const selection: Selection | null =
    current && garment
      ? {
          garment_id: garment.id,
          occasion_id: current.occasion,
          vibe: "traditional",
          colors: current.colors,
          accessories: Object.entries(current.worn)
            .filter(([slot]) => slot !== "set")
            .map(([, id]) => byId.get(id!)?.accessory)
            .filter((a): a is string => !!a && garment.accessories.includes(a)),
          modifications: current.mods,
        }
      : null;
  // the Compass is a few lookups: judging on every render costs less than keeping it in sync
  const verdict: CompassResult | null = compass && selection ? judge(compass, selection) : null;
  const bad = new Set(verdict?.triggers.filter((t) => t.state === "distorted").map((t) => t.target) ?? []);

  /** Every change of the look goes through here: kept for "Hoàn tác", remembered on this device, the tag swings. */
  function change(next: Look) {
    if (!current) return;
    setHistory((h) => [...h.slice(-19), current]);
    setLook(next);
    setPulse((n) => n + 1);
    tryon.clear();
    try {
      localStorage.setItem(KEY, JSON.stringify({ who, look: next }));
    } catch {
      // private mode: the look lasts for this visit
    }
  }
  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setLook(prev);
    setPulse((n) => n + 1);
  }
  const keys = useRef({ undo });
  useEffect(() => {
    keys.current = { undo };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        keys.current.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function pickWho(w: Who) {
    setWho(w);
    setAskWho(false);
    try {
      localStorage.setItem(KEY, JSON.stringify({ who: w, look: current }));
    } catch {
      // private mode
    }
  }

  function stateOf(it: WardrobeItem): ItemState {
    if (!current || !data) return "plain";
    if (!DRAWN.has(it.art) && !it.layers[who ?? "nu"]) return "lock";
    if (who === "nam" && !it.bodies.includes("nam")) return "lock";
    if (current.worn[it.slot] === it.id) return it.accessory && bad.has(it.accessory) ? "bad" : "worn";
    if (it.accessory && garment && !garment.accessories.includes(it.accessory)) return "dim";
    if (it.garment && !data.garments.find((g) => g.id === it.garment)?.occasions.includes(current.occasion)) return "dim";
    return "plain";
  }
  function noteOf(it: WardrobeItem): string {
    if (!data) return "";
    const st = stateOf(it);
    if (st === "lock") return who === "nam" ? "chưa có dáng nam" : "chưa vẽ";
    if (st === "worn") return "đang mặc";
    if (st === "bad") return "gây sai lệch";
    if (it.garment) {
      const g = data.garments.find((x) => x.id === it.garment)!;
      if (st === "dim") return "chưa hợp dịp này";
      return data.regions.find((r) => r.id === g.region)?.name.split("/")[0].trim() ?? "";
    }
    const a = data.accessories[it.accessory!];
    if (st === "dim") return garment ? `không đi với ${garment.name_vi.toLowerCase()}` : "";
    if (a.verified === false && a.kind === "traditional-vn") return "Tèo đang kiểm tra";
    return ({ "traditional-vn": "Việt", modern: "hiện đại", "traditional-foreign": "nước khác", restricted: "lễ nghi" } as Record<string, string>)[a.kind] ?? "";
  }

  /** Wear or take off one piece. A new garment starts its colours and zones afresh and drops what it does not go with. */
  function toggle(it: WardrobeItem) {
    if (!current || !data || stateOf(it) === "lock") return;
    const worn = { ...current.worn };
    if (worn[it.slot] === it.id) {
      delete worn[it.slot];
      return change({ ...current, worn });
    }
    worn[it.slot] = it.id;
    track("wardrobe_wear", { item_id: it.id, body: who ?? "nu" });
    if (it.slot === "set") {
      const g = data.garments.find((x) => x.id === it.garment)!;
      for (const [slot, id] of Object.entries(worn)) {
        const acc = byId.get(id!)?.accessory;
        if (slot !== "set" && acc && !g.accessories.includes(acc)) delete worn[slot as WardrobeSlot];
      }
      return change({ worn, colors: [], mods: [], occasion: current.occasion });
    }
    change({ ...current, worn });
  }

  /** 🎲 Bà chọn giúp: a garment for the occasion and a few Vietnamese pieces, always ✅ or ✨. */
  function surprise() {
    if (!current || !data || !compass) return;
    const sets = items.filter((it) => it.slot === "set" && stateOf(it) !== "lock" && data.garments.find((g) => g.id === it.garment)?.occasions.includes(current.occasion));
    for (let n = 0; n < 40 && sets.length; n++) {
      const s = pick(sets);
      const g = data.garments.find((x) => x.id === s.garment)!;
      const worn: Look["worn"] = { set: s.id };
      for (const slot of ["head", "feet", "hand"] as WardrobeSlot[]) {
        const fit = items.filter((it) => it.slot === slot && it.accessory && g.accessories.includes(it.accessory) && data.accessories[it.accessory].kind === "traditional-vn");
        if (fit.length && chance(0.8)) worn[slot] = pick(fit).id;
      }
      const colors = chance(0.6) ? [pick(g.colors)] : [];
      const accessories = Object.values(worn)
        .map((id) => byId.get(id!)?.accessory)
        .filter((a): a is string => !!a);
      const v = evaluate(compass, { garment_id: g.id, occasion_id: current.occasion, vibe: "traditional", colors, accessories, modifications: [] });
      if (v.state === "fit" || v.state === "adapted") return change({ worn, colors, mods: [], occasion: current.occasion });
    }
  }

  /** ⛔ "Mặc phương án thay thế": the Compass's swapped look, back on the doll. */
  function wearAlternative() {
    if (!current || !verdict?.alternative) return;
    const alt = verdict.alternative;
    const worn: Look["worn"] = { set: current.worn.set };
    for (const a of alt.accessories) {
      const it = items.find((x) => x.accessory === a);
      if (it) worn[it.slot] = it.id;
    }
    change({ worn, colors: alt.colors, mods: alt.modifications, occasion: alt.occasion_id });
    setFork(false);
  }

  function openCard(image: string, isAI: boolean) {
    if (!data || !garment || !selection || !verdict || !current) return;
    let n = 1;
    try {
      n = Number(localStorage.getItem(COUNT) ?? "0") + 1;
    } catch {
      // private mode: every card is number 1
    }
    const state = isAI && tryon.result?.rendered_alternative ? (tryon.result.compass.alternative_state ?? verdict.state) : verdict.state;
    setCard({
      image,
      isAI,
      state,
      number: n,
      title: `${garment.name_vi} · ${data.occasions.find((o) => o.id === current.occasion)?.name.split("/")[0].trim()}`,
      place: data.regions.find((r) => r.id === garment.region)?.name.split("/")[0].trim() ?? "",
      date: new Date().toLocaleDateString("vi-VN"),
      note: baNote(data, garment, selection, verdict),
      items: [garment.name_vi, ...selection.accessories.map((a) => data.accessories[a]?.name_vi ?? a)],
    });
    setSaved(false);
  }

  /** "Xong rồi": the card drops. With "Con", the look is first put on the reader's photo. */
  async function finish() {
    if (!data || !garment || !selection || !verdict) return;
    if (verdict.state === "distorted") return setFork(true);
    if (who === "con") {
      if (!tryon.photo) return document.getElementById("con-photo")?.click();
      await tryon.run(selection);
      return;
    }
    if (doll.current) openCard(dollImage(doll.current), false);
  }
  // the reader's own photo came back from the try-on: its card drops
  const [shownFor, setShownFor] = useState<string | null>(null);
  if (who === "con" && tryon.image && !tryon.busy && tryon.result && shownFor !== tryon.image && garment && selection && verdict) {
    setShownFor(tryon.image);
    openCard(tryon.image, true);
  }

  async function save(cardEl: HTMLElement) {
    if (!card || !data || !garment || !selection || saved) return;
    setSaved(true);
    const stamp = STAMP[card.state];
    const png = await cardPicture({ art: card.image, title: card.title, meta: `${card.place} · ${card.date}`, number: card.number, stamp: stamp.word, icon: stamp.icon, aiNote: card.isAI });
    await ensureMigrated(data.garments);
    const page = addPage(
      newPage({
        region_id: garment.region,
        garment_id: garment.id,
        occasion_id: selection.occasion_id,
        look: selection,
        compass_label: stamp.word ? (verdict?.label ?? null) : null,
        compass_state: card.state,
      }),
    );
    await addPhoto(page.id, await dataUrlToBlob(png), card.isAI ? "ai" : "card", card.isAI && tryon.isSample);
    try {
      localStorage.setItem(COUNT, String(card.number));
    } catch {
      // private mode
    }
    track("duky_save", { kind: card.isAI ? "ai" : "card", garment_id: garment.id });
    await flyToDuKy(cardEl, png);
    setCard(null);
    setToast(true);
  }

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data || !current) return <p className="p-8">Đang mở tủ áo…</p>;
  if (!region)
    return (
      <p className="p-8">
        Không có vùng này.{" "}
        <Link href="/" className="underline">
          Về bản đồ
        </Link>
      </p>
    );
  if (region.status === "locked") {
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

  const place = region.name.split("/")[0].trim();
  const worn = Object.values(current.worn)
    .map((id) => byId.get(id!))
    .filter((it): it is WardrobeItem => !!it);
  const dress: Dress = Object.fromEntries(worn.map((it) => [it.slot, it.art]));
  const [c1, c2] = colorsOf(data, garment, current.colors);
  const yem = current.mods.find((m) => m.zone.startsWith("yếm"))?.change;
  const tag = verdict ? STATE[verdict.state] : null;
  const main = !garment
    ? { label: "Chọn một bộ áo trước", off: true }
    : verdict?.state === "distorted"
      ? { label: "⛔ Xem cách sửa", off: false }
      : who === "con"
        ? !HAS_API
          ? { label: "Cần máy chủ để dựng ảnh của con", off: true }
          : tryon.busy
            ? { label: tryon.stageLabel ?? "Đang may…", off: true }
            : { label: tryon.photo ? "Dựng ảnh của con ›" : "📷 Chọn ảnh của con", off: false }
        : { label: "Xong rồi ›", off: !verdict };

  return (
    <main
      className="fitting"
      style={{
        backgroundImage: `linear-gradient(rgba(20,12,7,0.55), rgba(20,12,7,0.12) 26%, rgba(20,12,7,0.12) 70%, rgba(20,12,7,0.8)), url(${asset("/page/fitting-room.webp")}), url(${asset("/page/Desk.webp")})`,
      }}
    >
      <header className="fitting-head">
        {/* back to the Mặc page this room was opened from (DeskScene reopens the book there); Link adds the base path */}
        <Link href={`/?region=${garment?.region ?? regionId}&page=wear`} className="page-turn shrink-0 !text-[0.95rem]">
          ‹ Về trang Mặc
        </Link>
        <div className="min-w-0 text-center">
          <p className="m-0 text-[0.6rem] uppercase tracking-[0.3em] text-amber-100/80">Tủ áo của Bà · {place}</p>
          <h1 className="font-hand m-0 truncate text-[1.7rem] leading-tight text-amber-50">{garment?.name_vi ?? "Chọn một bộ áo"}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setSheet("story")} disabled={!garment} className="page-turn !text-[0.95rem]">
            📖 <span className="hidden sm:inline">Hiểu bộ áo</span>
          </button>
          <button type="button" onClick={() => setSheet("teo")} disabled={!garment} className="page-turn !text-[0.95rem]" title="Hỏi Tèo">
            📌 <span className="hidden sm:inline">Hỏi Tèo</span>
          </button>
        </div>
      </header>

      <div className="fitting-grid">
        <WardrobePanel
          data={data}
          items={items}
          stateOf={stateOf}
          noteOf={noteOf}
          onToggle={toggle}
          garment={garment}
          selection={selection}
          onSelection={(s) => change({ ...current, colors: s.colors, mods: s.modifications })}
          occasion={current.occasion}
          open={drawer}
          onOpen={setDrawer}
          onLookReal={setReal}
        />

        <div className="fitting-stage">
          {garment && (
            <div className="fitting-weather empty:hidden">
              <WeatherNote regionId={garment.region} garmentId={garment.id} place={place} />
            </div>
          )}
          <button type="button" onClick={() => setAskWho(true)} className="who-switch">
            👤 {who === "con" ? "Con" : who === "nam" ? "Nam" : "Nữ"} ▾
          </button>
          {who === "con" && garment ? (
            <Mirror key={garment.id} garmentId={garment.id} garmentName={garment.name_vi} verdict={verdict} scoring={false} offline={!compass} tryon={tryon} onTag={() => verdict && setWhy(true)} />
          ) : (
            <figure className="m-0 flex flex-col items-center">
              <div className="mirror-frame dress-form">
                <div className="mirror-glass relative h-full w-full overflow-hidden">
                  <PaperDoll
                    dress={dress}
                    colors={{ main: c1, second: c2, yem: yem === "yem-dao" ? "#f4a6a0" : yem === "yem-trang" ? "#fafafa" : undefined }}
                    className="absolute inset-0 h-full w-full p-[6%]"
                    title={`Búp bê mặc ${garment?.name_vi ?? "áo lót"}`}
                  />
                </div>
                <motion.button
                  key={pulse}
                  type="button"
                  onClick={() => verdict && setWhy(true)}
                  className={`mirror-tag ${tag ? "" : "mirror-tag-quiet"} ${verdict?.state === "distorted" ? "mirror-tag-bad" : ""}`}
                  aria-label="Compass: vì sao?"
                  initial={{ rotate: 12 }}
                  animate={{ rotate: [12, -3, 2, 6] }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="mirror-tag-hole" aria-hidden />
                  <span className="block text-[0.6rem] uppercase tracking-[0.18em] opacity-70">Compass</span>
                  <span className="block text-sm font-semibold leading-tight">{tag ? `${tag.icon} ${tag.name}` : garment ? "chưa chấm được" : "chưa mặc gì"}</span>
                  {tag && <span className="block text-[0.62rem] underline opacity-70">vì sao?</span>}
                </motion.button>
              </div>
              <figcaption className="mirror-caption">Bấm một món trong tủ để mặc, bấm lần nữa để cởi</figcaption>
              <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
                <PaperDoll ref={doll} still dress={dress} colors={{ main: c1, second: c2, yem: yem === "yem-dao" ? "#f4a6a0" : yem === "yem-trang" ? "#fafafa" : undefined }} />
              </div>
            </figure>
          )}
        </div>

        <OutfitList data={data} worn={worn} bad={bad} occasion={current.occasion} onOccasion={(o) => change({ ...current, occasion: o })} onTakeOff={toggle} />
      </div>

      <div className="fitting-bar">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={undo} disabled={!history.length} className="page-turn !text-[0.95rem]">
            ↶ Hoàn tác
          </button>
          <button type="button" onClick={surprise} className="page-turn !text-[0.95rem]">
            🎲 Bà chọn giúp
          </button>
        </div>
        <div className="flex justify-center">
          <button type="button" disabled={main.off} onClick={finish} className="page-turn page-turn-main !px-7">
            {main.label}
          </button>
          <input id="con-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => tryon.setPhoto(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex items-center justify-end gap-3 text-sm text-amber-50">
          {HAS_API && garment && (
            <button type="button" onClick={() => setComparing(true)} className="underline">
              So với bộ khác
            </button>
          )}
          {garment && (
            <button type="button" onClick={() => setSheet("shops")} className="underline">
              Thuê / may ở đâu
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(askWho || (!who && event.asked)) && <WhoPicker key="who" value={who} onPick={pickWho} onClose={who ? () => setAskWho(false) : undefined} />}
        {!event.asked && (
          <EventPicker
            key="event"
            data={data}
            onPick={(occasion) => {
              setEvent({ asked: true });
              if (!occasion) return;
              const fits = items.find((it) => it.slot === "set" && data.garments.find((g) => g.id === it.garment)?.occasions.includes(occasion));
              const keep = garment?.occasions.includes(occasion);
              change({ ...current, occasion, ...(keep || !fits ? {} : { worn: { set: fits.id }, colors: [], mods: [] }) });
            }}
          />
        )}
        {card && (
          <LookCard
            key="card"
            face={card}
            saved={saved}
            onSave={save}
            onClose={() => setCard(null)}
            onRedo={
              who === "con" && selection
                ? () => {
                    setCard(null);
                    void tryon.run(selection);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      {fork && verdict && selection && (
        <Modal label="Cách sửa look ⛔" onClose={() => setFork(false)}>
          <Fork data={data} selection={selection} verdict={verdict} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={wearAlternative} className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
              Mặc phương án thay thế →
            </button>
            <button
              type="button"
              onClick={() => {
                setFork(false);
                const culprit = DRAWERS.find((d) => worn.some((it) => d.slots.includes(it.slot) && it.accessory && bad.has(it.accessory)));
                setDrawer(culprit?.id ?? "style");
              }}
              className="rounded-full border border-stone-700 px-4 py-1.5 text-sm"
            >
              ← Tự sửa lại
            </button>
          </div>
        </Modal>
      )}

      {why && verdict && (
        <Modal label="Compass: vì sao?" onClose={() => setWhy(false)} bare>
          <CompassPanel result={verdict} sources={data.sources} />
        </Modal>
      )}

      {real && (
        <Modal label="Ảnh thật" onClose={() => setReal(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img src={asset(`/garments/${real}-preview.webp`)} alt={`Người mẫu mặc ${data.garments.find((g) => g.id === real)?.name_vi}`} className="mx-auto max-h-[70vh] rounded" />
          <p className="m-0 mt-2 text-center text-xs text-stone-500">Ảnh mẫu tạo bằng AI: người mẫu mặc bộ chuẩn, để con hình dung ngoài đời.</p>
        </Modal>
      )}

      {garment && <AboutSheet tab={sheet} onTab={setSheet} onClose={() => setSheet(null)} garment={garment} data={data} regionId={garment.region} />}

      {selection && (
        <CompareDrawer open={comparing} onClose={() => setComparing(false)}>
          <ComparePanel
            current={selection}
            data={data}
            onUse={(s) => {
              change({ ...current, colors: s.colors, mods: s.modifications, occasion: s.occasion_id });
              setComparing(false);
            }}
          />
        </CompareDrawer>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-lg bg-stone-900 px-4 py-3 text-sm text-amber-50 shadow-lg">
          <span>Đã lưu thẻ vào Du Ký ✓</span>
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

const EMPTY = { garments: [] } as unknown as Bootstrap;

function judge(c: NonNullable<Parameters<typeof evaluate>[0]>, sel: Selection): CompassResult | null {
  try {
    return evaluate(c, sel);
  } catch {
    return null; // a look the garment does not offer (e.g. an old look remembered on this device)
  }
}

// "Bà chọn giúp" only: chance runs in a click, never while rendering
const chance = (p: number) => Math.random() < p;
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** The two cloths of the look: picked colours first, then the garment's own. */
function colorsOf(data: Bootstrap, g: Garment | null, picked: string[]): [string, string] {
  const ids = [...picked, ...(g?.default_colors ?? []).filter((c) => !picked.includes(c))];
  const hex = (id?: string) => (id ? data.colors[id]?.hex : undefined);
  return [hex(ids[0]) ?? "#7ec8e3", hex(ids[1]) ?? "#fafafa"];
}

/** The saved card shrinks and flies into the "Du Ký của tôi" link; the link bounces when it lands. */
async function flyToDuKy(from: HTMLElement, png: string) {
  const target = document.querySelector<HTMLElement>('.site-nav a[href$="/du-ky"]');
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const ghost = document.createElement("img");
  ghost.src = png;
  ghost.alt = "";
  Object.assign(ghost.style, { position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, zIndex: "80", borderRadius: "6px", boxShadow: "0 14px 30px rgba(0,0,0,.45)", pointerEvents: "none" });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  await ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.2 - 60}px) scale(0.5) rotate(-6deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(-12deg)`, opacity: 0.6 },
    ],
    { duration: 700, easing: "cubic-bezier(.5,0,.3,1)" },
  ).finished;
  ghost.remove();
  target.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });
}

function Modal({ label, onClose, children, bare = false }: { label: string; onClose: () => void; children: ReactNode; bare?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#140c07]/55 p-4" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className={`w-full max-w-lg ${bare ? "" : "paper rounded-xl p-5 shadow-2xl"}`} onClick={(e) => e.stopPropagation()}>
        {children}
        <button type="button" onClick={onClose} className="mx-auto mt-3 block rounded-full bg-amber-50 px-4 py-1.5 text-sm">
          Đóng
        </button>
      </div>
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
