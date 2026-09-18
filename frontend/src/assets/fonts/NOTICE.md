# Bundled fonts

These are vendored (not npm dependencies) so the HTML preview and the
generated PDF can load the *same* files. react-pdf reads TrueType only - it
cannot use woff/woff2 - which is why these are `.ttf` rather than a
@fontsource package, and why the preview self-hosts them too instead of
pulling woff2 from the Google Fonts CDN. Two renderers loading one file is
the only way the letterforms, and therefore the line breaks, can match.

Static faces are used deliberately: a variable TTF registered twice does not
give react-pdf a real 700 weight (see registerPdfFonts.ts).

| Family | Faces | Licence | Upstream |
| --- | --- | --- | --- |
| Inter | Regular, Bold, Italic | SIL Open Font License 1.1 | https://github.com/rsms/inter |
| Roboto | Regular, Bold, Italic | Apache License 2.0 | https://fonts.google.com/specimen/Roboto |
| Poppins | Regular, Bold, Italic | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Poppins |
| Lato | Regular, Bold, Italic | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Lato |
| Merriweather | Regular, Bold, Italic | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Merriweather |
| Kantumruy Pro | Regular, Bold | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Kantumruy+Pro |
| Battambang | Regular, Bold | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Battambang |
| Hanuman | Regular, Bold | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Hanuman |
| Nokora | Regular, Bold | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nokora |

Both licences permit redistribution inside an application. Keep this file
with the fonts, and keep the copyright notices intact in the font binaries.

## Khmer faces

Offered only when the resume language is Khmer, and the Latin families only
when it is English.

None of them carries all the punctuation this app prints - every one lacks the
square bullet - so Inter is stacked behind them for those code points, in the
CSS fallback chain and in `pdfFontVariants`.

Two were tried and rejected: **Noto Serif Khmer** crashes fontkit while
positioning marks, and **Noto Sans Khmer** extracts scrambled text from the
finished PDF, which would break copy-paste and ATS parsing.

"Georgia" in the font picker is a system font and is not bundled; the PDF
substitutes Times-Roman for it, which is the closest built-in serif.
