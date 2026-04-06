import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function SignUp() {
  return (
    <View>
      <Text>SignUp</Text>
      <Link href="/(auth)/sign-in">Sign in Account</Link>
    </View>
  );
}
