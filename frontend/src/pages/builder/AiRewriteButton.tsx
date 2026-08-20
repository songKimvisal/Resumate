import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";

/**
 * Purely a trigger button - loading/suggestions state lives in the
 * useSmartRewrite hook, owned by whichever Step component uses this, so
 * that component can place the SmartRewriteSuggestions panel wherever
 * makes sense in its own layout (below the whole field, not next to the
 * button).
 */
export function AiRewriteButton({
  loading,
  disabled,
  onClick,
  size = "sm",
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  size?: "xs" | "sm";
}) {
  const { t } = useTranslation();

  return (
    <Button size={size} disabled={disabled || loading} onClick={onClick}>
      <Sparkles size={14} className={loading ? "animate-pulse" : undefined} />
      {loading ? t("builder.personal.aiRewriting") : t("builder.personal.aiRewrite")}
    </Button>
  );
}
