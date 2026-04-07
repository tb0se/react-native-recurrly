import SubscriptionCard from "@/components/SubscriptionCard";
import "@/global.css";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { posthog } from "@/lib/posthog";
import { formatStatusLabel } from "@/lib/utils";
import { styled } from "nativewind";
import React, { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function subscriptionMatchesQuery(sub: Subscription, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    sub.name,
    sub.category,
    sub.plan,
    sub.billing,
    sub.paymentMethod,
    sub.status,
    sub.status ? formatStatusLabel(sub.status) : "",
  ].filter((p): p is string => typeof p === "string" && p.length > 0);
  const haystack = parts.join(" ").toLowerCase();
  return haystack.includes(q);
}

export default function Subscriptions() {
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter((sub) =>
        subscriptionMatchesQuery(sub, query),
      ),
    [subscriptions, query],
  );

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        className="flex-1"
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text className="list-title mb-4">Subscriptions</Text>
            <TextInput
              className="mb-4 rounded-3xl border border-border bg-card px-4 py-3 text-base text-primary"
              value={query}
              placeholder="Search by name, category, plan…"
              placeholderTextColor="#667085"
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search subscriptions"
              clearButtonMode="while-editing"
            />
          </>
        }
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              const isExpanding = expandedSubscriptionId !== item.id;
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id,
              );
              if (isExpanding) {
                posthog.capture("subscription_expanded", {
                  subscription_id: item.id,
                  subscription_name: item.name,
                });
              }
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <Text className="home-empty-state">
            {query.trim()
              ? "No subscriptions match your search"
              : "No subscriptions yet"}
          </Text>
        }
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  );
}
