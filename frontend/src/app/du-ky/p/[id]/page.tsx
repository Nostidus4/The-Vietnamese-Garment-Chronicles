import { SharedView } from "@/components/duky/SharedView";

export default async function SharedPage({ params }: PageProps<"/du-ky/p/[id]">) {
  const { id } = await params;
  return <SharedView id={id} />;
}
