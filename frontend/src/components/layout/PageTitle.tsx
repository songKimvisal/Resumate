export const PAGE_TITLE_CLASS = "text-3xl font-bold leading-tight";
export const PAGE_TITLE_ACCENT_CLASS = "break-words italic text-brand";

type PageTitleProps = {
  text: string;
  accent?: string;
};

/** Dashboard page titles: black + primary italic, same size everywhere. */
export default function PageTitle({ text, accent }: PageTitleProps) {
  const accentText = accent?.trim();
  return (
    <h1 className={PAGE_TITLE_CLASS}>
      <span className="text-text">{text}</span>
      {accentText ? (
        <>
          {" "}
          <span className={PAGE_TITLE_ACCENT_CLASS}>{accentText}</span>
        </>
      ) : null}
    </h1>
  );
}
