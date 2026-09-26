import { requestBackend } from "./client";

/** Signed and priced by the server. */
export function createPaywayCheckout(params: {
  packId: string;
  packName: string;
}) {
  return requestBackend<{
    tran_id: string;
    action_url: string;
    fields: Record<string, string>;
  }>("/api/payments/payway/create", {
    method: "POST",
    body: {
      pack_id: params.packId,
      pack_name: params.packName,
    },
  });
}

export function getPaywayStatus(tranId: string) {
  return requestBackend<{
    status: "pending" | "paid" | "declined" | "cancelled";
    fulfilled: boolean;
  }>(`/api/payments/payway/status/${tranId}`);
}

// PayWay's plugin (same URL for sandbox and production). Its global is not on `window`.
const PLUGIN_URL = "https://checkout.payway.com.kh/plugins/checkout2-0.js";
const PLUGIN_TIMEOUT_MS = 10000;
declare const AbaPayway:
  | {
      checkout: () => void;
      addCard: () => void;
      closeCheckoutByContinueUrl: () => void;
      closeCheckout: (isAsk: boolean) => void;
    }
  | undefined;

const pluginReady = () => typeof AbaPayway !== "undefined";

/** Fired when the shopper closes PayWay's popup. */
export const PAYWAY_CLOSED_EVENT = "payway:closed";

let closePatched = false;

/** Replaces the plugin's close, which shows a native confirm and reloads. */
function patchCloseButton() {
  if (closePatched || !pluginReady()) return;
  closePatched = true;
  const pluginClose = AbaPayway!.closeCheckout.bind(AbaPayway);
  AbaPayway!.closeCheckout = (isAsk: boolean) => {
    if (!isAsk) {
      pluginClose(isAsk);
      return;
    }
    const container = document.getElementById("aba-checkout");
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
      container.classList.remove("aba-checkout-desktop");
    }
    document.body.style.overflowY = "";
    window.dispatchEvent(new Event(PAYWAY_CLOSED_EVENT));
  };
}

let pluginPromise: Promise<boolean> | null = null;

/** Loads the plugin once. Resolves false if it never becomes usable. */
export function loadPaywayPlugin(): Promise<boolean> {
  if (pluginReady()) {
    patchCloseButton();
    return Promise.resolve(true);
  }
  if (pluginPromise) return pluginPromise;
  pluginPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = PLUGIN_URL;
    script.onerror = () => {
      pluginPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
    // The real plugin loads about a second later.
    const startedAt = Date.now();
    const poll = window.setInterval(() => {
      if (pluginReady()) {
        window.clearInterval(poll);
        patchCloseButton();
        resolve(true);
      } else if (Date.now() - startedAt > PLUGIN_TIMEOUT_MS) {
        window.clearInterval(poll);
        pluginPromise = null;
        resolve(false);
      }
    }, 100);
  });
  return pluginPromise;
}

// The plugin looks up its form by id.
type PluginForm = "aba_merchant_request" | "aba_merchant_add_card";

function buildForm(
  formId: PluginForm,
  actionUrl: string,
  fields: Record<string, string>,
  target: string,
) {
  document.getElementById(formId)?.remove();
  const form = document.createElement("form");
  form.id = formId;
  form.method = "POST";
  form.action = actionUrl;
  form.enctype = "multipart/form-data";
  form.target = target;
  form.hidden = true;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  return form;
}

/** PayWay returns the shopper to /billing/payment?payway=<tran_id>. */
export async function openPaywayCheckout(
  actionUrl: string,
  fields: Record<string, string>,
) {
  if (await loadPaywayPlugin()) {
    buildForm("aba_merchant_request", actionUrl, fields, "aba_webservice");
    AbaPayway!.checkout();
    return;
  }
  // No plugin: fall back to PayWay's full-page view.
  buildForm(
    "aba_merchant_request",
    actionUrl,
    { ...fields, view_type: "hosted_view" },
    "_self",
  ).submit();
}

/** The caller polls the server to learn when the card is saved. */
export async function openPaywayLinkCard(
  actionUrl: string,
  fields: Record<string, string>,
) {
  if (await loadPaywayPlugin()) {
    buildForm("aba_merchant_add_card", actionUrl, fields, "aba_webservice");
    AbaPayway!.addCard();
    return;
  }
  buildForm("aba_merchant_add_card", actionUrl, fields, "_self").submit();
}

export function closePaywayModal() {
  if (pluginReady()) AbaPayway!.closeCheckoutByContinueUrl();
}
