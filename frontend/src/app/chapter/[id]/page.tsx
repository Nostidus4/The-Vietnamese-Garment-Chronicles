import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { ChapterView } from "@/components/chapter/ChapterView";

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

/** "Tủ áo của Bà · Huế": a tab per room instead of the same title everywhere (#54). */
export async function generateMetadata({ params }: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  const file = path.join(process.cwd(), "..", "backend", "content", "regions.json");
  const region = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")).regions as { id: string; name: string }[]).find((r) => r.id === id) : undefined;
  const place = region?.name.split("/")[0].trim();
  return { title: place ? `Tủ áo của Bà · ${place}` : "Tủ áo của Bà" };
}

export default async function ChapterPage({ params }: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-8">Đang lật trang…</p>}>
      <ChapterView regionId={id} />
    </Suspense>
  );
}
