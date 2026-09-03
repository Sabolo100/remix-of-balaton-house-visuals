import { Wordmark } from "@/components/BrandMark";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
    <Wordmark />
    <div>
      <p className="label-caps text-primary">404</p>
      <h1 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">
        Ez az oldal nem található
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Lehet, hogy a link elavult vagy hiányos.
      </p>
    </div>
    <a
      href={import.meta.env.BASE_URL}
      className="label-caps border border-primary bg-primary px-5 py-2.5 text-primary-foreground transition-colors hover:bg-primary/85"
    >
      Vissza a dokumentációhoz
    </a>
  </div>
);

export default NotFound;
