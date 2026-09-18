export type IconKey =
  | "phone"
  | "mail"
  | "pin"
  | "flag"
  | "briefcase"
  | "globe"
  | "linkedin"
  | "github"
  | "gitlab"
  | "stackoverflow"
  | "send"
  | "id"
  | "fileText"
  | "graduationCap"
  | "sparkles"
  | "languages"
  | "users"
  | "user"
  | "contact"
  | "link";

export type IconShape =
  | { type: "path"; d: string }
  | { type: "circle"; cx: string; cy: string; r: string }
  | {
      type: "rect";
      x: string;
      y: string;
      width: string;
      height: string;
      rx?: string;
    };

export const ICON_SHAPES: Record<IconKey, IconShape[]> = {
  phone: [
    {
      type: "path",
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
    },
  ],
  mail: [
    { type: "path", d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" },
    { type: "rect", x: "2", y: "4", width: "20", height: "16", rx: "2" },
  ],
  pin: [
    {
      type: "path",
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
    },
    { type: "circle", cx: "12", cy: "10", r: "3" },
  ],
  flag: [
    {
      type: "path",
      d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
    },
  ],
  briefcase: [
    { type: "path", d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
    { type: "rect", x: "2", y: "6", width: "20", height: "14", rx: "2" },
  ],
  globe: [
    { type: "circle", cx: "12", cy: "12", r: "10" },
    { type: "path", d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" },
    { type: "path", d: "M2 12h20" },
  ],
  linkedin: [
    { type: "path", d: "M16 2v2" },
    { type: "path", d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" },
    { type: "path", d: "M8 2v2" },
    { type: "circle", cx: "12", cy: "11", r: "3" },
    { type: "rect", x: "3", y: "4", width: "18", height: "18", rx: "2" },
  ],
  github: [
    { type: "path", d: "m10 9-3 3 3 3" },
    { type: "path", d: "m14 15 3-3-3-3" },
    { type: "rect", x: "3", y: "3", width: "18", height: "18", rx: "2" },
  ],
  gitlab: [
    { type: "path", d: "M15 6a9 9 0 0 0-9 9V3" },
    { type: "circle", cx: "18", cy: "6", r: "3" },
    { type: "circle", cx: "6", cy: "18", r: "3" },
  ],
  stackoverflow: [
    {
      type: "path",
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
    },
  ],
  send: [
    {
      type: "path",
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
    },
    { type: "path", d: "m21.854 2.147-10.94 10.939" },
  ],
  id: [
    { type: "path", d: "M16 10h2" },
    { type: "path", d: "M16 14h2" },
    { type: "path", d: "M6.17 15a3 3 0 0 1 5.66 0" },
    { type: "circle", cx: "9", cy: "11", r: "2" },
    { type: "rect", x: "2", y: "5", width: "20", height: "14", rx: "2" },
  ],
  fileText: [
    {
      type: "path",
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
    },
    { type: "path", d: "M14 2v5a1 1 0 0 0 1 1h5" },
    { type: "path", d: "M10 9H8" },
    { type: "path", d: "M16 13H8" },
    { type: "path", d: "M16 17H8" },
  ],
  graduationCap: [
    {
      type: "path",
      d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
    },
    { type: "path", d: "M22 10v6" },
    { type: "path", d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" },
  ],
  sparkles: [
    {
      type: "path",
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
    },
    { type: "path", d: "M20 2v4" },
    { type: "path", d: "M22 4h-4" },
    { type: "circle", cx: "4", cy: "20", r: "2" },
  ],
  languages: [
    { type: "path", d: "m5 8 6 6" },
    { type: "path", d: "m4 14 6-6 2-3" },
    { type: "path", d: "M2 5h12" },
    { type: "path", d: "M7 2h1" },
    { type: "path", d: "m22 22-5-10-5 10" },
    { type: "path", d: "M14 18h6" },
  ],
  users: [
    { type: "path", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
    { type: "path", d: "M16 3.128a4 4 0 0 1 0 7.744" },
    { type: "path", d: "M22 21v-2a4 4 0 0 0-3-3.87" },
    { type: "circle", cx: "9", cy: "7", r: "4" },
  ],
  user: [
    { type: "path", d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" },
    { type: "circle", cx: "12", cy: "7", r: "4" },
  ],
  contact: [
    { type: "path", d: "M16 2v2" },
    { type: "path", d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" },
    { type: "path", d: "M8 2v2" },
    { type: "circle", cx: "12", cy: "11", r: "3" },
    { type: "rect", x: "3", y: "4", width: "18", height: "18", rx: "2" },
  ],
  link: [
    {
      type: "path",
      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    },
    {
      type: "path",
      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    },
  ],
};

/** Icon for one contact row. Mirrors `buildContactItems` in ResumeDocument,
 *  so the default layout, the premium previews and every PDF agree on which
 *  glyph a field gets - nationality is a flag, an ID is a card, and each link
 *  shows its own service rather than a catch-all globe. */
/** Icon for one contact row. Mirrors `buildContactItems` in ResumeDocument,
 *  so the default layout, the premium previews and every PDF agree on which
 *  glyph a field gets - nationality is a flag, an ID is a card, and each link
 *  shows its own service rather than a catch-all globe.
 *
 *  Takes the two fields it needs rather than `ContactLineItem`, so the icon
 *  table stays free of any dependency on the layout components. */
export function contactIconKey(item: {
  kind: string;
  field?: string;
}): IconKey {
  switch (item.kind) {
    case "phone":
      return "phone";
    case "email":
      return "mail";
    case "location":
      return "pin";
    case "nationality":
      return "flag";
    case "passport":
      return "id";
  }
  switch (item.field) {
    case "portfolio":
      return "briefcase";
    case "website":
      return "globe";
    case "linkedin":
      return "linkedin";
    case "github":
      return "github";
    case "gitlab":
      return "gitlab";
    case "stackoverflow":
      return "stackoverflow";
    case "telegram":
      return "send";
    default:
      return "link";
  }
}
