/**
 * Guards the resume PDF renderers against drifting from the live preview.
 *
 * Every layout in components/resume/layouts has a twin in
 * components/resume/pdf/SpecialPdfLayouts.tsx. They are separate renderers
 * (@react-pdf can't use the DOM), so nothing but a test stops them diverging -
 * which is exactly how six templates ended up downloading as a completely
 * different design than the one the user picked.
 *
 * This script renders every variant through the real ResumeDocument and then
 * asserts the things that silently broke before: that sections aren't dropped,
 * that the Customize panel is honored, and that reordering reaches the file.
 *
 * Run from frontend/:
 *   npm install --no-save --no-package-lock jsdom
 *   node scripts/check-pdf-layouts.mjs
 *
 * jsdom is needed because richTextToPdf parses Tiptap HTML with the DOM.
 * Modules load through Vite so .tsx sources and `?url` assets resolve as
 * they do in the app.
 */
import { JSDOM } from "jsdom";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { createServer } from "vite";

// must exist before any resume module loads
const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.DOMParser = dom.window.DOMParser;

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = resolve(root, ".pdf-check");
const fontDir = resolve(root, "src/assets/fonts");

const vite = await createServer({
  root,
  logLevel: "error",
  server: { middlewareMode: true },
  appType: "custom",
  plugins: [
    {
      // registerPdfFonts imports the Khmer TTFs with `?url`, which under the
      // dev server resolves to "/src/assets/...". react-pdf in Node would read
      // that as a filesystem path (and can't fetch file:// either), so hand it
      // a base64 data URL, which its font loader accepts.
      name: "pdf-check-font-urls",
      enforce: "pre",
      resolveId(id) {
        if (!id.endsWith(".ttf?url")) return null;
        const file = id.replace("?url", "").split("/").pop();
        return { id: `\0pdf-check-font:${resolve(fontDir, file)}` };
      },
      load(id) {
        if (!id.startsWith("\0pdf-check-font:")) return null;
        const b64 = readFileSync(id.slice("\0pdf-check-font:".length)).toString(
          "base64",
        );
        return `export default "data:font/ttf;base64,${b64}";`;
      },
    },
  ],
});

const { ResumeDocument } = await vite.ssrLoadModule(
  "/src/components/resume/pdf/ResumeDocument.tsx",
);
const { DEMO_RESUME } = await vite.ssrLoadModule("/src/data/demoResume.ts");
const { renderToBuffer } = await import("@react-pdf/renderer");
const React = (await import("react")).default;

const SPECIAL_VARIANTS = [
  "designerBlock",
  "techSplit",
  "bankingClean",
  "freshSidebar",
  "navyAnalyst",
  "ribbonFold",
  "graphicPro",
  "executiveCard",
  "monoTimeline",
  "editorialClassic",
  "compactTech",
  "graduateFocus",
  "corporateBand",
  "warmColumns",
  "monoPill",
  "cleanHeaderSplit",
];
const VARIANTS = ["default", ...SPECIAL_VARIANTS];

/** cleanHeaderSplit's preview renders a fixed structure and a heading that
 *  ignores headingBorder, so those two checks don't apply to it. */
const FIXED_STRUCTURE = new Set(["cleanHeaderSplit"]);

// the demo resume has no references, and References was one of the sections
// the old special PDF layouts silently dropped - so supply some
const REFERENCES = [
  {
    id: "ref-1",
    name: "Dara Sok",
    jobTitle: "Marketing Director",
    company: "ABA Bank",
    email: "dara.sok@example.com",
    phone: "+855 12 111 222",
  },
  {
    id: "ref-2",
    name: "Sreymom Chea",
    jobTitle: "Head of Retail",
    company: "Smart Axiata",
    email: "sreymom.chea@example.com",
    phone: "+855 12 333 444",
  },
];

function resumeWith(layoutVariant, patch) {
  return {
    ...DEMO_RESUME,
    includeReferences: true,
    references: REFERENCES,
    customization: {
      ...DEMO_RESUME.customization,
      layoutVariant,
      ...patch,
    },
  };
}

async function render(layoutVariant, patch = {}) {
  const buf = await renderToBuffer(
    React.createElement(ResumeDocument, { resume: resumeWith(layoutVariant, patch) }),
  );
  return buf;
}

/** Pulls the visible text runs out of a PDF - what was drawn, at what size,
 *  and where.
 *
 *  Once real fonts are embedded, react-pdf subsets them and switches to
 *  Identity-H, so the bytes in a TJ array are glyph ids, not ASCII. Each font
 *  carries a /ToUnicode CMap that maps them back; decode through that, per
 *  font, because two subsets can reuse the same id for different characters. */
function pdfRuns(buf) {
  const lat = buf.toString("latin1");

  // every indirect object, so fonts and their CMaps can be looked up by id
  const objects = new Map();
  for (const m of lat.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) {
    objects.set(m[1], m[2]);
  }

  // Decompress one object stream. Index arithmetic rather than a regex so
  // there is no escape sequence for tooling to mangle.
  const inflateStream = (body) => {
    const at = body.indexOf("stream");
    if (at === -1) return null;
    let from = at + "stream".length;
    if (body.charCodeAt(from) === 13) from += 1;
    if (body.charCodeAt(from) === 10) from += 1;
    const to = body.indexOf("endstream", from);
    if (to === -1) return null;
    const raw = Buffer.from(body.slice(from, to), "latin1");
    try {
      return /FlateDecode/.test(body)
        ? inflateSync(raw).toString("latin1")
        : raw.toString("latin1");
    } catch {
      return null;
    }
  };

  const hexToStr = (hex) => {
    let out = "";
    for (let i = 0; i + 3 < hex.length + 1; i += 4) {
      const cp = parseInt(hex.slice(i, i + 4), 16);
      if (!Number.isNaN(cp)) out += String.fromCharCode(cp);
    }
    return out;
  };

  /** glyph id -> text, from one /ToUnicode CMap */
  const parseCMap = (cmap) => {
    const map = new Map();
    for (const blk of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const e of blk[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        map.set(parseInt(e[1], 16), hexToStr(e[2]));
      }
    }
    for (const blk of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      // array form: <lo> <hi> [<d0> <d1> ...] - one destination per code.
      // react-pdf emits this, and reading it as a contiguous range yields
      // text that looks plausible but is silently shifted.
      for (const e of blk[1].matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]*)\]/g,
      )) {
        const lo = parseInt(e[1], 16);
        const dsts = [...e[3].matchAll(/<([0-9A-Fa-f]*)>/g)];
        dsts.forEach((d, i) => map.set(lo + i, hexToStr(d[1])));
      }
      // contiguous form: <lo> <hi> <dst>
      for (const e of blk[1].matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
      )) {
        const lo = parseInt(e[1], 16);
        const hi = parseInt(e[2], 16);
        const dst = parseInt(e[3], 16);
        for (let i = 0; lo + i <= hi; i += 1) {
          if (!map.has(lo + i)) map.set(lo + i, String.fromCharCode(dst + i));
        }
      }
    }
    return map;
  };

  // /Fn -> glyph map, via the page's font resources
  const fontMaps = new Map();
  for (const res of lat.matchAll(/\/Font\s*<<([^>]*)>>/g)) {
    for (const ref of res[1].matchAll(/\/(F\d+)\s+(\d+) 0 R/g)) {
      const font = objects.get(ref[2]);
      if (!font) continue;
      // Type0 fonts point at a descendant; the ToUnicode lives on the parent
      const tu = /\/ToUnicode\s+(\d+) 0 R/.exec(font);
      if (!tu) continue;
      const body = objects.get(tu[1]);
      const cmap = body && inflateStream(body);
      if (cmap) fontMaps.set(ref[1], parseCMap(cmap));
    }
  }

  // react-pdf positions text with nested `cm` translations inside q/Q pairs,
  // not Tm, so multiply the stack down to get where a run was drawn
  const mul = (a, b) => [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];

  const runs = [];
  let page = 0;
  for (const [, body] of objects) {
    if (!/\/Filter/.test(body)) continue;
    const content = inflateStream(body);
    if (!content || !/T[jJ]/.test(content)) continue;
    let current = null;
    let size = 0;
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const tok =
      // the TJ match must stop at its own "]", or a dash-array like "[] 0 d"
      // swallows every q/Q/cm up to the next real TJ
      /(q)\b|(Q)\b|([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) cm|\/(F\d+)\s+([\d.]+)\s+Tf|\[([^\]]*)\]\s*TJ/g;
    let t;
    while ((t = tok.exec(content)) !== null) {
      if (t[1]) {
        stack.push(ctm.slice());
        continue;
      }
      if (t[2]) {
        ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        continue;
      }
      if (t[3] !== undefined) {
        ctm = mul([+t[3], +t[4], +t[5], +t[6], +t[7], +t[8]], ctm);
        continue;
      }
      if (t[9]) {
        current = fontMaps.get(t[9]) ?? null;
        size = Number(t[10]);
        continue;
      }
      let line = "";
      for (const part of t[11].matchAll(/<([0-9A-Fa-f\s]*)>/g)) {
        const hex = part[1].replace(/\s+/g, "");
        if (current) {
          for (let i = 0; i + 1 < hex.length; i += 4) {
            line += current.get(parseInt(hex.slice(i, i + 4), 16)) ?? "";
          }
        } else {
          for (let i = 0; i + 1 < hex.length; i += 2) {
            line += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
          }
        }
      }
      if (line.trim()) {
        runs.push({ text: line, size, x: ctm[4], y: Math.abs(ctm[5]), page });
      }
    }
    page += 1;
  }
  return runs;
}

/** Just the visible strings, in drawing order. */
function pdfText(buf) {
  return pdfRuns(buf)
    .map((r) => r.text)
    .join(String.fromCharCode(10));
}

let pass = 0;
let fail = 0;
function check(label, ok, detail = "") {
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ""}`);
  }
}
function done(title) {
  console.log(`${fail ? "" : "  all ok"}  - ${title}`);
}

mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ *
 * 1. every variant renders, under settings the old layouts ignored
 * ------------------------------------------------------------------ */
const CASES = [
  { name: "base", patch: {} },
  {
    name: "filled-headings-khmer",
    patch: { headingBorder: "filled", headingLanguage: "km" },
  },
  {
    name: "outline-yearonly-listskills",
    patch: {
      headingBorder: "outline",
      dateFormat: "yearOnly",
      skillsDisplay: "list",
      capitalization: "capitalize",
    },
  },
  {
    name: "reordered-sections",
    patch: {
      specialSectionOrder: [
        "references",
        "skills",
        "education",
        "language",
        "experience",
      ],
      specialSidebarKeys: ["experience", "references"],
      headingBorder: "underline",
    },
  },
  {
    name: "line-headings-no-rule",
    patch: {
      headingBorder: "line",
      toggles: { ...DEMO_RESUME.customization.toggles, headingsLine: false },
    },
  },
  {
    name: "no-photo-letter",
    patch: { showPhoto: false, pageFormat: "letter", photoShape: "square" },
  },
];

console.log("\nrendering");
for (const variant of VARIANTS) {
  for (const testCase of CASES) {
    try {
      const buf = await render(variant, testCase.patch);
      if (!buf || buf.length < 1000) {
        throw new Error(`suspiciously small PDF (${buf?.length ?? 0} bytes)`);
      }
      if (testCase.name === "base") {
        writeFileSync(resolve(outDir, `${variant}.pdf`), buf);
      }
      pass += 1;
    } catch (err) {
      fail += 1;
      console.log(`  FAIL  ${variant} / ${testCase.name}`);
      console.log(`        ${err?.message ?? err}`);
    }
  }
}
done(`${VARIANTS.length} variants x ${CASES.length} settings render`);

/* ------------------------------------------------------------------ *
 * 2. no section is silently dropped
 * ------------------------------------------------------------------ */
console.log("\nsections present");
const REQUIRED = [
  [/Khmer/i, "languages"],
  [/Dara Sok/i, "references"],
  [/Phnom Penh, Cambodia/i, "location"],
  [/Royal University/i, "education"],
  [/ABA Bank/i, "experience"],
  [/Campaign strategy/i, "skills"],
  [/Marketing executive with/i, "summary"],
];
for (const variant of SPECIAL_VARIANTS) {
  const text = pdfText(await render(variant));
  const missing = REQUIRED.filter(([re]) => !re.test(text)).map(([, n]) => n);
  check(variant, missing.length === 0, `missing: ${missing.join(", ")}`);
}
done("no section dropped");

/* ------------------------------------------------------------------ *
 * 3. dateFormat is honored (the old layouts hardcoded year-only)
 * ------------------------------------------------------------------ */
console.log("\ndateFormat honored");
for (const variant of SPECIAL_VARIANTS) {
  const month = pdfText(await render(variant, { dateFormat: "monthYear" }));
  const year = pdfText(await render(variant, { dateFormat: "yearOnly" }));
  check(
    variant,
    month.includes("Jan 2022") && !year.includes("Jan 2022") && year.includes("2022"),
    `monthYear had "Jan 2022": ${month.includes("Jan 2022")}, yearOnly had it: ${year.includes("Jan 2022")}`,
  );
}
done("dateFormat honored");

/* ------------------------------------------------------------------ *
 * 4. headingBorder reaches the PDF
 * ------------------------------------------------------------------ */
console.log("\nheadingBorder honored");
for (const variant of SPECIAL_VARIANTS) {
  if (FIXED_STRUCTURE.has(variant)) continue;
  const plain = await render(variant, { headingBorder: "none" });
  const outline = await render(variant, { headingBorder: "outline" });
  check(variant, plain.length !== outline.length, "outline rendered identically");
}
done("headingBorder honored");

/* ------------------------------------------------------------------ *
 * 5. the user's section order reaches the PDF
 * ------------------------------------------------------------------ */
console.log("\nsection order honored");
for (const variant of SPECIAL_VARIANTS) {
  if (FIXED_STRUCTURE.has(variant)) continue;
  const a = await render(variant, {
    specialSectionOrder: ["experience", "education", "skills", "language", "references"],
  });
  const b = await render(variant, {
    specialSectionOrder: ["references", "language", "skills", "education", "experience"],
  });
  check(variant, pdfText(a) !== pdfText(b), "reordering had no effect");
}
done("section order honored");

/* ------------------------------------------------------------------ *
 * 6. type is drawn at the same scale as the preview
 *
 * The preview draws A4 at 96dpi (794px wide); the PDF page is 595.28pt.
 * If font size converts on any other ratio the text is a different
 * fraction of the page than the preview shows, lines wrap elsewhere, and
 * no amount of spacing tuning makes the two match. A stray ratio here is
 * what made PDF text 8% small, so assert it against the real geometry.
 * ------------------------------------------------------------------ */
console.log("\ntype scale matches the preview");
{
  const PREVIEW_A4_PX = 794; // RESUME_PREVIEW_NATIVE_WIDTH
  const PDF_A4_PT = 595.28;
  const expectedScale = PDF_A4_PT / PREVIEW_A4_PX;

  const { FONT_SIZE_RATIO, PX_TO_PT } = await vite.ssrLoadModule(
    "/src/components/resume/pdf/pdfTheme.ts",
  );
  check(
    "font ratio equals the page scale",
    Math.abs(FONT_SIZE_RATIO - expectedScale) < 0.005,
    `ratio ${FONT_SIZE_RATIO.toFixed(4)} vs page scale ${expectedScale.toFixed(4)}`,
  );
  check(
    "type and spacing share one scale",
    FONT_SIZE_RATIO === PX_TO_PT,
    `FONT_SIZE_RATIO ${FONT_SIZE_RATIO} !== PX_TO_PT ${PX_TO_PT}`,
  );

  // and confirm it survives into the file: the body size react-pdf emits
  const fontSizePx = DEMO_RESUME.customization.fontSize;
  const buf = await render("ribbonFold");
  const lat = buf.toString("latin1");
  const streamRe = /\/Filter\s*\/FlateDecode[\s\S]{0,120}?stream\r?\n/g;
  const emitted = new Set();
  let sm;
  while ((sm = streamRe.exec(lat)) !== null) {
    const start = sm.index + sm[0].length;
    const end = lat.indexOf("endstream", start);
    if (end === -1) continue;
    try {
      const text = inflateSync(buf.subarray(start, end)).toString("latin1");
      for (const f of text.matchAll(/\/F\d+ ([\d.]+) Tf/g)) {
        emitted.add(Number(f[1]));
      }
    } catch {
      /* not a content stream */
    }
  }
  // the 0.9em job/education body text is the most common run
  const expectedBody = fontSizePx * expectedScale * 0.9;
  const near = [...emitted].some((v) => Math.abs(v - expectedBody) < 0.15);
  check(
    "emitted body size matches",
    near,
    `expected ~${expectedBody.toFixed(2)}pt, got ${[...emitted]
      .sort((a, b) => a - b)
      .map((v) => v.toFixed(2))
      .join(", ")}`,
  );
}
done("type scale matches the preview");

/* ------------------------------------------------------------------ *
 * 7. every contact field gets its own icon
 *
 * The premium previews used to branch on phone/email/location and fall
 * through to a globe, so nationality, passport and every link (GitHub,
 * GitLab, portfolio...) all drew the same glyph.
 * ------------------------------------------------------------------ */
console.log("\ncontact icons");
{
  const { personalContactLines } = await vite.ssrLoadModule(
    "/src/components/resume/layouts/shared.tsx",
  );
  const { contactIconKey } = await vite.ssrLoadModule(
    "/src/lib/resumeIcons.ts",
  );

  const link = (id, title, url) => [{ id, title, url }];
  const personal = {
    ...DEMO_RESUME.personal,
    phone: "+855 12 345 678",
    email: "a@b.com",
    location: "Phnom Penh",
    nationality: "Khmer",
    passportId: "1234",
    website: link("w", "site", "example.com"),
    linkedin: link("li", "LinkedIn", "linkedin.com/in/x"),
    portfolio: link("pf", "Portfolio", "example.com/pf"),
    github: link("gh", "GitHub", "github.com/x"),
    gitlab: link("gl", "GitLab", "gitlab.com/x"),
    stackoverflow: link("so", "Stack Overflow", "stackoverflow.com/u/1"),
    telegram: link("tg", "Telegram", "t.me/x"),
  };

  const expected = {
    phone: "phone",
    email: "mail",
    location: "pin",
    nationality: "flag",
    passport: "id",
    "website-w": "globe",
    "linkedin-li": "linkedin",
    "portfolio-pf": "briefcase",
    "github-gh": "github",
    "gitlab-gl": "gitlab",
    "stackoverflow-so": "stackoverflow",
    "telegram-tg": "send",
  };

  const lines = personalContactLines(personal);
  for (const [id, want] of Object.entries(expected)) {
    const item = lines.find((l) => l.id === id);
    check(
      `${id} -> ${want}`,
      item && contactIconKey(item) === want,
      item ? `got "${contactIconKey(item)}"` : "row missing entirely",
    );
  }
  const keys = lines.map((l) => contactIconKey(l));
  check(
    "no two fields share a glyph",
    new Set(keys).size === keys.length,
    `${keys.length} rows but ${new Set(keys).size} distinct icons: ${keys.join(", ")}`,
  );
}
done("contact icons");

/* ------------------------------------------------------------------ *
 * 8. the header name and job title are drawn at preview size, clear of
 *    each other
 *
 * The px sizes used to reach react-pdf as pt, and an inherited lineHeight
 * left the name in a box too short to hold it, so its descenders landed in
 * the job title. Assert both against the drawn geometry.
 * ------------------------------------------------------------------ */
console.log("\nheader name and title");
{
  const { PX_TO_PT } = await vite.ssrLoadModule(
    "/src/components/resume/pdf/pdfTheme.ts",
  );
  const c = DEMO_RESUME.customization;
  // graphicPro steps the name down to fit its rail and executiveCard sets the
  // title at body size - both of those are what their previews do
  const namePx = { graphicPro: c.fullNameSize * 0.86 };
  const titlePx = { executiveCard: c.fontSize };
  const fullName = DEMO_RESUME.personal.fullName.toLowerCase();
  const jobTitle = DEMO_RESUME.personal.jobTitle.toLowerCase();

  for (const variant of VARIANTS) {
    const runs = pdfRuns(await render(variant));
    // the narrow-rail layouts wrap the name and the title over two lines, and
    // executiveCard splits first/last - so match any fragment of them
    const fragments = (whole) => (r) =>
      r.text.trim().length > 2 && whole.includes(r.text.trim().toLowerCase());
    const nameRuns = runs.filter(fragments(fullName));
    const biggest = Math.max(...nameRuns.map((r) => r.size), 0);
    const name = nameRuns.filter((r) => r.size === biggest);
    const first = name[0];
    const last = name[name.length - 1];
    // the demo's current job is also "Marketing Executive", so take the
    // header's title to be the matching run nearest below the name
    const title = runs
      .filter(fragments(jobTitle))
      .filter((r) => first && r.page === first.page && r.y > last.y)
      .sort((a, b) => a.y - b.y)[0];

    const wantName = (namePx[variant] ?? c.fullNameSize) * PX_TO_PT;
    const wantTitle = (titlePx[variant] ?? c.titleSize) * PX_TO_PT;
    check(
      `${variant}: name at preview size`,
      first && Math.abs(first.size - wantName) < 0.15,
      first
        ? `${first.size.toFixed(2)}pt, expected ${wantName.toFixed(2)}pt`
        : "no name drawn",
    );
    check(
      `${variant}: title at preview size`,
      title && Math.abs(title.size - wantTitle) < 0.15,
      title
        ? `${title.size.toFixed(2)}pt, expected ${wantTitle.toFixed(2)}pt`
        : "no job title drawn",
    );

    // the name's descenders against the title's cap line
    if (last && title) {
      const nameBottom = last.y + last.size * 0.25;
      const titleTop = title.y - title.size * 0.72;
      check(
        `${variant}: name clears the title`,
        nameBottom <= titleTop,
        `name reaches ${nameBottom.toFixed(1)}pt, title starts ${titleTop.toFixed(1)}pt`,
      );
    }
  }
}
done("header name and title");

await vite.close();


console.log(`\n${pass} passed, ${fail} failed`);
console.log(`PDFs for eyeballing: ${outDir}`);
process.exit(fail ? 1 : 0);
