import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ChevronRight,
  LayoutTemplate,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { downloadReceiptPdf } from "../../lib/downloadReceiptPdf";
import { getPaymentHistory, type PaymentRecord } from "../../lib/api/payments";

type Category = "all" | "template" | "ai" | "both";

type Transaction = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  date: string;
  time: string;
  amount: number;
  paidVia: string;
  transactionId: string;
};

const STATS = {
  memberSince: "Apr 2026",
  renewal: "Never",
};

const FILTERS: Category[] = ["all", "template", "ai", "both"];

function categoryForPack(packId: string): Exclude<Category, "all"> {
  if (packId === "design") return "template";
  if (packId.startsWith("ai-")) return "ai";
  return "both";
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function toTransaction(record: PaymentRecord): Transaction {
  const { date, time } = formatDateTime(record.created_at);
  return {
    id: record.id,
    category: categoryForPack(record.pack_id),
    title: record.pack_name,
    date,
    time,
    amount: record.amount_cents / 100,
    paidVia: record.provider === "khqr" ? "Bakong KHQR" : "Stripe",
    transactionId:
      record.external_transaction_id ?? record.id.slice(0, 10).toUpperCase(),
  };
}

const CATEGORY_ICON: Record<Exclude<Category, "all">, typeof Sparkles> = {
  template: LayoutTemplate,
  ai: Sparkles,
  both: Layers,
};

export default function BillingHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentHistory()
      .then((res) => setTransactions(res.payments.map(toTransaction)))
      .catch((err) => console.warn("Could not load billing history:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((tx) => tx.category === filter);

  const totalPaid = transactions
    .reduce((sum, tx) => sum + tx.amount, 0)
    .toFixed(2);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Button
        size="compact"
        variant="default"
        className="mb-6"
        onClick={() => navigate("/billing")}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        {t("billingHistory.back")}
      </Button>

      <h1 className="text-3xl font-bold">
        <span className="text-text">{t("billingHistory.title")}</span>{" "}
        <span className="text-brand italic">
          {t("billingHistory.titleAccent")}
        </span>
      </h1>
      <p className="text-sm text-text-secondary mt-2">
        {t("billingHistory.subtitle")}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-sm text-text-secondary">
            {t("billingHistory.stats.totalPaid")}
          </p>
          <p className="mt-1 text-xl font-bold text-text">${totalPaid}</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-sm text-text-secondary">
            {t("billingHistory.stats.memberSince")}
          </p>
          <p className="mt-1 text-xl font-bold text-text">
            {STATS.memberSince}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-sm text-text-secondary">
            {t("billingHistory.stats.renewal")}
          </p>
          <p className="mt-1 text-xl font-bold text-text">{STATS.renewal}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors",
              filter === key
                ? "border-brand bg-brand text-white"
                : "border-line text-text-secondary hover:bg-surface-2 hover:text-text",
            )}
          >
            {t(`billingHistory.filters.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 w-full max-w-2xl rounded-2xl border border-line overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-text-secondary text-center">
            {t("billingHistory.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary text-center">
            {t("billingHistory.empty")}
          </p>
        ) : (
          filtered.map((tx, i) => {
            const Icon = CATEGORY_ICON[tx.category];
            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => setSelected(tx)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-surface-2 transition-colors",
                  i > 0 && "border-t border-line",
                )}
              >
                <span className="text-brand inline-flex items-center justify-center shrink-0">
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text">{tx.title}</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {tx.date} · {tx.time}
                  </p>
                </div>
                <span className="font-bold text-brand shrink-0">
                  - ${tx.amount.toFixed(2)}
                </span>
                <ChevronRight
                  size={18}
                  className="text-text-secondary shrink-0"
                />
              </button>
            );
          })
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-2xl bg-bg p-6 shadow-xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text">
                  {t("billingHistory.receipt.title")}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={t("billingHistory.receipt.close")}
                  className="size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <p className="mt-4 text-3xl font-extrabold text-brand">
                - ${selected.amount.toFixed(2)}
              </p>

              <div className="mt-4 space-y-1">
                {[
                  [
                    t(`billingHistory.receipt.itemLabel.${selected.category}`),
                    selected.title,
                  ],
                  [
                    t("billingHistory.receipt.date"),
                    `${selected.date}, ${selected.time}`,
                  ],
                  [t("billingHistory.receipt.paid"), selected.paidVia],
                  [
                    t("billingHistory.receipt.transactionId"),
                    selected.transactionId,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-line last:border-b-0"
                  >
                    <span className="text-sm text-text-secondary">{label}</span>
                    <span className="text-sm font-medium text-text">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="mt-6 w-full"
                onClick={() => downloadReceiptPdf(selected)}
              >
                {t("billingHistory.receipt.downloadPdf")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
