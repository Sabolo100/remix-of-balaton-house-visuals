
## Bug: Lightbox kép a sarokba ragad zoom-out után

### Probléma
A lightboxban ha a user nagyítja a képet, elmozgatja (pan), majd kicsinyíti, a kép a képernyő egyik sarkában marad ahelyett, hogy középre kerülne. Ezt mutatja a screenshot is — a Földszint alaprajz a jobb alsó sarokban ragadt.

### Ok
A `transform: scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` képletben a `pan` értéke nem kerül resetelésre amikor a zoom szint 1 vagy az alá csökken. A felső "Kicsinyítés" gomb (ZoomOut) ugyan resetel, de:
1. A wheel zoom (görgetés) nem resetel pan-t
2. A pinch zoom (touch) nem resetel pan-t
3. A "Nagyítás" gomb sem törli a régi pant
4. Lightbox bezárás után a következő megnyitásnál a pan resetelődik (ezt jól csinálja az `openLightbox`), de képek között váltáskor sem reset

### Megoldás (`src/components/ImageGallery.tsx`)

1. **Wheel zoom**: amikor a zoom ≤ 1 lesz, állítsd vissza `pan = {x:0, y:0}`-ra
2. **Pinch zoom**: ugyanaz
3. **ZoomIn gomb**: ha jelenleg zoom ≤ 1, reset pan az új zoom előtt (vagy mindig clamp-eld a pan-t a látható területre)
4. **Képváltáskor a lightboxban** (`goPrev`/`goNext` amíg a lightbox nyitva van): reset zoom és pan
5. **Bónusz**: amikor a kép kicsinyítve van (zoom ≤ 1), a `cursor: grab` ne jelenjen meg és a pan event-ek ne működjenek (ez már részben így van a `handleLightboxPointerDown`-ban a `zoom > 1` check miatt)

### Implementáció lényege
Egy közös `setZoomSafe(newZoom)` helper, ami zoom ≤ 1 esetén automatikusan `setPan({x:0,y:0})`-t is hív. Ezt használja a wheel, pinch és gombok logikája.
