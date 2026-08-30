import { requestBackend } from "./client";
import { isPackId, packToPlanId, type PackId } from "../../types/billing";
import { useEntitlementStore } from "../../store/entitlementStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";

export interface TemplateEntitlements {
  packId: PackId | null;
  templateSlots: number;
  unlockedTemplateIds: string[];
}

type ApiEntitlements = {
  pack_id?: string | null;
  template_slots?: number;
  unlocked_template_ids?: string[];
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
  };
}

export function applyTemplateEntitlements(data: TemplateEntitlements) {
  useEntitlementStore.getState().setEntitlements(
    data.unlockedTemplateIds,
    data.templateSlots,
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
