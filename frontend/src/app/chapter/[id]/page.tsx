import { ChapterView } from "@/components/chapter/ChapterView";

export default async function ChapterPage({ params }: PageProps<"/chapter/[id]">) {
  const { id } = await params;
  return <ChapterView regionId={id} />;
}
