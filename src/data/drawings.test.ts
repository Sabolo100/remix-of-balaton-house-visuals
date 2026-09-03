import { describe, expect, it } from "vitest";
import { DRAWINGS, deriveDrawing, downloadName, drawingId } from "./drawings";

describe("drawings manifest", () => {
  it("covers every sheet exactly once", () => {
    const files = DRAWINGS.map((drawing) => drawing.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it("gives each sheet a deep link of its own", () => {
    // Two sheets share the number É.A.01; their links must still differ.
    const ids = DRAWINGS.map(drawingId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("e-a-02");
  });

  it("keeps deep links free of accents and separators", () => {
    for (const id of DRAWINGS.map(drawingId)) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("names downloads in plain ASCII", () => {
    const name = downloadName(DRAWINGS.find((d) => d.title.includes("Északi"))!);
    expect(name).toBe("LelleWave_E-A-11-Eszaki-homlokzat.jpg");
    expect(name).toMatch(/^[A-Za-z0-9_.-]+$/);
  });

  it("strips the typographic quotes around building references", () => {
    const name = downloadName(DRAWINGS.find((d) => d.title.includes("„A”"))!);
    expect(name).toBe("LelleWave_E-A-14-A-epuletresz-nyugati-homlokzat.jpg");
  });
});

describe("deriveDrawing", () => {
  it("makes a readable title out of a file uploaded later", () => {
    expect(deriveDrawing("pinceszint_alaprajz.jpg")).toMatchObject({
      file: "pinceszint_alaprajz.jpg",
      title: "Pinceszint alaprajz",
      category: "egyeb",
    });
  });

  it("falls back to a positional deep link when there is no sheet number", () => {
    expect(drawingId(deriveDrawing("uj_terv.jpg"), 16)).toBe("lap-17");
  });
});
