"use client";

import HTMLFlipBook from "react-pageflip";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bootstrap } from "@/lib/types";
import {
  ArriveDiary,
  AskDiary,
  BlankPage,
  Bookmarks,
  FestivalDiary,
  HoverPage,
  LifeDiary,
  LookDiary,
  OwnDiary,
  WearDiary,
  type Tab,
} from "./Diary";
import { HandwrittenText } from "./HandwrittenText";
import { Page } from "./Page";
import { VietnamMap } from "./VietnamMap";

// The page count never changes (page-flip keeps the DOM nodes it was given); only what is written on them does.
// map · Đến · Nhìn quanh · Nếp sống · Lễ hội · Mặc ×3 · Bà hỏi con · Trang của con (Huế is the longest)
const PAGES = 10;

// where the reader is, kept across a rebuild of the book (a new size means a new page-flip instance)
const memo = { focus: null as string | null, page: 0 };

export type Resume = { region: string; page: "own" | "wear" } | null;

/**
 * The inside of Bà's notebook. Only paper pages live here and they turn like paper (drag a corner, or the arrows).
 * The covers are not part of this flipbook: the desk opens and closes them with its own hard-cover swing.
 *
 * Part 2 is Bà's diary: hover a region → one line from her diary; click → the map zooms into its provinces and the
 * "Đến" entry opens; then Nhìn quanh → Sống (nếp sống, lễ hội) → Mặc → Trang của con. Bookmarks jump between them.
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
  const locked = data.regions
    .filter((r) => r.status === "locked")
    .map((r) => r.id);

  // hover: the region under the pointer, with a short dwell so sweeping across the map does not flicker
  const [hovered, setHovered] = useState<string | null>(null);
  const dwell = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onHover = (id: string | null) => {
    clearTimeout(dwell.current);
    dwell.current = setTimeout(() => setHovered(id), id ? 120 : 300);
  };
  useEffect(() => () => clearTimeout(dwell.current), []);

  // the region the map is zoomed into; phones first show a preview card (no hover on touch)
  const [focus, setFocus] = useState<string | null>(restore ? memo.focus : (resume?.region ?? null));
  const [preview, setPreview] = useState<string | null>(null);
  const [hotProvince, setHotProvince] = useState<string | null>(null);
  const region = focus ? regions.get(focus) : undefined;
  const j = region?.journey ?? null;
  const listening = !focus && hovered ? regions.get(hovered) : undefined;

  // what each page carries for this region, and where the bookmarks point
  const tryOn = (garment: string) =>
    region && router.push(`/chapter/${region.id}?garment=${garment}`);
  const content: ReactNode[] = [];
  const tabs: Tab[] = [];
  if (region && j) {
    tabs.push({ label: "Đến", page: 1 });
    tabs.push({ label: "Nhìn quanh", page: content.length + 2 });
    content.push(<LookDiary region={region} data={data} />);
    if (j.life) {
      tabs.push({ label: "Sống", page: content.length + 2 });
      content.push(<LifeDiary region={region} data={data} />);
    }
    if (j.festivals)
      content.push(<FestivalDiary region={region} data={data} />);
    if (j.wear.length) tabs.push({ label: "Mặc", page: content.length + 2 });
    j.wear.forEach((_, i) =>
      content.push(
        <WearDiary region={region} index={i} data={data} onTry={tryOn} />,
      ),
    );
    if (j.check && region.status === "open") {
      tabs.push({ label: "Bà hỏi", page: content.length + 2 });
      content.push(<AskDiary key={`ask-${region.id}`} region={region} />);
    }
    tabs.push({
      label: region.status === "open" ? "Trang của con" : "Trang để trống",
      page: content.length + 2,
    });
    content.push(
      <OwnDiary key={region.id} region={region} data={data} onTry={tryOn} />,
    );
  }
  const used = 2 + content.length;

  const [page, setPage] = useState(restore ? memo.page : 0);
  useEffect(() => {
    memo.focus = focus;
    memo.page = page;
  }, [focus, page]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pageflip ships no type for its instance
  const bookRef = useRef<any>(null);
  const perView = portrait ? 1 : 2;
  const reachable = focus ? used + (portrait ? 0 : used % 2) : 2; // without a region there is nothing to turn to
  const atStart = page < perView;
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
    if (!portrait && Math.abs(left - page) === 2)
      return left > page ? pf.flipNext("bottom") : pf.flipPrev("bottom");
    jump(left);
  };
  const go = (id: string, then?: () => void) => {
    setPreview(null);
    setHovered(null);
    setFocus(id);
    if (then) setTimeout(then, 1100); // after the map has zoomed in
  };
  const toCountry = () => {
    setHotProvince(null);
    if (page === 0) return setFocus(null);
    jump(0, () => setFocus(null));
  };
  const prev = () => {
    if (atStart) return focus ? toCountry() : onClose?.();
    if (!portrait) return bookRef.current?.pageFlip()?.flipPrev("bottom");
    jump(page - 1);
  };
  const next = () => !atEnd && bookRef.current?.pageFlip()?.flipNext("bottom");

  // "Tôi sắp tham gia sự kiện": open Huế and turn straight to the áo dài page
  const toEvent = () => {
    const hue = regions.get("hue")?.journey;
    const idx = hue?.wear.findIndex((w) => w.garment === "ao-dai") ?? -1;
    if (!hue || idx < 0) return router.push("/chapter/hue?entry=event");
    const wearAt = 2 + 1 + (hue.life ? 1 : 0) + (hue.festivals ? 1 : 0) + idx;
    go("hue", () => turnTo(wearAt));
  };

  // back from the try-on: open the region on its Mặc page or on "Trang của con"
  const resumed = useRef(false);
  useEffect(() => {
    if (!resume || resumed.current || !j) return;
    resumed.current = true;
    const tab = tabs.find(
      (t) => t.label === (resume.page === "own" ? "Trang của con" : "Mặc"),
    );
    if (tab) setTimeout(() => turnTo(tab.page), 1200);
  });

  // ← → turn pages, Esc leaves the region (ignored while typing in a field)
  const keys = useRef({ prev, next, active, toCountry, focus });
  useEffect(() => {
    keys.current = { prev, next, active, toCountry, focus };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!keys.current.active) return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea, [contenteditable]")
      )
        return;
      if (e.key === "ArrowRight") keys.current.next();
      if (e.key === "ArrowLeft") keys.current.prev();
      if (e.key === "Escape" && keys.current.focus) keys.current.toCountry();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSelect = (id: string) =>
    portrait && preview !== id ? setPreview(id) : go(id);
  const previewRegion = preview ? regions.get(preview) : undefined;

  // the right-hand page of the first spread
  const rightKey = region
    ? `arrive-${region.id}`
    : listening
      ? `hover-${listening.id}`
      : "welcome";
  const right = region ? (
    <ArriveDiary
      region={region}
      data={data}
      hotProvince={hotProvince}
      onProvinceHover={setHotProvince}
    />
  ) : listening ? (
    <HoverPage region={listening} />
  ) : (
    <WelcomeBody onEvent={toEvent} />
  );

  return (
    <div
      className={`relative transition-opacity duration-200 ${fading ? "opacity-0" : ""}`}
    >
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
        onFlip={(e: { data: number }) => setPage(e.data)}
        className="book-open book-pages select-none"
        style={{}}
      >
        <Page className="relative p-4">
          <NoPageTurn>
            <VietnamMap
              ink="static" // the desk already inked it while the cover swung open
              active={hovered}
              locked={locked}
              onHover={onHover}
              onSelect={onSelect}
              focus={focus}
              landmarks={j?.arrive.landmarks}
              hotProvince={hotProvince}
              onProvinceHover={setHotProvince}
              onBack={toCountry}
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
                  <HoverPage
                    region={previewRegion}
                    onGo={() => go(previewRegion.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </NoPageTurn>
        </Page>

        <Page className="h-full">
          <MaybeNoTurn block={!focus}>
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

        {Array.from({ length: PAGES - 2 }, (_, i) => (
          <Page key={`p${i + 2}`} className="flex flex-col p-[8%]">
            {/* text fields and buttons inside a diary page must not start a page turn */}
            <MaybeNoTurn block={i >= content.length - 2}>
              {content[i] ?? <BlankPage />}
            </MaybeNoTurn>
          </Page>
        ))}
      </HTMLFlipBook>

      {focus && tabs.length > 0 && (
        <Bookmarks
          tabs={tabs}
          current={page}
          onJump={turnTo}
          portrait={portrait}
        />
      )}

      {/* page turning under the book: on the first page "‹" leaves the region, or closes the notebook */}
      <div className="absolute left-0 right-0 top-full mt-5 flex items-center justify-center gap-6">
        <button
          type="button"
          className="page-turn"
          onClick={prev}
          aria-label={
            atStart
              ? focus
                ? "Về bản đồ Việt Nam"
                : "Gấp sổ lại"
              : "Trang trước"
          }
        >
          <span aria-hidden>‹</span>{" "}
          {atStart ? (focus ? "Bản đồ Việt Nam" : "Gấp sổ") : "Trang trước"}
        </button>
        <button
          type="button"
          className="page-turn"
          onClick={next}
          disabled={atEnd}
          aria-label="Trang sau"
        >
          Trang sau <span aria-hidden>›</span>
        </button>
      </div>
    </div>
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

/** Bà's page (right side of the map spread). Shared with the desk so the opening hands over seamlessly. */
export function WelcomeBody({
  note,
  onEvent,
}: {
  note?: { title: string; lines: string[] } | null;
  onEvent?: () => void;
}) {
  return (
    <>
      <p className="font-hand text-[1.35rem] leading-snug text-stone-800">
        Muốn viết tiếp một câu chuyện, trước hết phải hiểu câu chuyện đã có.
      </p>
      <p className="font-hand mt-1 text-right text-lg text-stone-500">— Bà</p>
      <div className="mt-6 min-h-[9rem] flex-1">
        {note ? (
          <HandwrittenText title={note.title} lines={note.lines} />
        ) : (
          <p className="font-hand text-2xl text-[#B5452E]">
            Chọn nơi con muốn bắt đầu.
          </p>
        )}
      </div>
      <button
        onClick={onEvent}
        tabIndex={onEvent ? 0 : -1}
        className="self-start rounded-full border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 hover:text-amber-50"
      >
        Tôi sắp tham gia sự kiện
      </button>
    </>
  );
}
