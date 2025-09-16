// ThankYouScreen.js
import React, { useEffect } from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useLanguage } from "./LanguageProvider";

const BG_COLOR = "#00343A";
const bg = require("./StartBackground.png"); // same bg as other screens

const COPY = {
  en: {
    title: "THANK YOU!",
    subtitle: "FOR PARTICIPATING IN THE EXPERIENCE",
  },
  ar: {
    title: "شكرا لك",
    subtitle: "على مشاركتك في هذه التجربة",
  },
};

export default function ThankYouScreen({ navigation }) {
  const { lang } = useLanguage();
  const L = COPY[lang] || COPY.en;

  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const FRAME_INSET = Math.round(shortSide * 0.02);

  // responsive sizes that feel like the mock
  const titleSize = Math.max(42, Math.round(shortSide * 0.16));
  const subSize = Math.max(16, Math.round(shortSide * 0.045));

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Home" }] })
      );
    },5000);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={{ flex: 1, margin: FRAME_INSET }}>
        <ImageBackground source={bg} style={styles.bg} imageStyle={styles.bgImg}>
          <View style={styles.center}>
            <Text
              style={[
                styles.title,
                { fontSize: titleSize },
                lang === "ar" ? styles.ar : styles.en,
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {L.title}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { fontSize: subSize },
                lang === "ar" ? styles.ar : styles.en,
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {L.subtitle}
            </Text>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_COLOR },
  bg: { flex: 1, justifyContent: "center" },
  bgImg: { resizeMode: "cover" },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

  // Typography (Ithra)
  title: {
    color: "#ffffff",
    fontFamily: "IthraV3-bold",
    textAlign: "center",
    includeFontPadding: false,
  },
  subtitle: {
    marginTop: 18,
    color: "#ffffff",
    opacity: 0.95,
    fontFamily: "IthraV3-medium",
    letterSpacing: 1,
    textAlign: "center",
    includeFontPadding: false,
  },

  // writing direction
  en: { writingDirection: "ltr" },
  ar: { writingDirection: "rtl" },
});
