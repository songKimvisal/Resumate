import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  luhnCheck,
} from "../lib/cardFormat";
import type { SavedCard } from "../store/paymentMethodStore";

type Field = "name" | "number" | "expiry" | "cvc";

export function useCardForm() {
  const { t } = useTranslation();
  const [cardName, setCardNameRaw] = useState("");
  const [cardNumber, setCardNumberRaw] = useState("");
  const [cardExpiry, setCardExpiryRaw] = useState("");
  const [cardCvc, setCardCvcRaw] = useState("");
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    number: false,
    expiry: false,
    cvc: false,
  });

  const setCardName = (value: string) => setCardNameRaw(value);
  const setCardNumber = (value: string) =>
    setCardNumberRaw(formatCardNumber(value));
  const setCardExpiry = (value: string) =>
    setCardExpiryRaw(formatExpiry(value));
  const setCardCvc = (value: string) =>
    setCardCvcRaw(value.replace(/\D/g, "").slice(0, 4));

  const touch = (field: Field) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  const cardDigits = cardNumber.replace(/\s/g, "");
  const brand = cardDigits.length >= 2 ? detectCardBrand(cardDigits) : "Card";

  const nameValid = cardName.trim().length >= 2 && /[A-Za-z]/.test(cardName);
  const numberValid = cardDigits.length === 16 && luhnCheck(cardDigits);
  const expiryValid = isExpiryValid(cardExpiry);
  const cvcValid = cardCvc.length >= 3 && cardCvc.length <= 4;

  const isValid = nameValid && numberValid && expiryValid && cvcValid;

  const errors = {
    name:
      touched.name && cardName.length > 0 && !nameValid
        ? t("billing.paymentMethod.card.invalidName")
        : undefined,
    number:
      touched.number && cardDigits.length > 0 && !numberValid
        ? t("billing.paymentMethod.card.invalidNumber")
        : undefined,
    expiry:
      touched.expiry && cardExpiry.length > 0 && !expiryValid
        ? t("billing.paymentMethod.card.invalidExpiry")
        : undefined,
    cvc:
      touched.cvc && cardCvc.length > 0 && !cvcValid
        ? t("billing.paymentMethod.card.invalidCvc")
        : undefined,
  };

  const reset = () => {
    setCardNameRaw("");
    setCardNumberRaw("");
    setCardExpiryRaw("");
    setCardCvcRaw("");
    setTouched({ name: false, number: false, expiry: false, cvc: false });
  };

  const toSavedCard = (): SavedCard => ({
    brand: detectCardBrand(cardDigits),
    last4: cardDigits.slice(-4),
    expiry: cardExpiry,
  });

  return {
    cardName,
    setCardName,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardDigits,
    brand,
    isValid,
    errors,
    touch,
    reset,
    toSavedCard,
  };
}
