## Lezárva: a lightbox zoom/pan hibája

A korábban leírt hiba — nagyítás, mozgatás, majd kicsinyítés után a kép a sarokban ragadt —
megszűnt a galéria újraírásával. A `src/components/ImageGallery.tsx` már nem létezik.

Ami helyette van:

- [`src/hooks/useZoomPan.ts`](../src/hooks/useZoomPan.ts) — az eltolás képernyőpixelben él, és
  `translate() scale()` sorrendben kerül alkalmazásra (a régi `scale() translate(pan/zoom)`
  képlet volt a hiba forrása). Minden eltolás a nagyított kép határaihoz van vágva
  (`clampOffset`), így a tervlap nem húzható ki a képernyőről, és 1-es nagyításnál
  automatikusan visszaáll középre.
- Egérgörgő, csippentés és húzás egységesen pointer eventeken keresztül; a `wheel` figyelő
  nem passzív, így a `preventDefault()` valóban megakadályozza az oldal nagyítását.
- A nagyítás és az eltolás nullázódik lapváltáskor és elforgatáskor is (`resetKey`).
