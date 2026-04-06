import { Link, useLocalSearchParams } from "expo-router";
import { posthog } from "@/lib/posthog";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    posthog.capture("subscription_detail_viewed", {
      subscription_id: id,
    });
  }, [id]);

  return (
    <View>
      <Text>Subscription Details: {id}</Text>
      <Link href="/">Go back</Link>
    </View>
  );
}
