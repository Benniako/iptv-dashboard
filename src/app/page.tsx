import Header from "@/components/Header";
import CategoryGrid from "@/components/CategoryGrid";
import PopularLive from "@/components/PopularLive";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Notice Banner */}
        <div className="border-b border-border/30 bg-[#1a1a2e]/80">
          <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs text-muted-foreground">
            <span className="text-[#f1c40f]">⚠</span>{" "}
            Always use the official StreamTV web address for the original streams.{" "}
            <a
              href="https://strmd.link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3498db] hover:underline"
            >
              strmd.link
            </a>
          </div>
        </div>

        <CategoryGrid />
        <PopularLive />
      </main>
      <Footer />
    </>
  );
}
