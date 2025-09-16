// StartScreen.js
import React from "react";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Pressable } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { useLanguage } from "./LanguageProvider";
import { StatusBar } from "expo-status-bar";

const bg      = require("./StartBackground.png");
const titleBg = require("./assets/patternBK.png");
// Optional: use your own button art instead of the styled circle
const backPng  = require("./bbn.png"); // ← if you have a PNG

const COPY = {
  en: { title: "Where do you see yourself in 2030?" },
  ar: { title: "أين ترى نفسك في عام 2030؟" },
};

export default function StartScreen({ navigation }) {
  const { lang } = useLanguage();
  const L = COPY[lang] || COPY.en;
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);

  // Inset so the bg pattern floats inside the border frame
  const FRAME_INSET = Math.round(shortSide * 0.02);

  // Back button sizing/positioning — tuned to match your mock
  const BACK_SIZE   = Math.round(shortSide * 0.10);     // circle diameter
  const BACK_TOP    = Math.round(shortSide * 0.095);    // push it down a bit
  const BACK_LEFT   = Math.round(shortSide * 0.095);
  const ARROW_SIZE  = Math.round(BACK_SIZE * 0.62);     // chevron size

  const onStart = React.useCallback(() => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "ModeSelectScreen" }] }));
  }, [navigation]);

  const onGoHome = React.useCallback(() => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }));
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={{ flex: 1, margin: FRAME_INSET }}>
        <ImageBackground source={bg} style={styles.bg} imageStyle={styles.bgImg}>
          {/* BACK (Go Home) */}
         {/* BACK (Go Home) */}
<TouchableOpacity
  onPress={onGoHome}
  activeOpacity={0.85}
  style={[
    styles.backBtn,
    {
      top: BACK_TOP,
      ...(lang === "ar"
        ? { right: BACK_LEFT }  // move to right if Arabic
        : { left: BACK_LEFT }), // default left
      width: BACK_SIZE,
      height: BACK_SIZE,
      borderRadius: BACK_SIZE / 2,
    },
  ]}
>
  <Image
    source={backPng}
    style={{
      width: "65%",
      height: "65%",
      resizeMode: "contain",
      transform: lang === "ar" ? [{ scaleX: -1 }] : undefined, // flip arrow in Arabic
    }}
  />
</TouchableOpacity>

          {/* Full-screen press target (START) */}
          <Pressable onPress={onStart} style={StyleSheet.absoluteFill}>
            {({ pressed }) => (
              <>
                <View style={styles.content}>
                  <ImageBackground source={titleBg} style={styles.titleBg} imageStyle={styles.titleBgImg}>
                    <Text style={[styles.title, lang === "ar" ? styles.titleAr : styles.titleEn]}>{L.title}</Text>
                  </ImageBackground>
                </View>
                {/* Press overlay feedback */}
                <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", opacity: pressed ? 0.08 : 0 }]} />
              </>
            )}
          </Pressable>
        </ImageBackground>
      </View>
    </View>
  );
}

const GOLD = "#c6a96b";
const BG   = "#00343A";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  bg: { flex: 1, justifyContent: "center" },
  bgImg: { resizeMode: "cover" },

  content: { flex: 1, alignItems: "center", justifyContent: "center" },

  titleBg: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, overflow: "hidden" },
  titleBgImg: { resizeMode: "cover", borderRadius: 12 },
  title: {
    color: "#e8fff1",
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "IthraV3-bold",
    includeFontPadding: false,
  },
  titleEn: { writingDirection: "ltr" },
  titleAr: { writingDirection: "rtl" },

  backBtn: {
    position: "absolute",
    zIndex: 10,
  },
  backCircle: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e8fff1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  backArrow: {
    color: "#e8fff1",
    fontFamily: "IthraV3-bold",
  },
});
