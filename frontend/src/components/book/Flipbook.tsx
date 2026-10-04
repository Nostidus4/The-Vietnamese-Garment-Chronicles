"use client";

import HTMLFlipBook from "react-pageflip";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { markStamp } from "@/lib/stamps";
import type { Bootstrap, Region } from "@/lib/types";
import { ChapterEnd, ChapterTitle, LEAVE_CHAPTER, StopGame, EnvelopeLetter, FestivalBoard, RegionIntro, StopDiary, StopToday } from "./Chapter";
import {
  ArriveDiary,
  AskDiary,
  BlankPage,
  Bookmarks,
  DRAFT,
  FestivalDiary,
  hasChapter,
  HoverPage,
  LifeDiary,
  LookDiary,
  OwnDiary,
  place,
  preAsked,
  PreQuestion,
  WearDiary,
  type Tab,
} from "./Diary";
import { LetterPage, StartPage, TocPage } from "./FrontMatter";
import { GlossaryProvider } from "./Glossary";
import { Page } from "./Page";
import { CHAPTERS, VietnamMap } from "./VietnamMap";
import { TeoGuide } from "./TeoGuide";
import { ThreadNav, type Step } from "./ThreadNav";
import { useStamps } from "@/lib/stamps";

// Page layout: 0 Bà's letter · 1 table of contents · 2 map · 3 right of the map (welcome / region / chapter title)
// · 4… the chapter. page-flip keeps the DOM nodes it was given, so the page count is fixed at the longest chapter.
const MAP = 2;
const FIRST = 4;
const TINTS = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.tint]));
// where a first-time reader begins: the fullest chapter (→ on the map spread, and the button under the regions)
const SUGGEST = { id: "hue", label: "Huế" };

// where the reader is, kept across a rebuild of the book (a new size means a new page-flip instance)
const memo = { focus: null as string | null, reading: false, page: 0 };
// the furthest stop reached in each trip chapter, for the route on its title page
const reachedOf: Record<string, number> = {};

export type Resume = { region: string; page: "own" | "wear" } | null;

type Built = { tabs: Tab[]; steps: Step[]; pages: { node: ReactNode; still?: boolean }[] };

/** The pages of a region's chapter, from page FIRST on. Trip chapters: each stop is a spread (Bà | Hôm nay). */
function buildChapter(region: Region, data: Bootstrap, h: { tryOn: (g: string) => void }): Built {
  const j = region.journey!;
  const tabs: Tab[] = [];
  const steps: Step[] = []; // the knots on Bà's thread under the book (trip chapters)
  const pages: Built["pages"] = [];
  const at = () => FIRST + pages.length;
  const chapterPlace = place(region);
  if (j.stops.length) {
    tabs.push({ label: "Lộ trình", page: MAP + 1 });
    steps.push({ label: "Lộ trình", page: MAP + 1, kind: "title" });
    j.stops.forEach((st, i) => {
      if (i === 0) tabs.push({ label: `Đi ${chapterPlace}`, page: at() });
      if (st.festivals.length) tabs.push({ label: "Lễ hội", page: at() });
      const game = !!st.game && (hasChapter(region) || !st.game.community_review || DRAFT);
      steps.push({ label: st.place, page: at(), kind: "stop", game: game ? `${region.id}:${st.id}` : undefined });
      pages.push({ node: <StopDiary stop={st} index={i} data={data} chapterPlace={chapterPlace} regionId={region.id} />, still: !!st.hat });
      pages.push(
        game
          ? { node: <StopGame stop={st} regionId={region.id} data={data} />, still: true }
          : st.today
          ? { node: <StopToday stop={st} /> }
          : st.festivals.length
            ? { node: <FestivalBoard stop={st} chapterPlace={chapterPlace} />, still: true }
            : { node: <BlankPage /> },
      );
    });
  } else {
    tabs.push({ label: "Đến", page: MAP + 1 });
    tabs.push({ label: "Nhìn quanh", page: at() });
    pages.push({ node: <LookDiary region={region} data={data} /> });
    if (j.life) {
      tabs.push({ label: "Sống", page: at() });
      pages.push({ node: <LifeDiary region={region} data={data} /> });
    }
    if (j.festivals) pages.push({ node: <FestivalDiary region={region} data={data} />, still: true });
  }
  if (j.wear.length) {
    tabs.push({ label: "Mặc", page: at() });
    steps.push({ label: "Cách mặc", page: at(), kind: "wear" });
  }
  j.wear.forEach((_, i) => pages.push({ node: <WearDiary region={region} index={i} data={data} onTry={h.tryOn} /> }));
  if (j.check && (region.status === "open" || hasChapter(region))) {
    tabs.push({ label: "Bà hỏi", page: at() });
    steps.push({ label: "Bà hỏi con", page: at(), kind: "ask" });
    pages.push({ node: <AskDiary key={`ask-${region.id}`} region={region} />, still: true });
  }
  tabs.push({ label: region.status === "open" || hasChapter(region) ? "Trang của con" : "Trang để trống", page: at() });
  steps.push({ label: "Trang của con", page: at(), kind: "own" });
  pages.push({ node: <OwnDiary key={region.id} region={region} data={data} onTry={h.tryOn} />, still: true });
  if (j.letter) {
    if (at() % 2) pages.push({ node: <BlankPage /> }); // the envelope and "Hết chương" face each other as one spread
    tabs.push({ label: "Phong thư", page: at() });
    steps.push({ label: "Thư của Bà", page: at(), kind: "letter" });
    pages.push({ node: <EnvelopeLetter region={region} />, still: true });
    pages.push({ node: <ChapterEnd region={region} />, still: true });
  }
  return { tabs, steps: j.stops.length ? steps : [], pages };
}

/**
 * The inside of Bà's notebook. Only paper pages live here and they turn like paper (drag a corner, or the arrows).
 * The covers are not part of this flipbook: the desk opens and closes them with its own hard-cover swing.
 *
 * Bà's letter and the contents come first, then the map. Click a region → the map zooms into it and its page opens
 * (a verse, Bà's line, its chapters by province). Open a chapter → its pages follow; bookmarks jump between them.
 */
export default function Flipbook({
  data,
  width,
  height,
  portrait = false,
  active = true,
  resume = null,
  restore = false,
  onClose,
}: {
  data: Bootstrap;
  width: number;
  height: number;
  portrait?: boolean;
  active?: boolean; // false while hidden behind the desk copy: ignore the keyboard
  resume?: Resume; // come back from the try-on straight to a page of a region
  restore?: boolean; // rebuilt at a new size: reopen on the same region and page
  onClose?: () => void; // "Gấp sổ" on the first page: the desk swings the cover shut
}) {
  const router = useRouter();
  const regions = new Map(data.regions.map((r) => [r.id, r]));
  // hatched on the map: regions with nothing to read yet
  const locked = data.regions.filter((r) => r.status === "locked" && !hasChapter(r)).map((r) => r.id);

  // hover: the region under the pointer, with a short dwell so sweeping across the map does not flicker
  const [hovered, setHovered] = useState<string | null>(null);
  const dwell = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onHover = (id: string | null) => {
    clearTimeout(dwell.current);
    dwell.current = setTimeout(() => setHovered(id), id ? 120 : 300);
  };
  useEffect(() => () => clearTimeout(dwell.current), []);

  // the region the map is zoomed into, and whether its chapter is open; phones first show a preview card
  const [focus, setFocus] = useState<string | null>(restore ? memo.focus : (resume?.region ?? null));
  const [reading, setReading] = useState(restore ? memo.reading : !!resume);
  const [preview, setPreview] = useState<string | null>(null);
  const [hotProvince, setHotProvince] = useState<string | null>(null);
  const [, setPreDone] = useState(0);
  const region = focus ? regions.get(focus) : undefined;
  const j = region?.journey ?? null;
  const trip = !!j?.stops.length;

  const tryOn = (garment: string) => region && router.push(`/chapter/${region.id}?garment=${garment}`);
  const built: Built =
    region && j && reading ? buildChapter(region, data, { tryOn }) : { tabs: [], steps: [], pages: [] };
  const { tabs, steps, pages: content } = built;
  const { game: won } = useStamps();
  const used = FIRST + content.length;

  // enough pages for the longest chapter (page-flip cannot add pages later)
  const total = useMemo(() => {
    const longest = Math.max(
      0,
      ...data.regions.filter((r) => r.journey).map((r) => buildChapter(r, data, { tryOn: () => {} }).pages.length),
    );
    const n = FIRST + longest;
    return n + (n % 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fixed for the life of this book
  }, []);

  const [page, setPage] = useState(restore ? memo.page : 0);
  useEffect(() => {
    memo.focus = focus;
    memo.reading = reading;
    memo.page = page;
    if (focus && trip && page >= FIRST) {
      const first = Math.floor((page - FIRST) / 2);
      for (const i of portrait ? [first] : [first, Math.floor((page + 1 - FIRST) / 2)]) {
        const st = j!.stops[i];
        if (st?.stamp) markStamp("stop", `${focus}:${st.id}`);
      }
      const n = j!.stops.length;
      reachedOf[focus] = Math.max(reachedOf[focus] ?? 0, Math.min(n, Math.floor((page - FIRST) / 2) + (portrait ? 1 : 1)));
    }
  }, [focus, reading, page, trip, j, portrait]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pageflip ships no type for its instance
  const bookRef = useRef<any>(null);
  const perView = portrait ? 1 : 2;
  const reachable = focus && reading ? used + (portrait ? 0 : used % 2) : FIRST; // letter, contents, map, its right page
  const atEnd = page + perView >= reachable;
  const [fading, setFading] = useState(false);

  // page-flip cannot animate every jump (backward turns in single-page mode, far jumps): dip the page out and back
  const jump = (to: number, then?: () => void) => {
    const pf = bookRef.current?.pageFlip();
    setFading(true);
    setTimeout(() => {
      pf?.turnToPage(to);
      setPage(to);
      then?.();
      setFading(false);
    }, 180);
  };
  const turnTo = (to: number) => {
    const pf = bookRef.current?.pageFlip();
    if (!pf) return;
    const left = portrait ? to : to - (to % 2);
    if (left === page) return;
    if (!portrait && Math.abs(left - page) === 2) return left > page ? pf.flipNext("bottom") : pf.flipPrev("bottom");
    jump(left);
  };
  const go = (id: string, then?: () => void) => {
    setPreview(null);
    setHovered(null);
    setReading(false);
    setFocus(id);
    if (then) setTimeout(then, 1100); // after the map has zoomed in
  };
  const openRegion = (id: string) => (page === MAP ? go(id) : jump(MAP, () => go(id)));
  const leaveChapter = () => {
    setHotProvince(null);
    if (page === MAP || (portrait && page === MAP + 1)) return setReading(false);
    jump(MAP, () => setReading(false));
  };
  const toCountry = () => {
    setHotProvince(null);
    setReading(false);
    if (page === MAP || (portrait && page === MAP + 1)) return setFocus(null);
    jump(MAP, () => setFocus(null));
  };
  const prev = () => {
    if (page === 0) return onClose?.();
    if (focus && page === MAP) return reading ? leaveChapter() : toCountry();
    if (!portrait) return bookRef.current?.pageFlip()?.flipPrev("bottom");
    jump(page - 1);
  };
  const next = () => {
    if (!focus && (page === MAP || (portrait && page === MAP + 1))) return go(SUGGEST.id);
    if (!atEnd) bookRef.current?.pageFlip()?.flipNext("bottom");
  };

  // "Tôi sắp tham gia sự kiện": straight into Bà's fitting room, which first asks where the reader is going
  const toEvent = () => router.push(`/chapter/${SUGGEST.id}?entry=event`);

  // back from the try-on: open the region on its Mặc page or on "Trang của con"
  const resumed = useRef(false);
  useEffect(() => {
    if (!resume || resumed.current || !j || !reading) return;
    resumed.current = true;
    const tab = tabs.find((t) => t.label === (resume.page === "own" ? "Trang của con" : "Mặc"));
    if (tab) setTimeout(() => jump(portrait ? tab.page : tab.page - (tab.page % 2)), 1200);
  });

  // ← → turn pages, Esc steps back out (chapter → region → country); ignored while typing in a field
  const keys = useRef({ prev, next, active, toCountry, leaveChapter, focus, reading, atEnd });
  useEffect(() => {
    keys.current = { prev, next, active, toCountry, leaveChapter, focus, reading, atEnd };
  });

  // page-flip holds blank pages after the map and after a short chapter (its page count is fixed at the longest
  // chapter). The buttons and keys stop at the last page there is to read; a corner drag or a swipe would not, so
  // on the last readable spread a press on the forward half never reaches page-flip.
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const guard = (e: MouseEvent | TouchEvent) => {
      if (!keys.current.atEnd) return;
      const x = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      const r = el.getBoundingClientRect();
      if (x !== undefined && x > r.left + r.width / 2) e.stopPropagation();
    };
    el.addEventListener("mousedown", guard, true);
    el.addEventListener("touchstart", guard, { capture: true, passive: true });
    return () => {
      el.removeEventListener("mousedown", guard, true);
      el.removeEventListener("touchstart", guard, true);
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!keys.current.active) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") keys.current.next();
      if (e.key === "ArrowLeft") keys.current.prev();
      // Esc first closes an open note of Tèo; only the next Esc steps back out of the chapter
      if (e.key === "Escape" && document.querySelector("[data-anchored]")) return;
      if (e.key === "Escape" && keys.current.focus) (keys.current.reading ? keys.current.leaveChapter : keys.current.toCountry)();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // "‹ Về trang …" at the end of a chapter (ChapterEnd sends an event: its element is built outside the render tree)
  useEffect(() => {
    const on = () => keys.current.leaveChapter();
    window.addEventListener(LEAVE_CHAPTER, on);
    return () => window.removeEventListener(LEAVE_CHAPTER, on);
  }, []);

  const onSelect = (id: string) => (portrait && preview !== id ? setPreview(id) : go(id));
  const previewRegion = preview ? regions.get(preview) : undefined;

  // the right-hand page of the map spread
  const pre = j?.check?.pre;
  const asking = !!(region && trip && reading && pre && (pre.verified || DRAFT) && !preAsked(region.id));
  const rightKey = region ? `${reading ? (asking ? "pre" : "chapter") : "region"}-${region.id}` : "welcome";
  const right = region ? (
    !reading ? (
      <RegionIntro region={region} onOpen={() => setReading(true)} onProvinceHover={setHotProvince} />
    ) : trip ? (
      asking ? (
        <PreQuestion region={region} onDone={() => setPreDone((n) => n + 1)} />
      ) : (
        <ChapterTitle
          region={region}
          reached={reachedOf[region.id] ?? 0}
          onStop={(i) => turnTo(FIRST + i * 2)}
          onBack={leaveChapter}
        />
      )
    ) : (
      <ArriveDiary region={region} data={data} hotProvince={hotProvince} onProvinceHover={setHotProvince} />
    )
  ) : (
    // the start page stays put while the pointer moves over the map: the hovered region lights up in its list
    <StartPage
      data={data}
      tints={TINTS}
      hovered={hovered}
      onHover={onHover}
      onRegion={openRegion}
      onEvent={toEvent}
      suggest={SUGGEST}
    />
  );
  // the chapter's place as a single red dot while reading a trip chapter; Bà's marks otherwise
  const firstPoint = j?.stops.find((st) => st.point)?.point;
  const landmarks =
    trip && firstPoint && j?.chapter
      ? [{ name: j.chapter.province, lon: firstPoint.lon, lat: firstPoint.lat, note: j.chapter.title }]
      : j?.arrive?.landmarks;

  return (
    <GlossaryProvider data={data} draft={DRAFT}>
      <div ref={shell} className={`relative transition-opacity duration-200 ${fading ? "opacity-0" : ""}`}>
        <HTMLFlipBook
          ref={bookRef}
          width={width}
          height={height}
          size="fixed"
          minWidth={width}
          maxWidth={width}
          minHeight={height}
          maxHeight={height}
          startPage={restore ? memo.page : 0}
          drawShadow
          flippingTime={900}
          usePortrait={portrait} // phones: one page at a time
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.35}
          showCover={false}
          mobileScrollSupport
          clickEventForward
          useMouseEvents // paper pages curl and turn by dragging a corner…
          swipeDistance={30}
          showPageCorners
          disableFlipByClick // …but a plain click never turns a page
          onFlip={(e: { data: number }) => {
            // a turn that still slipped past the last page to read: back to it
            const last = Math.max(0, reachable - perView);
            if (e.data > last) return jump(portrait ? last : last - (last % 2));
            setPage(e.data);
          }}
          className="book-open book-pages select-none"
          style={{}}
        >
          <Page className="flex flex-col p-[8%]">
            <LetterPage />
          </Page>
          <Page className="flex flex-col p-[8%]">
            <TocPage data={data} onRegion={openRegion} onStart={() => openRegion(SUGGEST.id)} suggest={SUGGEST.label} />
          </Page>

          <Page className="relative p-4">
            <NoPageTurn>
              <VietnamMap
                ink="static"
                active={hovered}
                locked={locked}
                onHover={onHover}
                onSelect={onSelect}
                focus={focus}
                landmarks={landmarks}
                hotProvince={hotProvince}
                onProvinceHover={setHotProvince}
                onBack={reading ? leaveChapter : toCountry}
              />
              {/* phones: Bà's line slides up over the map, with the way in */}
              <AnimatePresence>
                {portrait && previewRegion && !focus && (
                  <motion.div
                    key={previewRegion.id}
                    className="paper absolute inset-x-2 bottom-2 rounded-md p-4 shadow-[0_-6px_18px_rgba(60,35,10,0.25)]"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-2 text-lg text-stone-500"
                      onClick={() => setPreview(null)}
                      aria-label="Đóng"
                    >
                      ×
                    </button>
                    <HoverPage region={previewRegion} onGo={() => go(previewRegion.id)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </NoPageTurn>
          </Page>

          <Page className="h-full">
            <MaybeNoTurn block={!focus || !reading || asking}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={rightKey}
                  className="flex h-full flex-col p-[8%]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {right}
                </motion.div>
              </AnimatePresence>
            </MaybeNoTurn>
          </Page>

          {Array.from({ length: total - FIRST }, (_, i) => (
            <Page key={`p${i + FIRST}`} className="flex flex-col p-[8%]">
              {/* text fields and buttons inside a diary page must not start a page turn */}
              <MaybeNoTurn block={!!content[i]?.still}>{content[i]?.node ?? <BlankPage />}</MaybeNoTurn>
            </Page>
          ))}
        </HTMLFlipBook>

        {focus && reading && tabs.length > 0 && <Bookmarks tabs={tabs} current={page} onJump={turnTo} portrait={portrait} />}

        {/* under the book: Bà's thread through a trip chapter; elsewhere "‹" steps back out and one bright button leads on */}
        <div className="absolute left-0 right-0 top-full mt-5 flex items-center justify-center gap-6">
          {focus && reading && steps.length > 0 && page >= MAP ? (
            <ThreadNav
              steps={steps}
              page={page}
              portrait={portrait}
              won={won}
              atEnd={atEnd}
              prevLabel={page === MAP ? region?.name : undefined}
              onPrev={prev}
              onNext={next}
              onJump={turnTo}
            />
          ) : (
            <>
              <button
                type="button"
                className="page-turn"
                onClick={prev}
                aria-label={page === 0 ? "Gấp sổ lại" : focus && page === MAP ? (reading ? `Về trang ${region?.name}` : "Về bản đồ Việt Nam") : "Trang trước"}
              >
                <span aria-hidden>‹</span>{" "}
                {page === 0 ? "Gấp sổ" : focus && page === MAP ? (reading ? region?.name : "Bản đồ Việt Nam") : "Trang trước"}
              </button>
              {!focus && page >= MAP ? (
                <button type="button" data-guide="next" className="page-turn page-turn-main" onClick={next} aria-label={`Bắt đầu từ ${SUGGEST.label}`}>
                  Bắt đầu từ {SUGGEST.label} <span aria-hidden>›</span>
                </button>
              ) : focus && !reading && region && hasChapter(region) && (page === MAP || (portrait && page === MAP + 1)) ? (
                <button type="button" data-guide="next" className="page-turn page-turn-main" onClick={() => setReading(true)}>
                  Đọc chương {place(region)} <span aria-hidden>›</span>
                </button>
              ) : (
                <button
                  type="button"
                  // on the contents spread the main button is "Bắt đầu hành trình" on the page itself
                  data-guide={page < MAP && !(portrait && page === 0) ? undefined : "next"}
                  className={`page-turn ${portrait && page === 0 ? "page-turn-main" : ""}`}
                  onClick={next}
                  disabled={atEnd}
                  aria-label={page < MAP ? (portrait && page === 0 ? "Mục lục" : "Mở bản đồ") : "Trang sau"}
                >
                  {page < MAP ? (portrait && page === 0 ? "Mục lục" : "Mở bản đồ") : "Trang sau"} <span aria-hidden>›</span>
                </button>
              )}
            </>
          )}
        </div>
        {active && <TeoGuide />}
      </div>
    </GlossaryProvider>
  );
}

/** Pressing or dragging inside this area never starts a page turn (the map needs its clicks and hovers). */
export function NoPageTurn({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // native listeners: the flipbook listens natively on its root, so React's stopPropagation would be too late
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    el.addEventListener("touchstart", stop, { passive: true });
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, []);
  return (
    <div ref={ref} className="h-full w-full">
      {children}
    </div>
  );
}

/** Blocks page turning only while there is nothing to turn to (no region chosen yet). */
function MaybeNoTurn({
  block,
  children,
}: {
  block: boolean;
  children: ReactNode;
}) {
  return block ? (
    <NoPageTurn>{children}</NoPageTurn>
  ) : (
    <div className="h-full w-full">{children}</div>
  );
}
