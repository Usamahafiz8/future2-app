import * as React from "react";
import { View, Text, ImageBackground, Pressable, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useKeepAwake } from "expo-keep-awake";
import { useFonts } from "expo-font";
import { useLanguage } from "./LanguageProvider";

const GOLD = "#c6a96b";
const BG   = "#0b3d2e";
const BORDER = require("./border.png");

type Lang = "en" | "ar";

function HalfTile({
  bg, label, fontSize, fontFamily, rtl = false, borderInset, onPress,
}: {
  bg: string; label: string; fontSize: number; fontFamily: string;
  rtl?: boolean; borderInset: number; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#00000033" }}
      style={{ flex: 1, backgroundColor: bg }}
    >
      {({ pressed }) => (
        <View style={{ flex: 1, margin: borderInset }}>
          <ImageBackground
            source={BORDER}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: pressed ? 0.995 : 1 }],
            }}
            imageStyle={{ resizeMode: "stretch" }}
          >
            {/* iOS press overlay */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
                opacity: pressed ? 0.12 : 0,
              }}
            />
            <Text
              style={{
                color: "#fff",
                fontFamily,
                fontSize,
                textAlign: "center",
                letterSpacing: rtl ? 0 : 1,           // Arabic must not use spacing
                writingDirection: rtl ? "rtl" : "ltr",
                lineHeight: rtl ? Math.round(fontSize * 1.18) : undefined, // fix ي dots
                includeFontPadding: true,
              }}
            >
              {label}
            </Text>
          </ImageBackground>
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: any) {
  useKeepAwake();
  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const { setLangPersist } = useLanguage();

  const [fontsLoaded] = useFonts({
    "ithraV3-regular": require("./ithraV3-medium.otf"), // Arabic regular
    "ithraV3-bold":    require("./ithraV3-bold.otf"),   // English bold
  });
  if (!fontsLoaded) return null;

  const BORDER_INSET = Math.round(shortSide * 0.02);
  const base = Math.min(width / 2, height);
  const fontEN = Math.round(base * 0.12);
  const fontAR = Math.round(base * 0.13);

  const pick = async (code: Lang) => {
    await setLangPersist(code);          // persist language
          navigation.replace("Start", { lang: code });

  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />
      <View style={{ flex: 1, flexDirection: "row" }}>
        <HalfTile
          bg={BG}
          label="ENGLISH"
          fontSize={fontEN}
          fontFamily="ithraV3-bold"
          borderInset={BORDER_INSET}
          onPress={() => pick("en")}
        />
        <HalfTile
          bg={GOLD}
          label="عربي"
          fontSize={fontAR}
          fontFamily="ithraV3-regular"
          rtl
          borderInset={BORDER_INSET}
          onPress={() => pick("ar")}
        />
      </View>
    </View>
  );
}
