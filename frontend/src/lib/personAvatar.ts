/** Geometric person avatar used in template previews and empty photo slots. */

export function personAvatarDataUrl(bg = "#0F2942") {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
    `<rect width="200" height="200" fill="${bg}"/>` +
    `<circle cx="100" cy="72" r="38" fill="#EEF3F6"/>` +
    `<path d="M28 200c4-50 34-76 72-76s68 26 72 76" fill="#EEF3F6"/>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/** Photo URL, or a plain person icon when none is uploaded. */
export function resumePhotoSrc(personal: { photoUrl?: string }) {
  if (personal.photoUrl) return personal.photoUrl;
  return personAvatarDataUrl();
}
