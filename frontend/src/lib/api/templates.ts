import { requestBackend } from "./client";
import { isPackId, packToPlanId, type PackId } from "../../types/billing";
import { useEntitlementStore } from "../../store/entitlementStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";

export interface TemplateEntitlements {
  packId: PackId | null;
  templateSlots: number;
  unlockedTemplateIds: string[];
  ownedTemplateIds: string[];
  customizationUnlocked: boolean;
}

type ApiEntitlements = {
  pack_id?: string | null;
  template_slots?: number;
  unlocked_template_ids?: string[];
  premium_templates_owned?: string[];
  customization_unlocked?: boolean;
};

function fromApi(data: ApiEntitlements): TemplateEntitlements {
  return {
    packId: isPackId(data.pack_id) ? data.pack_id : null,
    templateSlots:
      typeof data.template_slots === "number" ? data.template_slots : 0,
    unlockedTemplateIds: Array.isArray(data.unlocked_template_ids)
      ? data.unlocked_template_ids.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    ownedTemplateIds: Array.isArray(data.premium_templates_owned)
      ? data.premium_templates_owned.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    customizationUnlocked: data.customization_unlocked === true,
  };
}

export function applyTemplateEntitlements(data: TemplateEntitlements) {
  useEntitlementStore.getState().setEntitlements(
    data.unlockedTemplateIds,
    data.templateSlots,
    data.ownedTemplateIds,
    data.customizationUnlocked,
  );
  if (data.packId) {
    useSubscriptionStore
      .getState()
      .subscribeToPlan(packToPlanId(data.packId), data.packId);
  }
}

export async function getTemplateEntitlements() {
  const data = await requestBackend<ApiEntitlements>("/api/templates");
  return fromApi(data);
}

export async function grantTemplatePack(
  packId: PackId,
  templateId?: string | null,
) {
  const data = await requestBackend<ApiEntitlements>("/api/templates/grant", {
    method: "POST",
    body: {
      pack_id: packId,
      template_id: templateId ?? null,
    },
  });
  const entitlements = fromApi(data);
  applyTemplateEntitlements(entitlements);
  return entitlements;
}

export async function unlockPremiumTemplate(templateId: string) {
  const data = await requestBackend<ApiEntitlements>("/api/templates/unlock", {
    method: "POST",
    body: { template_id: templateId },
  });
  const entitlements = fromApi(data);
  applyTemplateEntitlements(entitlements);
  return entitlements;
}

/** Flat $1 purchase: unlocks colors/fonts/layout on free templates. Call
 * only after the payment has been recorded. */
export async function unlockCustomization() {
  const data = await requestBackend<ApiEntitlements>(
    "/api/templates/unlock-customization",
    { method: "POST" },
  );
  const entitlements = fromApi(data);
  applyTemplateEntitlements(entitlements);
  return entitlements;
}

/** Flat $1.99 purchase: owns this one premium template outright, with its
 * own customization, independent of pack slots. Call only after the
 * payment has been recorded. */
export async function purchasePremiumTemplate(templateId: string) {
  const data = await requestBackend<ApiEntitlements>("/api/templates/purchase", {
    method: "POST",
    body: { template_id: templateId },
  });
  const entitlements = fromApi(data);
  applyTemplateEntitlements(entitlements);
  return entitlements;
}
