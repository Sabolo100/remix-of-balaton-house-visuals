import { describe, expect, it } from "vitest";
import {
  MAX_RENDER_WIDTH,
  STAGE_WIDTHS,
  downloadUrl,
  lightboxUrl,
  originalUrl,
  renderUrl,
  stageSrcSet,
  thumbUrl,
} from "./storage";

describe("renderUrl", () => {
  it("asks the storage renderer for a resized copy", () => {
    const url = new URL(renderUrl("HUllamTeljes_oldal_2.jpg", 1280));
    expect(url.pathname).toContain("/render/image/public/floorplans/");
    expect(url.searchParams.get("width")).toBe("1280");
    expect(url.searchParams.get("resize")).toBe("contain");
  });

  it("caps the width the renderer will actually honour", () => {
    const url = new URL(renderUrl("a.jpg", 9000));
    expect(url.searchParams.get("width")).toBe(String(MAX_RENDER_WIDTH));
  });

  it("escapes names so a space cannot break the path", () => {
    expect(renderUrl("a b.jpg", 240)).toContain("a%20b.jpg");
  });
});

describe("stageSrcSet", () => {
  it("offers every candidate width with a descriptor", () => {
    const entries = stageSrcSet("a.jpg").split(", ");
    expect(entries).toHaveLength(STAGE_WIDTHS.length);
    entries.forEach((entry, i) => expect(entry.endsWith(` ${STAGE_WIDTHS[i]}w`)).toBe(true));
  });

  it("never serves the untouched original to the stage", () => {
    expect(stageSrcSet("a.jpg")).not.toContain("/object/public/");
  });
});

describe("downloadUrl", () => {
  it("hands the browser the original with an attachment name", () => {
    const url = new URL(downloadUrl("HUllamTeljes_oldal_6.jpg", "LelleWave_E-A-06.jpg"));
    expect(url.pathname).toContain("/object/public/floorplans/");
    expect(url.searchParams.get("download")).toBe("LelleWave_E-A-06.jpg");
  });

  it("downloads the full-resolution file, not a render", () => {
    expect(downloadUrl("a.jpg", "a.jpg")).toContain(originalUrl("a.jpg"));
  });
});

describe("viewing sizes", () => {
  it("keeps thumbnails far smaller than the full-screen copy", () => {
    const width = (url: string) => Number(new URL(url).searchParams.get("width"));
    expect(width(thumbUrl("a.jpg"))).toBeLessThan(width(lightboxUrl("a.jpg")) / 5);
  });
});
