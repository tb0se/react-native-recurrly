import { useAuth, useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { posthog } from "@/lib/posthog";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      posthog.capture("user_signed_out");
      posthog.reset();
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="mt-16 rounded-[36px] bg-card p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <Text className="text-3xl font-sans-extrabold text-primary">
          Account
        </Text>
        <Text className="mt-3 text-base font-sans-medium text-muted-foreground">
          Manage your access and sign out when you’re done.
        </Text>

        <View className="gap-2">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              Account ID
            </Text>
            <Text
              className="text-sm font-sans-medium text-primary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.id?.substring(0, 20)}...
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              Joined
            </Text>
            <Text className="text-sm font-sans-medium text-primary">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            {
              marginTop: 24,
              borderRadius: 999,
              backgroundColor: "#ea7a53",
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <Text className="font-sans-semibold text-base text-white">
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
