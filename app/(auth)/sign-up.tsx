import { useAuth, useSignUp } from "@clerk/expo";
import { Link, Redirect, useRouter, type Href } from "expo-router";
import { styled } from "nativewind";
import { posthog } from "@/lib/posthog";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [localErrors, setLocalErrors] = React.useState<{
    email?: string;
    password?: string;
    code?: string;
  }>({});

  React.useEffect(() => {
    if (isSignedIn && isLoaded) {
      router.replace("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const finalizeSignUp = async () => {
    posthog.identify(emailAddress.trim().toLowerCase(), {
      $set: { email: emailAddress.trim().toLowerCase() },
      $set_once: { first_signup_date: new Date().toISOString() },
    });
    posthog.capture("user_signed_up", {
      email: emailAddress.trim().toLowerCase(),
    });
    await signUp.finalize({
      navigate: ({
        session,
        decorateUrl,
      }: {
        session?: { currentTask?: unknown };
        decorateUrl: (path: string) => string;
      }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }

        const url = decorateUrl("/");
        if (
          url.startsWith("http") &&
          typeof globalThis !== "undefined" &&
          "location" in globalThis
        ) {
          globalThis.location.href = url;
        } else {
          router.push(url as Href);
        }
      },
    });
  };

  const handleSubmit = async () => {
    const nextErrors: typeof localErrors = {};

    if (!emailAddress.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(emailAddress.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      return;
    }

    setLocalErrors({});
    const { error } = await signUp.password({
      emailAddress: emailAddress.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signUp.status === "missing_requirements") {
      if (signUp.unverifiedFields.includes("email_address")) {
        await signUp.verifications.sendEmailCode();
      }
      return;
    }

    if (signUp.status === "complete") {
      await finalizeSignUp();
    }
  };

  const handleVerify = async () => {
    const nextErrors = {} as typeof localErrors;

    if (!code.trim()) {
      nextErrors.code = "Verification code is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      return;
    }

    setLocalErrors({});
    await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (signUp.status === "complete") {
      await finalizeSignUp();
    } else {
      console.error("Sign-up verification did not complete:", signUp);
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#081126" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Branding */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Recurrly</Text>
                  <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
                </View>
              </View>
              <Text className="auth-title">Create your account</Text>
              <Text className="auth-subtitle">
                Start tracking your subscriptions and never miss a payment
              </Text>
            </View>

            {/* Sign-up Form */}
            <View className="flex-1 rounded-[36px] bg-card p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
              {signUp.status === "missing_requirements" &&
              signUp.unverifiedFields.includes("email_address") ? (
                <>
                  <Text className="text-xl font-sans-bold text-primary mb-4">
                    Verify your email
                  </Text>
                  <TextInput
                    className="rounded-3xl border border-border bg-background px-4 py-4 text-base text-primary"
                    value={code}
                    placeholder="Enter verification code"
                    placeholderTextColor="#667085"
                    onChangeText={setCode}
                    keyboardType="numeric"
                  />
                  {(errors.fields.code?.message || localErrors.code) && (
                    <Text className="mt-2 text-sm text-destructive">
                      {errors.fields.code?.message || localErrors.code}
                    </Text>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                      fetchStatus === "fetching" && styles.disabled,
                    ]}
                    onPress={handleVerify}
                    disabled={fetchStatus === "fetching"}
                  >
                    <Text className="font-sans-semibold text-base text-white">
                      Verify
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => signUp.verifications.sendEmailCode()}
                  >
                    <Text className="font-sans-semibold text-base text-accent">
                      Resend code
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="text-xl font-sans-bold text-primary mb-4">
                    Sign up
                  </Text>
                  <View className="space-y-4">
                    <View>
                      <Text className="mb-2 text-sm font-sans-semibold text-primary">
                        Email
                      </Text>
                      <TextInput
                        className="rounded-3xl border border-border bg-background px-4 py-4 text-base text-primary"
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="Enter your email"
                        placeholderTextColor="#667085"
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                      />
                      {(errors.fields.emailAddress?.message ||
                        localErrors.email) && (
                        <Text className="mt-2 text-sm text-destructive">
                          {errors.fields.emailAddress?.message ||
                            localErrors.email}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text className="mb-2 text-sm font-sans-semibold text-primary">
                        Password
                      </Text>
                      <TextInput
                        className="rounded-3xl border border-border bg-background px-4 py-4 text-base text-primary"
                        placeholder="Create a password"
                        placeholderTextColor="#667085"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                      {(errors.fields.password?.message ||
                        localErrors.password) && (
                        <Text className="mt-2 text-sm text-destructive">
                          {errors.fields.password?.message ||
                            localErrors.password}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (fetchStatus === "fetching" ||
                        !emailAddress ||
                        !password) &&
                        styles.disabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleSubmit}
                    disabled={
                      fetchStatus === "fetching" || !emailAddress || !password
                    }
                  >
                    <Text className="font-sans-semibold text-base text-white">
                      Create account
                    </Text>
                  </Pressable>

                  <View className="mt-4 flex-row justify-center gap-2">
                    <Text className="text-sm text-muted-foreground">
                      Already have an account?
                    </Text>
                    <Link href="/sign-in" asChild>
                      <Text className="text-sm font-sans-semibold text-accent">
                        Sign in
                      </Text>
                    </Link>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: "#ea7a53",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
