import { ChapterView } from "@/components/chapter/ChapterView";

export default async function ChapterPage({
  params,
  searchParams,
}: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  const { garment } = await searchParams;
  return (
    <ChapterView
      regionId={id}
      garmentId={typeof garment === "string" ? garment : undefined}
    />
  );
}
