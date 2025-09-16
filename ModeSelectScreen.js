// ModeSelectScreen.js
import React from "react";
import { View, Text, ImageBackground, Pressable, StyleSheet, useWindowDimensions, Image, TouchableOpacity } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { useLanguage } from "./LanguageProvider";
import { StatusBar } from "expo-status-bar";

const BORDER = require("./border.png");
const backPng = require("./bbn.png");   // ⬅️ same button asset as StartScreen
const GOLD   = "#c6a96b";
const BG     = "#0b3d2e";

const COPY = {
  en: {
    publicTitle: "PUBLIC MODE",
    publicDesc:
      "Your message will be shared\non the event's public screen\nfor everyone to see",
    privateTitle: "PRIVATE MODE",
    privateDesc:
      "Your message will be kept\nprivate and sent only to\nyou in the future",
  },
  ar: {
    publicTitle: "الوضع العام",
    publicDesc: "ستُعرَض رسالتك على شاشة الحدث العامة\nليشاهدها الجميع",
    privateTitle: "الوضع الخاص",
    privateDesc: "ستُحفَظ رسالتك بشكل خاص\nوتُرسَل إليك لاحقًا",
  },
};

function ChoiceTile({
  bg, title, desc, borderInset, titleSize, descSize, onPress, rtl = false, titleFamily, descFamily,
}) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "#00000033" }} style={{ flex: 1, backgroundColor: bg }}>
      {({ pressed }) => (
        <View style={{ flex: 1, margin: borderInset }}>
          <ImageBackground
            source={BORDER}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: Math.round(borderInset * 1.2),
              transform: [{ scale: pressed ? 0.995 : 1 }],
            }}
            imageStyle={{ resizeMode: "stretch" }}
          >
            {/* press overlay */}
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", opacity: pressed ? 0.12 : 0 }]}
            />

            <Text
              style={{
                color: "#fff",
                fontFamily: titleFamily,
                fontSize: titleSize,
                textAlign: "center",
                letterSpacing: rtl ? 0 : 1,
                writingDirection: rtl ? "rtl" : "ltr",
                includeFontPadding: false,
                marginBottom: Math.round(titleSize * 0.45),
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                color: "#e8fff1",
                opacity: 0.95,
                fontFamily: descFamily,
                fontSize: descSize,
                lineHeight: Math.round(descSize * 1.4),
                textAlign: "center",
                letterSpacing: rtl ? 0 : 0.2,
                writingDirection: rtl ? "rtl" : "ltr",
                includeFontPadding: false,
              }}
            >
              {desc}
            </Text>
          </ImageBackground>
        </View>
      )}
    </Pressable>
  );
}

export default function ModeSelectScreen({ navigation }) {
  const { lang } = useLanguage();
  const L = COPY[lang] || COPY.en;

  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);

  // inset for border color reveal
  const BORDER_INSET = Math.round(shortSide * 0.02);

  // responsive type
  const base       = Math.min(width / 2, height);
  const titleSize  = Math.round(base * 0.08);
  const descSize   = Math.round(base * 0.045);

  // back button placement (same logic as StartScreen)
  const BACK_SIZE = Math.round(shortSide * 0.10);
  const BACK_TOP  = Math.round(shortSide * 0.095);
  const BACK_LEFT = Math.round(shortSide * 0.095);

  const choose = (mode) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Capture", params: { mode } }],
      })
    );
  };

  const goHome = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />

   {/* Back button overlay (doesn't block tiles) */}
<TouchableOpacity
  onPress={goHome}
  activeOpacity={0.85}
  style={[
    styles.backBtn,
    {
      top: BACK_TOP,
      ...(lang === "ar"
        ? { right: BACK_LEFT } // ⬅ move to right side
        : { left: BACK_LEFT }), // ⬅ default left
      width: BACK_SIZE,
      height: BACK_SIZE,
    },
  ]}
>
  <Image
    source={backPng}
    style={{
      width: "65%",
      height: "65%",
      resizeMode: "contain",
      transform: lang === "ar" ? [{ scaleX: -1 }] : undefined, // ⬅ flip for Arabic
    }}
  />
</TouchableOpacity>


      <View style={{ flex: 1, flexDirection: "row" }}>
        <ChoiceTile
          bg={BG}
          title={L.publicTitle}
          desc={L.publicDesc}
          borderInset={BORDER_INSET}
          titleSize={titleSize}
          descSize={descSize}
          onPress={() => choose("public")}
          rtl={lang === "ar"}
          titleFamily="ithraV3-bold"
          descFamily="ithraV3-medium"
        />
        <ChoiceTile
          bg={GOLD}
          title={L.privateTitle}
          desc={L.privateDesc}
          borderInset={BORDER_INSET}
          titleSize={titleSize}
          descSize={descSize}
          onPress={() => choose("private")}
          rtl={lang === "ar"}
          titleFamily="ithraV3-bold"
          descFamily="ithraV3-medium"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: "absolute",
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
