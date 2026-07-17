import { Text, Link, View } from "@react-pdf/renderer";
import { pdfFontVariants, type PdfFontFamily } from "./fonts";

/** Tiptap's "empty" output is still a non-empty string like "<p></p>" */
export function hasVisibleText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

/** Converts one inline node (text, <strong>, <em>, <u>, <a>, <br>) into
 *  nested react-pdf <Text>/<Link> elements. Callers only pass inline content. */
function renderInline(
  node: ChildNode,
  key: React.Key,
  fontFamily: PdfFontFamily,
): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return "\n";

  const children = Array.from(el.childNodes).map((child, i) =>
    renderInline(child, i, fontFamily),
  );
  const variants = pdfFontVariants(fontFamily);

  switch (tag) {
    case "strong":
    case "b":
      return (
        <Text key={key} style={{ fontFamily: variants.bold }}>
          {children}
        </Text>
      );
    case "em":
    case "i":
      return (
        <Text key={key} style={{ fontFamily: variants.italic }}>
          {children}
        </Text>
      );
    case "u":
      return (
        <Text key={key} style={{ textDecoration: "underline" }}>
          {children}
        </Text>
      );
    case "a":
      return (
        <Link
          key={key}
          src={el.getAttribute("href") || undefined}
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          {children}
        </Link>
      );
    default:
      return <Text key={key}>{children}</Text>;
  }
}

type RichTextOptions = {
  fontSize: number;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  fontFamily?: PdfFontFamily;
  lineHeight?: number;
};

/** Converts Tiptap HTML (paragraphs, lists, bold/italic/underline/links)
 *  into react-pdf block elements: one <Text> per paragraph, one row per
 *  list item. Unknown block tags render as a plain paragraph. */
export function richTextToPdf(
  html: string,
  {
    fontSize,
    color,
    align = "left",
    fontFamily = "Helvetica",
    lineHeight,
  }: RichTextOptions,
): React.ReactNode[] {
  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks: React.ReactNode[] = [];

  Array.from(container.children).forEach((node, i) => {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const textAlign =
      (el.style.textAlign as RichTextOptions["align"]) || align;

    if (tag === "ul" || tag === "ol") {
      Array.from(el.children).forEach((li, j) => {
        const inline = Array.from(li.childNodes).map((c, k) =>
          renderInline(c, k, fontFamily),
        );
        blocks.push(
          <View
            key={`${i}-${j}`}
            style={{
              flexDirection: "row",
              marginTop: i === 0 && j === 0 ? 0 : 2,
            }}
          >
            <Text style={{ width: 10, fontSize, color, lineHeight }}>
              {tag === "ol" ? `${j + 1}.` : "•"}
            </Text>
            <Text style={{ flex: 1, fontSize, color, lineHeight }}>
              {inline}
            </Text>
          </View>,
        );
      });
    } else {
      const inline = Array.from(el.childNodes).map((c, k) =>
        renderInline(c, k, fontFamily),
      );
      blocks.push(
        <Text
          key={i}
          style={{
            fontSize,
            color,
            textAlign,
            lineHeight,
            marginTop: i === 0 ? 0 : 4,
          }}
        >
          {inline}
        </Text>,
      );
    }
  });

  return blocks;
}
