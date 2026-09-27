import { BookLoader } from "@/components/book/BookLoader";

export default function Home() {
  return (
    <main className="flex flex-col items-center px-4 pb-10">
      <BookLoader />
    </main>
  );
}
