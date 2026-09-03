import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/BrandMark";
import { DrawingGallery } from "@/components/gallery/DrawingGallery";
import { PROJECT } from "@/data/drawings";

const Index = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8 sm:py-4">
        <Wordmark />
        <a
          href={PROJECT.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="hidden sm:inline">lellewave.hu</span>
          <span className="sm:hidden">Projekt</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-8 animate-rise-in sm:mb-12">
        <p className="label-caps text-primary">{PROJECT.name}</p>
        <h1 className="mt-2.5 font-display text-[1.75rem] leading-tight text-foreground sm:text-[2.5rem]">
          Műszaki dokumentáció
        </h1>
        <div className="rule-gold mt-5 h-px w-16" />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {PROJECT.documentTitle} — szintenkénti alaprajzok, metszetek és homlokzatok.
          <span className="mt-1 block text-[0.8rem] text-muted-foreground/80">
            {PROJECT.address} · {PROJECT.date}
          </span>
        </p>
      </div>

      <DrawingGallery />
    </main>

    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-3 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-xs leading-relaxed text-muted-foreground">
          A tervlapok tájékoztató jellegűek, a kivitelezés során eltérés lehetséges.
        </p>
        <a
          href={PROJECT.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps flex items-center gap-1.5 text-primary transition-opacity hover:opacity-70"
        >
          lellewave.hu
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </footer>
  </div>
);

export default Index;
