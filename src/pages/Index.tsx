import ImageGallery from "@/components/ImageGallery";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 text-center">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-primary tracking-wide">
            Lelle Wave Residence
          </h1>
          <p className="text-muted-foreground font-body text-sm sm:text-base mt-2 tracking-widest uppercase">
            Műszaki dokumentáció
          </p>
        </div>
      </header>

      {/* Gallery */}
      <main className="py-6 sm:py-10">
        <ImageGallery />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <a
          href="https://lellewave.hu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 text-sm font-body transition-colors"
        >
          lellewave.hu
        </a>
      </footer>
    </div>
  );
};

export default Index;
