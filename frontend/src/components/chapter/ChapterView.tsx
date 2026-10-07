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
import { cited } from "@/lib/sources";
import { track } from "@/lib/track";
import type { Bootstrap, CompassResult, CompassState, Garment, Selection, WardrobeItem, WardrobeSlot } from "@/lib/types";
import { firstLook, garmentOf, lookOf, onBody, pieceState, selectionOf, toggled, type Look, type PieceState } from "@/lib/wardrobe";
import { useBootstrap } from "@/lib/useBootstrap";
import { ComparePanel } from "./ComparePanel";
import { LockedRoom } from "./LockedRoom";
import { RoomShell, roomStyle, WARDROBE_KEY } from "./RoomShell";
import { CompassPanel, STATE } from "./CompassPanel";
import { Fork } from "./CompassStep";
import { WeatherNote } from "./WeatherNote";
import { cardPicture, dollImage } from "../fitting/cardImage";
import { Mirror } from "../fitting/Mirror";
import { DRAWN, PaperDoll, type Dress } from "../fitting/PaperDoll";
import { AboutSheet, EventPicker, FULL_ONLY, type SheetTab } from "../fitting/Parts";
import { useTryOn } from "../fitting/useTryOn";
import { AI_LABEL, baNote, DRAWERS, LookCard, OutfitList, STAMP, WardrobePanel, WhoPicker, type CardFace, type Drawer, type Who } from "../fitting/Wardrobe";
import { friendlyError } from "@/lib/errors";
import { useDialog } from "@/lib/useDialog";
import { lowerFirst } from "@/lib/text";

const KEY = WARDROBE_KEY;
const COUNT = "vpdk-card-count";
// the label a saved card carries, as backend/app/models.py LABELS (⛔ never reaches a card)
const LABEL: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };
/** The look a card is made from, fixed when "Xong rồi" / "Dựng ảnh" is pressed, so the card always matches its picture. */
type Snap = { selection: Selection; look: Look; verdict: CompassResult };

/** A traditional piece Tèo has not found a firm source for yet ("Tèo đang kiểm tra"). */
const checking = (a: Bootstrap["accessories"][string] | undefined) => a?.verified === false && a.kind === "traditional-vn";

function remembered(): { who: Who | null; look: Look | null } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return { who: v?.who ?? null, look: v?.look ?? null };
  } catch {
    return { who: null, look: null };
  }
}
function remember(who: Who | null, look: Look | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ who, look }));
  } catch {
    // private mode: the look lasts for this visit
  }
}

// shellPlace and locked: known when the page is built, so the room's frame shows while the content loads (RoomShell, #120)
export function ChapterView({ regionId, garmentId, shellPlace, locked }: { regionId: string; garmentId?: string; shellPlace?: string; locked?: boolean }) {
  const { data, error } = useBootstrap();
  const params = useSearchParams();
  // "Con" needs the server: a static build puts a reader who chose it last time back on the paper doll (#48)
  const [who, setWho] = useState<Who | null>(() => (typeof window === "undefined" ? null : remembered().who === "con" && !HAS_API ? "nu" : remembered().who));
  const [askWho, setAskWho] = useState(false);
  const [look, setLook] = useState<Look | null>(null);
  const [history, setHistory] = useState<Look[]>([]);
  const [drawer, setDrawer] = useState<Drawer>("set");
  const [event, setEvent] = useState(() => ({ asked: params.get("entry") !== "event" }));
  const [card, setCard] = useState<(CardFace & { snap: Snap }) | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sent, setSent] = useState<Snap | null>(null); // "Con": the look sent to the try-on
  const [fork, setFork] = useState(false);
  const [why, setWhy] = useState(false);
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [comparing, setComparing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null); // "Xem ảnh mẫu" of a garment: an AI picture, labelled so (#60)
  const [toast, setToast] = useState(false);
  // why a piece cannot be worn, after a tap on it: shown under that piece until closed or another tap (#116)
  const [hint, setHint] = useState<{ id: string; text: string } | null>(null);
  const [pulse, setPulse] = useState(0); // the Compass tag swings on every change
  const doll = useRef<SVGSVGElement>(null); // a still copy of the doll, the source of the card's picture
  const tryon = useTryOn();

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

  // the first look: the diary's "Mặc thử" garment, else last visit's look if it belongs to this region (lib/wardrobe)
  const wanted = garmentId ?? params.get("garment") ?? undefined;
  const start = useMemo(() => (data ? firstLook(data, items, byId, regionId, wanted, typeof window === "undefined" ? null : remembered().look) : null), [data, items, byId, regionId, wanted]);
  const current = look ?? start;
  const garment = data && current ? garmentOf(data, current, byId) : null;
  const selection = data && current ? selectionOf(data, current, byId) : null;
  // the Compass is a few lookups: judging on every render costs less than keeping it in sync
  const verdict: CompassResult | null = compass && selection ? judge(compass, selection) : null;
  const bad = new Set(verdict?.triggers.filter((t) => t.state === "distorted").map((t) => t.target) ?? []);
  // while the card is open or the reader's photo is being sewn, the look stays as it is (the card must match it)
  const frozen = !!card || tryon.busy;

  // anonymous Impact events, as the server Compass sent them: the verdict, the occasion picked, a flagged look fixed
  const lastPick = useRef("");
  const flagged = useRef<Record<string, "review" | "distorted">>({});
  const judged = verdict && selection ? JSON.stringify([selection, verdict.state]) : "";
  useEffect(() => {
    if (!judged) return;
    const [sel, state] = JSON.parse(judged) as [Selection, CompassState];
    track("compass_result", { state, garment_id: sel.garment_id, occasion_id: sel.occasion_id });
    const pick = `${sel.garment_id}/${sel.occasion_id}`;
    if (pick !== lastPick.current) {
      lastPick.current = pick;
      const r = compass ? judge(compass, sel) : null;
      track("occasion_selected", { garment_id: sel.garment_id, occasion_id: sel.occasion_id, fits: !r?.triggers.some((t) => t.type === "occasion") });
    }
    const was = flagged.current[sel.garment_id];
    if (state === "review" || state === "distorted") flagged.current[sel.garment_id] = state;
    else if (was) {
      track("look_fixed", { from_state: was, to_state: state, garment_id: sel.garment_id });
      delete flagged.current[sel.garment_id];
    }
  }, [judged, compass]);

  /** Every change of the look goes through here: kept for "Hoàn tác", remembered on this device, the tag swings. */
  function change(next: Look) {
    if (!current || frozen) return;
    setHistory((h) => [...h.slice(-19), current]);
    show(next);
  }
  function undo() {
    const prev = history[history.length - 1];
    if (!prev || frozen) return;
    setHistory((h) => h.slice(0, -1));
    show(prev);
  }
  /** Put a look on the doll: the old AI picture no longer shows it, and the next visit opens on it. */
  function show(next: Look) {
    setLook(next);
    setPulse((n) => n + 1);
    tryon.clear();
    remember(who, next);
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
    // the first time, nothing opened the dialog to go back to: the focus goes to the open drawer of the wardrobe (#109)
    if (!who) requestAnimationFrame(() => document.querySelector<HTMLElement>('.wardrobe [role="tab"][aria-selected="true"]')?.focus({ preventScroll: true }));
    setWho(w);
    setAskWho(false);
    // the boy cannot keep on what is drawn only for the girl (#77)
    const next = current && data ? onBody(current, w, items, data, byId) : current;
    if (next && next !== current && JSON.stringify(next) !== JSON.stringify(current)) change(next);
    // picked before the content arrived: keep the look saved last time
    remember(w, next ?? remembered().look);
  }

  const stateOf = (it: WardrobeItem): PieceState =>
    current && data ? pieceState(it, current, garment, data, { body: who ?? "nu", drawable: (x) => DRAWN.has(x.art) || !!x.layers[who ?? "nu"], bad }) : "plain";
  function noteOf(it: WardrobeItem): string {
    if (!data) return "";
    const st = stateOf(it);
    if (st === "lock") return who === "nam" ? "chưa có dáng nam" : "chưa vẽ";
    if (st === "worn") return "đang mặc";
    if (st === "bad") return "gây sai lệch";
    if (st === "off") return garment ? `không đi với ${lowerFirst(garment.name_vi)}` : "chọn bộ áo trước";
    if (it.garment) {
      if (st === "dim") return "chưa hợp dịp này";
      const g = data.garments.find((x) => x.id === it.garment)!;
      return g.origin ?? data.regions.find((r) => r.id === g.region)?.name.split("/")[0].trim() ?? "";
    }
    const a = data.accessories[it.accessory!];
    if (a.verified === false && a.kind === "traditional-vn") return "Tèo đang kiểm tra";
    return ({ "traditional-vn": "Việt", modern: "hiện đại", "traditional-foreign": "nước khác", restricted: "lễ nghi" } as Record<string, string>)[a.kind] ?? "";
  }
  /** The short label in a sentence (#62): shown as the piece's tooltip and when a piece that cannot be worn is tapped. */
  function whyOf(it: WardrobeItem): string {
    if (!data) return "";
    const st = stateOf(it);
    const name = it.garment ? data.garments.find((g) => g.id === it.garment)?.name_vi : data.accessories[it.accessory!]?.name_vi;
    if (st === "lock") return who === "nam" ? `${name}: Bà chưa vẽ dáng nam cho món này.` : `${name}: Bà chưa vẽ món này lên búp bê.`;
    if (st === "off")
      return garment
        ? `Bà chưa thấy ${name} đi cùng ${garment.name_vi} trong các nguồn đã tra, nên tủ chưa cho mặc chung. Con chọn bộ áo khác thì thử được.`
        : "Con chọn một bộ áo trước nhé.";
    if (st === "dim") return `${name} thường không mặc cho dịp này. Mặc vẫn được, Tèo sẽ chấm và nói vì sao.`;
    const a = it.accessory ? data.accessories[it.accessory] : null;
    if (a && a.verified === false && a.kind === "traditional-vn") return `Tèo đang kiểm tra: Bà chưa tìm được nguồn thật chắc cho ${name}. Mặc thử vẫn được.`;
    return noteOf(it);
  }

  /** Wear or take off one piece; a piece the garment does not offer cannot be worn at all (lib/wardrobe). */
  function toggle(it: WardrobeItem) {
    if (!current || !data || frozen) return;
    const next = toggled(current, it, stateOf(it), data, byId);
    if (!next) {
      setHint({ id: it.id, text: whyOf(it) });
      return;
    }
    setHint(null);
    if (next.worn[it.slot] === it.id) track("wardrobe_wear", { item_id: it.id, body: who ?? "nu" });
    change(next);
  }

  /** 🎲 Bà chọn giúp: a garment for the occasion and a few Vietnamese pieces, always ✅ or ✨. */
  function surprise() {
    if (!current || !data || !compass || frozen) return;
    const fits = items.filter((it) => it.slot === "set" && stateOf(it) !== "lock" && data.garments.find((g) => g.id === it.garment)?.occasions.includes(current.occasion));
    // this room's own region first: in Nam Bộ Bà reaches for the áo bà ba, not the áo tứ thân (#62)
    const here = fits.filter((it) => data.garments.find((g) => g.id === it.garment)?.region === regionId);
    const sets = here.length ? here : fits;
    for (let n = 0; n < 40 && sets.length; n++) {
      const s = pick(sets);
      const g = data.garments.find((x) => x.id === s.garment)!;
      const worn: Look["worn"] = { set: s.id };
      for (const slot of ["head", "feet", "hand"] as WardrobeSlot[]) {
        const fit = items.filter((it) => it.slot === slot && it.accessory && g.accessories.includes(it.accessory) && data.accessories[it.accessory].kind === "traditional-vn");
        if (fit.length && chance(0.8)) worn[slot] = pick(fit).id;
      }
      const next: Look = { worn, colors: chance(0.6) ? [pick(g.colors)] : [], mods: [], occasion: current.occasion };
      const v = judge(compass, selectionOf(data, next, byId)!);
      if (v && (v.state === "fit" || v.state === "adapted")) return change(next);
    }
  }

  /** ⛔ "Mặc theo gợi ý của Tèo": the Compass's swapped look, back on the doll. */
  function wearAlternative() {
    if (!data || !verdict?.alternative) return;
    change(lookOf(verdict.alternative, items, data, byId));
    setFork(false);
  }

  function openCard(image: string, isAI: boolean, snap: Snap) {
    if (!data) return;
    const g = data.garments.find((x) => x.id === snap.selection.garment_id)!;
    let n = 1;
    try {
      n = Number(localStorage.getItem(COUNT) ?? "0") + 1;
    } catch {
      // private mode: every card is number 1
    }
    // the try-on may have rendered the Compass's alternative: the card carries the verdict of what is in the picture
    const alt = isAI && tryon.result?.rendered_alternative ? tryon.result : null;
    const state = alt ? (alt.compass.alternative_state ?? snap.verdict.state) : snap.verdict.state;
    const shown = alt?.rendered_selection ?? snap.selection;
    setCard({
      snap,
      image,
      isAI,
      checking: data.garments.find((x) => x.id === shown.garment_id)?.verified === false || shown.accessories.some((a) => checking(data.accessories[a])),
      state,
      number: n,
      title: `${g.name_vi} · ${data.occasions.find((o) => o.id === snap.selection.occasion_id)?.name.split("/")[0].trim()}`,
      place: data.regions.find((r) => r.id === g.region)?.name.split("/")[0].trim() ?? "",
      date: new Date().toLocaleDateString("vi-VN"),
      note: baNote(data, g, snap.selection, snap.verdict),
      fact: (() => {
        const f = g.facts.find((x) => cited(data, x.sources).length > 0);
        return f ? { text: f.text, source: cited(data, f.sources)[0].title } : null;
      })(),
      items: [g.name_vi, ...snap.selection.accessories.map((a) => data.accessories[a]?.name_vi ?? a)],
    });
    setSaving("idle");
    setSaveError(null);
  }

  /** "Xong rồi": the card drops. With "Con", the look is first put on the reader's photo. */
  async function finish() {
    if (!data || !current || !selection || !verdict || frozen) return;
    if (verdict.state === "distorted") return setFork(true);
    const snap: Snap = { selection, look: current, verdict };
    if (who === "con") {
      if (!tryon.photo) return pickPhoto();
      setSent(snap);
      await tryon.run(selection);
      return;
    }
    if (doll.current) openCard(dollImage(doll.current), false, snap);
  }
  const pickPhoto = () => document.getElementById("con-photo")?.click();
  // the reader's own photo came back from the try-on: its card drops, made from the look that was sent. The server's
  // sample is not the reader: no card, no stamp, nothing to save; the mirror says why (#52)
  const [shownFor, setShownFor] = useState<string | null>(null);
  if (who === "con" && sent && tryon.image && !tryon.isSample && !tryon.busy && tryon.result && shownFor !== tryon.image) {
    setShownFor(tryon.image);
    openCard(tryon.image, true, sent);
  }

  /** The card as one picture: frame, title, place and date, the Compass stamp. */
  function cardPng(c: NonNullable<typeof card>) {
    const stamp = STAMP[c.state];
    return cardPicture({ art: c.image, title: c.title, meta: `${c.place} · ${c.date}`, number: c.number, stamp: stamp.word, icon: stamp.icon, light: c.checking, aiLabel: c.isAI ? AI_LABEL : null });
  }

  /** "Tải thẻ": the framed card, not the bare doll (#62). */
  async function download() {
    if (!card) return;
    try {
      const a = document.createElement("a");
      a.href = await cardPng(card);
      a.download = `the-viet-phuc-${card.number}.png`;
      a.click();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Chưa tải được thẻ, con thử lại nhé.");
    }
  }

  /** Save the card into the Du Ký. "Đã lưu" only once it really is; a picture that cannot be drawn says so. */
  async function save(cardEl: HTMLElement) {
    if (!card || !data || saving !== "idle") return;
    setSaving("saving");
    setSaveError(null);
    try {
      const { selection: sel } = card.snap;
      const g = data.garments.find((x) => x.id === sel.garment_id)!;
      const png = await cardPng(card);
      await ensureMigrated(data.garments);
      const page = addPage(newPage({ region_id: g.region, garment_id: g.id, occasion_id: sel.occasion_id, look: sel, compass_label: LABEL[card.state], compass_state: card.state }));
      await addPhoto(page.id, await dataUrlToBlob(png), card.isAI ? "ai" : "card");
      try {
        localStorage.setItem(COUNT, String(card.number));
      } catch {
        // private mode
      }
      track("duky_save", { kind: card.isAI ? "ai" : "card", garment_id: g.id });
      setSaving("saved");
      await flyToDuKy(cardEl, png);
      setCard(null);
      setToast(true);
    } catch (e) {
      setSaving("idle");
      setSaveError(friendlyError(e, "Chưa lưu được thẻ, con thử lại nhé."));
    }
  }

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  // "Ai mặc?" needs nothing from bootstrap.json: on a first visit it opens over the room's frame as soon as the page runs,
  // instead of after the content has come down too (#120). Same tree as the room below, so it is not opened twice.
  const askingWho = askWho || (!who && event.asked);
  if (!data || !current)
    return (
      <>
        <RoomShell regionId={regionId} place={shellPlace} locked={locked} />
        {/* initial={false}: the static HTML already shows this box (RoomShell `ask`), so it does not fade in again */}
        <AnimatePresence initial={false}>{askingWho && !locked && <WhoPicker key="who" value={who} onPick={pickWho} onClose={who ? () => setAskWho(false) : undefined} />}</AnimatePresence>
      </>
    );
  if (!region)
    return (
      <p className="p-8">
        Không có vùng này.{" "}
        <Link href="/" className="underline">
          Về bản đồ
        </Link>
      </p>
    );
  if (region.status === "locked") return <LockedRoom region={region} data={data} />;

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
        ? tryon.busy
          ? { label: tryon.stageLabel ?? "Đang may…", off: true }
          : tryon.countdown
            ? { label: tryon.countdown, off: true } // after a 429: wait, or the limiter starts over
            : { label: tryon.photo ? "Dựng ảnh của con ›" : "📷 Chọn ảnh của con", off: tryon.locked }
        : { label: "Xong rồi ›", off: !verdict };

  return (
    <>
      <main
        className="fitting"
        style={roomStyle()}
      >
        <header className="fitting-head">
          {/* back to the Mặc page this room was opened from (DeskScene reopens the book there); Link adds the base path */}
          {/* on a phone the words give their room to the garment's name (#57) */}
          <Link href={`/?region=${garment?.region ?? regionId}&page=wear`} className="page-turn shrink-0 !text-[0.95rem]" aria-label="Về trang Mặc">
            ‹ <span className="hidden sm:inline">Về trang Mặc</span>
          </Link>
          <div className="min-w-0 text-center">
            {/* the place stays whole: on a 390px phone "BỘ" of "TRUNG BỘ" went to a line of its own (#119) */}
            <p className="m-0 text-[0.75rem] uppercase tracking-[0.18em] text-amber-100/80 sm:tracking-[0.3em]">
              Tủ áo của Bà <span className="whitespace-nowrap">· {place}</span>
            </p>
            <h1 className="font-hand m-0 truncate text-[1.7rem] leading-tight text-amber-50">{garment?.name_vi ?? "Chọn một bộ áo"}</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setSheet("story")} disabled={!garment} className="page-turn !text-[0.95rem]" aria-label="Hiểu bộ áo">
              📖 <span className="hidden sm:inline">Hiểu bộ áo</span>
            </button>
            {/* without a server: still there, faded, and it opens the sheet that says why (#116) */}
            <button
              type="button"
              onClick={() => setSheet(HAS_API ? "teo" : "story")}
              disabled={!garment}
              className={`page-turn !text-[0.95rem] ${HAS_API ? "" : "opacity-60"}`}
              title={HAS_API ? "Hỏi Tèo" : `Hỏi Tèo · ${FULL_ONLY}`}
              aria-label={HAS_API ? "Hỏi Tèo" : "Hỏi Tèo, có ở bản đầy đủ"}
            >
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
            whyOf={whyOf}
            onToggle={toggle}
            why={hint}
            onWhyClose={() => setHint(null)}
            garment={garment}
            selection={selection}
            onSelection={(s) => change({ ...current, colors: s.colors, mods: s.modifications })}
            occasion={current.occasion}
            open={drawer}
            onOpen={setDrawer}
            onLookPreview={setPreview}
          />

          <div className="fitting-stage">
            <p className="rotate-hint">📱 Xoay dọc máy để thấy cả búp bê và tủ áo nhé.</p>
            {garment && (
              <div className="fitting-weather empty:hidden">
                <WeatherNote regionId={garment.region} garmentId={garment.id} place={place} />
              </div>
            )}
            <button type="button" onClick={() => setAskWho(true)} className="who-switch">
              👤 {who === "con" ? "Con" : who === "nam" ? "Nam" : "Nữ"} ▾
            </button>
            {who === "con" && garment ? (
              <Mirror key={garment.id} garmentId={garment.id} garmentName={garment.name_vi} verdict={verdict} scoring={false} offline={!compass} tryon={tryon} onTag={() => verdict && setWhy(true)} onPick={pickPhoto} />
            ) : (
              <figure className="m-0 flex flex-col items-center">
                <div className="mirror-frame dress-form">
                  <div className="mirror-glass relative h-full w-full overflow-hidden">
                    <PaperDoll
                      body={who === "nam" ? "nam" : "nu"}
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
                    // no aria-label: the printed "Tèo chấm ✅ Phù hợp vì sao?" is the name, verdict included; the old label
                    // "Compass: vì sao?" hid the verdict from a screen reader (#58)
                    initial={{ rotate: 12 }}
                    animate={{ rotate: [12, -3, 2, 6] }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="mirror-tag-hole" aria-hidden />
                    <span className="block text-[0.75rem] uppercase tracking-[0.18em] opacity-70">Tèo chấm</span>
                    <span className="block text-sm font-semibold leading-tight">{tag ? `${tag.icon} ${tag.name}` : garment ? "chưa chấm được" : "chưa mặc gì"}</span>
                    {tag && <span className="block text-[0.75rem] underline opacity-70">vì sao?</span>}
                  </motion.button>
                </div>
                <figcaption className="mirror-caption">Bấm một món trong tủ để mặc, bấm lần nữa để cởi</figcaption>
                <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
                  <PaperDoll ref={doll} still body={who === "nam" ? "nam" : "nu"} dress={dress} colors={{ main: c1, second: c2, yem: yem === "yem-dao" ? "#f4a6a0" : yem === "yem-trang" ? "#fafafa" : undefined }} />
                </div>
              </figure>
            )}
          </div>

          <OutfitList data={data} worn={worn} bad={bad} occasion={current.occasion} onOccasion={(o) => change({ ...current, occasion: o })} onTakeOff={toggle} />
        </div>

        <div className="fitting-bar">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={undo} disabled={!history.length || frozen} className="page-turn !text-[0.95rem]" aria-label="Hoàn tác">
              ↶ <span className="hidden sm:inline">Hoàn tác</span>
            </button>
            <button type="button" onClick={surprise} disabled={frozen} className="page-turn !text-[0.95rem]" aria-label="Bà chọn giúp">
              🎲 <span className="hidden sm:inline">Bà chọn giúp</span>
            </button>
          </div>
          <div className="flex justify-center">
            <button type="button" disabled={main.off} onClick={finish} className="page-turn page-turn-main !px-7">
              {main.label}
            </button>
            <input
              id="con-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Ảnh của con để thử đồ"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ""; // so picking the same file again (after "Bỏ ảnh") still counts
                if (f) void tryon.choosePhoto(f);
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-3 text-sm text-amber-50">
            {HAS_API && garment && (
              <button type="button" onClick={() => setComparing(true)} className="underline">
                Ghim để so sánh
              </button>
            )}
            {HAS_API && garment && (
              <button type="button" onClick={() => setSheet("shops")} className="underline">
                Thuê / may ở đâu
              </button>
            )}
            {!HAS_API && garment && <span className="text-amber-50/75">Ghim so sánh, chỗ thuê / may: có ở bản đầy đủ</span>}
          </div>
        </div>


        {fork && verdict && selection && (
          <Modal label="Cách sửa bộ phối ⛔" onClose={() => setFork(false)}>
            <Fork data={data} selection={selection} verdict={verdict} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={wearAlternative} className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
                Mặc theo gợi ý của Tèo →
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
          <Modal label="Tèo chấm: vì sao?" onClose={() => setWhy(false)} bare>
            <CompassPanel result={verdict} sources={data.sources} garment={garment} />
          </Modal>
        )}

        {preview && (
          <Modal label="Ảnh mẫu (AI)" onClose={() => setPreview(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
            <img src={asset(`/garments/${preview}-preview.webp`)} alt={`Người mẫu mặc ${data.garments.find((g) => g.id === preview)?.name_vi}`} className="mx-auto max-h-[70vh] rounded" />
            <p className="m-0 mt-2 text-center text-xs text-stone-600">Ảnh mẫu tạo bằng AI: người mẫu mặc bộ chuẩn, để con hình dung ngoài đời.</p>
          </Modal>
        )}

        {garment && <AboutSheet tab={sheet} onTab={setSheet} onClose={() => setSheet(null)} garment={garment} data={data} regionId={garment.region} />}

        {selection && (
          <CompareDrawer open={comparing} onClose={() => setComparing(false)}>
            <ComparePanel
              current={selection}
              data={data}
              onUse={(s) => {
                change(lookOf(s, items, data, byId));
                setComparing(false);
              }}
            />
          </CompareDrawer>
        )}

        {toast && (
          // at the top: down by the bar it covered the doll's feet; the ✕ keeps its corner however the words wrap (#62)
          <div role="status" className="fixed inset-x-4 top-16 z-50 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-lg bg-stone-900 py-3 pl-4 pr-10 text-sm text-amber-50 shadow-lg">
            <span>Đã lưu thẻ vào Du Ký ✓</span>
            {HAS_API && (
              <button type="button" onClick={() => setSheet("quiz-post")} className="underline">
                Thử lại: Việt hay không?
              </button>
            )}
            <a href={asset("/du-ky")} className="ml-auto font-semibold text-amber-200 underline">
              Mở Du Ký
            </a>
            <button type="button" aria-label="Đóng" onClick={() => setToast(false)} className="absolute right-3 top-2.5 text-amber-50/70">
              ✕
            </button>
          </div>
        )}
      </main>
        {/* outside <main>: the same place while loading, so "Ai mặc?" can open before bootstrap.json arrives and stays put
            when the room fills in under it (#120) */}
        <AnimatePresence>
          {askingWho && <WhoPicker key="who" value={who} onPick={pickWho} onClose={who ? () => setAskWho(false) : undefined} />}
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
              saving={saving}
              error={saveError}
              onSave={save}
              onDownload={download}
              onClose={() => setCard(null)}
              onRedo={
                card.isAI
                  ? () => {
                      const snap = card.snap;
                      setCard(null);
                      setSent(snap);
                      void tryon.run(snap.selection);
                    }
                  : undefined
              }
            />
          )}
        </AnimatePresence>
    </>
  );
}


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

/** The saved card shrinks and flies into the "Du Ký của con" link; the link bounces when it lands. */
async function flyToDuKy(from: HTMLElement, png: string) {
  // GitHub Pages builds with trailingSlash, so the link ends in "/du-ky/" there
  const target = document.querySelector<HTMLElement>('.site-nav a[href$="/du-ky"], .site-nav a[href$="/du-ky/"]');
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
  const box = useDialog<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#140c07]/55 p-4" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      {/* never taller than the screen, and on paper the button is the paper's own (navy), not a cream pill hanging off
          its lower edge (#116) */}
      <div ref={box} className={`max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto ${bare ? "" : "paper rounded-xl p-5 shadow-2xl"}`} onClick={(e) => e.stopPropagation()}>
        {children}
        <button type="button" onClick={onClose} className={`mx-auto mt-4 block rounded-full px-5 py-1.5 text-sm ${bare ? "bg-amber-50 text-[#27354f]" : "bg-[#27354f] text-amber-50"}`}>
          Đóng
        </button>
      </div>
    </div>
  );
}

/** Side drawer (bottom sheet on phones) for "Ghim để so sánh": pinned looks side by side. */
function CompareDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const box = useDialog<HTMLDivElement>(onClose, open);
  // hidden, it is not a dialog at all: a second "Đóng" and an aria-modal box were always in the page (#58)
  return (
    <div ref={box} className={open ? "fixed inset-0 z-40" : "hidden"} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Ghim để so sánh" hidden={!open}>
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-stone-900/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-[var(--paper)] p-4 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[34rem] sm:rounded-none sm:rounded-l-xl">
        <div className="mb-2 flex items-center">
          <p className="m-0 font-semibold">Ghim để so sánh</p>
          <button type="button" onClick={onClose} className="ml-auto text-sm underline">
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
