import { useTranslation } from "react-i18next";
import type { NeedId, PackId } from "../types/billing";

export interface PurchasePack {
  id: PackId;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const AI_PACK_IDS: PackId[] = ["ai-basic", "ai-plus", "ai-pro"];
const BOTH_PACK_IDS: PackId[] = [
  "both-starter",
  "both-standard",
  "both-everything",
];

type RawPack = {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

export function usePacks() {
  const { t } = useTranslation();

  const design: PurchasePack = {
    id: "design",
    name: t("home.pricing.design.name"),
    price: t("home.pricing.design.price"),
    period: t("home.pricing.design.period"),
    features: [t("home.pricing.design.desc")],
    cta: t("home.pricing.design.cta"),
    popular: true,
  };

  const ai = (
    t("home.pricing.ai.packs", { returnObjects: true }) as RawPack[]
  ).map((pack, i) => ({ ...pack, id: AI_PACK_IDS[i] }));

  const both = (
    t("home.pricing.both.packs", { returnObjects: true }) as RawPack[]
  ).map((pack, i) => ({ ...pack, id: BOTH_PACK_IDS[i] }));

  const byNeed: Record<NeedId, PurchasePack[]> = {
    design: [design],
    ai,
    both,
  };

  return {
    design,
    ai,
    both,
    byNeed,
    all: [design, ...ai, ...both],
  };
}
