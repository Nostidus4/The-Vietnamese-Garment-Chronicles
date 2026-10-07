import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { ChapterView } from "@/components/chapter/ChapterView";
import { RoomShell } from "@/components/chapter/RoomShell";

// One page per region, built ahead of time (static export for GitHub Pages); ?garment= and ?step= are read in the
// browser (useSearchParams), so the view sits in a Suspense boundary and is rendered on the client.
export const dynamicParams = false;

export function generateStaticParams() {
  const file = path.join(process.cwd(), "..", "backend", "content", "regions.json");
  const ids = fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")).regions as { id: string }[]).map((r) => r.id)
    : ["bac-bo", "hue", "nam-bo", "tay-bac", "tay-nguyen"];
  return ids.map((id) => ({ id }));
}

function regionOf(id: string) {
  const file = path.join(process.cwd(), "..", "backend", "content", "regions.json");
  const region = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")).regions as { id: string; name: string; status: string }[]).find((r) => r.id === id) : undefined;
  return { region, place: region?.name.split("/")[0].trim() };
}

/** "Tủ áo của Bà · Huế": a tab per room instead of the same title everywhere (#54). */
export async function generateMetadata({ params }: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  const { region, place } = regionOf(id);
  // a room still closed says so in the tab too (#112)
  if (place && region?.status === "locked") return { title: `Tủ áo của Bà · ${place} (đang cùng cộng đồng viết)` };
  return { title: place ? `Tủ áo của Bà · ${place}` : "Tủ áo của Bà" };
}

export default async function ChapterPage({ params }: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  const { region, place } = regionOf(id);
  const locked = region?.status === "locked";
  // the fallback is what the static HTML carries: the room's frame, not a line of text on an empty page (#120)
  return (
    <Suspense fallback={<RoomShell regionId={id} place={place} locked={locked} ask />}>
      <ChapterView regionId={id} shellPlace={place} locked={locked} />
    </Suspense>
  );
}
