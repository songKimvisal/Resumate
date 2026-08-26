import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAiCredits } from "../../hooks/useAiCredits";
import UpgradePlanModal from "../billing/UpgradePlanModal";

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
  const navigate = useNavigate();
  const { remaining } = useAiCredits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const outOfCredits = remaining <= 0;

  const handleClick = () => {
    if (outOfCredits) {
      setUpgradeOpen(true);
      return;
    }
    onClick();
  };

  const label = loading
    ? t("builder.personal.aiRewriting")
    : outOfCredits
      ? t("builder.personal.aiRewriteBuy")
      : t("builder.personal.aiRewrite");

  return (
    <>
      <Button
        size={size}
        disabled={outOfCredits ? false : disabled || loading}
        onClick={handleClick}
        aria-label={
          outOfCredits
            ? t("builder.personal.aiRewriteBuy")
            : t("builder.personal.aiRewriteWithCount", { count: remaining })
        }
      >
        <Sparkles size={14} className={loading ? "animate-pulse" : undefined} />
        {label}
        {!loading && !outOfCredits && (
          <span className="tabular-nums rounded-full bg-white/20 px-1.5 py-px text-[10px] font-semibold leading-none">
            {remaining}
          </span>
        )}
      </Button>
      <UpgradePlanModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSelectPack={(packId) => {
          setUpgradeOpen(false);
          navigate("/billing/payment", { state: { pack: packId } });
        }}
      />
    </>
  );
}
