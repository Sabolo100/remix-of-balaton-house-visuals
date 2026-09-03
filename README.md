# Lelle Wave Residence — Műszaki dokumentáció

Egyoldalas tervlap-néző a balatonlellei Lelle Wave Residence társasházhoz. Az érdeklődők
egyetlen linken megnyithatják az engedélyezési tervlapokat — szintenkénti alaprajzokat,
metszeteket és homlokzatokat —, teljes méretben megnézhetik és letölthetik őket, anélkül,
hogy a rajzok felkerülnének a nyilvános projekt oldalra ([lellewave.hu](https://lellewave.hu)).

Az oldal `noindex, nofollow`: kereső nem indexeli, csak az kapja meg, akinek elküldik.

## Mit tud

- Nagy főkép + görgethető bélyegkép-sáv, kategóriaszűrővel (alaprajz / metszet / homlokzat)
- Teljes képernyős nézet: csippentés, görgetés, dupla koppintás a nagyításhoz, húzás a mozgatáshoz
- **Elforgatás** — álló telefonon a fekvő tervlapok így közel háromszor nagyobbak
- Letöltés az eredeti felbontású fájlból, beszédes fájlnévvel
- Mély link minden lapra (`#e-a-04`), így egy konkrét tervlap is küldhető
- Billentyűzet: `←` `→` lapozás, `Esc` bezárás, `+` `−` `0` nagyítás

## Hogyan állnak össze a tervlapok

A képek a Supabase Storage `floorplans` (publikus) bucketjében vannak. Két forrásból áll össze a lista:

1. **[`src/data/drawings.ts`](src/data/drawings.ts)** — a kurált jegyzék. Ez adja a sorrendet és
   a címeket, amelyek a rajzok saját fejlécéből (title block) származnak, nem fájlnévből találgatva.
   Ez renderelődik azonnal, hálózati kérés nélkül.
2. **A bucket listázása** a háttérben. Ami feltöltésre került a build óta, az a lista végére kerül
   fájlnévből képzett címmel; ami törlődött, az kiesik. Ha a listázás hibázik, a jegyzék marad
   érvényben — az oldal sosem ürül ki hálózati hiba miatt.

### Új tervlap hozzáadása

Töltsd fel a `floorplans` bucketbe — azonnal megjelenik. Hogy rendes címet és helyet kapjon,
vedd fel egy sorral a `DRAWINGS` tömbbe:

```ts
{ file: "HUllamTeljes_oldal_16.jpg", sheet: "É.A.16", title: "Pinceszint alaprajz",
  category: "alaprajz", aspect: 2500 / 1485 }
```

Az `aspect` a forrásfájl szélesség/magasság aránya — ettől nem ugrik a layout töltés közben.

## Képméretek

Az eredetik 8503 × 5051 pixelesek (2–11 MB), ezért soha nem kerülnek közvetlenül a képernyőre.
A Supabase képtranszformációja szolgálja ki őket ([`src/lib/storage.ts`](src/lib/storage.ts)):

| Hol | Szélesség | Nagyságrend |
| --- | --- | --- |
| Bélyegkép | 240 px | ~7 kB |
| Főkép | `srcset` 640–2500 px | 48–670 kB (a böngésző választ) |
| Teljes képernyő | 2500 px | ~670 kB |
| Letöltés | eredeti | 2–11 MB |

A transzformáció 3000 px-nél levágja a kimenetet — efölött hiába kérünk többet.

## Fejlesztés

```sh
npm install
npm run dev
```

- `npm test` — Vitest (a jegyzék és az URL-építők egységtesztjei)
- `npm run lint` — ESLint
- `npm run build` — production build

A `src/components/ui/` alatti shadcn készlet a sablonból maradt, az alkalmazás nem használja;
a bundle-be sem kerül bele.

## Build with Lovable

Continue developing this project in the
[Lovable editor](https://lovable.dev/projects/ba0ff010-643c-43d7-b6fc-4de92afe9608).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back
  into Lovable, ready for your next prompt.
