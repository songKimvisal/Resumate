import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";

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
