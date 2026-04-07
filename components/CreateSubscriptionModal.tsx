import { icons } from "@/constants/icons";
import { posthog } from "@/lib/posthog";
import clsx from "clsx";
import dayjs from "dayjs";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#c4d4f0",
  Music: "#e8b8d4",
  Other: "#e8e4dc",
};

type Frequency = "Monthly" | "Yearly";

function parsePrice(raw: string): number | null {
  const n = Number.parseFloat(raw.trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function newSubscriptionId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `sub-${Date.now()}`;
}

export type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Other");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const priceValue = parsePrice(priceText);
  const nameOk = name.trim().length > 0;
  const priceOk = priceValue !== null;
  const canSubmit = nameOk && priceOk;

  const resetForm = useCallback(() => {
    setName("");
    setPriceText("");
    setFrequency("Monthly");
    setCategory("Other");
    setSubmitAttempted(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    setSubmitAttempted(true);
    const trimmed = name.trim();
    const parsed = parsePrice(priceText);
    if (!trimmed || parsed === null) return;

    const start = dayjs();
    const startDate = start.toISOString();
    const renewalDate = start
      .add(1, frequency === "Monthly" ? "month" : "year")
      .toISOString();

    const sub: Subscription = {
      id: newSubscriptionId(),
      name: trimmed,
      price: parsed,
      currency: "USD",
      billing: frequency,
      category,
      status: "active",
      startDate,
      renewalDate,
      icon: icons.wallet,
      color: CATEGORY_COLORS[category],
    };

    onCreate(sub);

    posthog.capture("subscription_created", {
      subcription_name: name.trim(),
      subcription_price: priceValue,
      subcription_frequency: frequency,
      subcription_category: category,
    });
    
    resetForm();
    onClose();
  }, [
    name,
    priceText,
    frequency,
    category,
    onCreate,
    onClose,
    resetForm,
  ]);

  const nameError = submitAttempted && !nameOk;
  const priceError = submitAttempted && !priceOk;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
          className="modal-overlay"
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="modal-container"
        >
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="modal-close"
              onPress={handleClose}
            >
              <Text className="modal-close-text">×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="modal-body"
          >
            <View className="auth-field gap-2">
              <Text className="auth-label">Name</Text>
              <TextInput
                className={clsx("auth-input", nameError && "auth-input-error")}
                value={name}
                onChangeText={setName}
                placeholder="Subscription name"
                placeholderTextColor="#667085"
                autoCapitalize="sentences"
              />
              {nameError ? (
                <Text className="auth-error">Name is required.</Text>
              ) : null}
            </View>

            <View className="auth-field gap-2">
              <Text className="auth-label">Price</Text>
              <TextInput
                className={clsx(
                  "auth-input",
                  priceError && "auth-input-error",
                )}
                value={priceText}
                onChangeText={setPriceText}
                placeholder="0.00"
                placeholderTextColor="#667085"
                keyboardType="decimal-pad"
              />
              {priceError ? (
                <Text className="auth-error">
                  Enter a positive price.
                </Text>
              ) : null}
            </View>

            <View className="auth-field gap-2">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {(["Monthly", "Yearly"] as const).map((freq) => {
                  const active = frequency === freq;
                  return (
                    <Pressable
                      key={freq}
                      className={clsx(
                        "picker-option",
                        active && "picker-option-active",
                      )}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        className={clsx(
                          "picker-option-text",
                          active && "picker-option-text-active",
                        )}
                      >
                        {freq}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="auth-field gap-2">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      className={clsx(
                        "category-chip",
                        active && "category-chip-active",
                      )}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          active && "category-chip-text-active",
                        )}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              className={clsx(
                "auth-button",
                !canSubmit && "auth-button-disabled",
              )}
              onPress={handleSubmit}
            >
              <Text className="auth-button-text">Add subscription</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
