import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuideGrid from "@/components/GuideGrid";
import { getPopularLive } from "@/lib/iptv";

export default function GuidePage() {
  const events = getPopularLive();

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">TV Guide</h1>
          <GuideGrid channels={events} />
        </div>
      </main>
      <Footer />
    </>
  );
}
