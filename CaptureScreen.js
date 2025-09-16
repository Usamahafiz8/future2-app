// CaptureScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  I18nManager,
  useWindowDimensions,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import { Button, Text, TextInput, Checkbox } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ScreenOrientation from "expo-screen-orientation";
import { useLanguage } from "./LanguageProvider";
import { STR, rtl } from "./i18n";
import { createEntry } from "./api";
import { StatusBar } from "expo-status-bar";
import { HelperText } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG_COLOR = "#00343A";
const GOLD = "#c6a96b";
const INK = "#ffffff";
const LINE = "rgba(255,255,255,.85)";

const bgImg = require("./StartBackground.png");
const titleBg = require("./assets/patternBK.png");
const backPng = require("./bbn.png");
const camPng = require("./camera.png");

/**
 * Modal with ONE CameraView (fixes iOS black preview).
 * We fake the “focus circle” using overlay views (no second camera).
 */
function BlurCameraModal({
  isVisible,
  onRequestClose,
  onCapture,
  faceDia,
  camRef,
  permission,
  requestPermission,
  S,
  lang,
}) {
  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission && requestPermission();
    }
  }, [isVisible, permission?.granted, requestPermission]);

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={onRequestClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {permission?.granted ? (
            <View style={styles.liveCameraContainer}>
              {/* Single camera preview */}
              <CameraView
                ref={camRef}
                style={[styles.liveCameraBackground, { transform: [{ scaleX: -1 }] }]}
                facing="front"
                ratio="16:9"
              />
              {/* Light frosted tint (visual only; not a real blur) */}
              <View style={styles.frostedOverlay} />
              {/* Circular focus ring */}
              <View
                style={[
                  styles.circularCutout,
                  {
                    width: faceDia,
                    height: faceDia,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginLeft: -faceDia / 2,
                    marginTop: -faceDia / 2,
                  },
                ]}
              />
            </View>
          ) : (
            <View style={[styles.modalCam, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: INK, fontFamily: "IthraV3-bold", textAlign: "center" }}>
                Camera permission required. Please allow access.
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              mode="contained"
              style={[styles.modalBtn, { backgroundColor: GOLD }]}
              labelStyle={{ color: "#fff" }}
              onPress={onCapture}
              disabled={!permission?.granted}
            >
              {lang === "ar" ? S.captureCta : S.captureCta.toUpperCase()}
            </Button>
            <Button mode="text" textColor="#fff" style={styles.modalBtn} onPress={onRequestClose}>
              {lang === "ar" ? S.cancel : S.cancel.toUpperCase()}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CaptureScreen({ navigation, route }) {
  const { lang } = useLanguage();
  const S = STR[lang] || STR.en;
  const isRTL = lang === "ar";

  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const insets = useSafeAreaInsets();

  // Layout
  const FRAME_INSET = Math.round(shortSide * 0.02);
  const CONTENT_W = Math.min(Math.round(width * 0.86), 980);
  const panelW = Math.min(430, Math.max(280, Math.round(width * 0.27)));
  const panelH = Math.round(panelW * 0.78);
  const faceDia = Math.round(Math.min(panelW, panelH) * 0.54);

  // Keyboard state and refs for scrolling
  const scrollRef = useRef(null);
  const [kbH, setKbH] = useState(0);
// track Name/Email Y positions inside the ScrollView content
const yPos = useRef({ fullName: 0, email: 0, message: 0 });

const rememberY = (key) => (e) => {
  yPos.current[key] = e.nativeEvent.layout.y; // absolute Y in scroll content
};

const bringIntoView = (key, pad = 90) => {
  requestAnimationFrame(() => {
    const top = yPos.current[key] ?? 0;
    const targetY = Math.max(top - (kbH + pad), 0);
    scrollRef.current?.scrollTo({ y: targetY, animated: true });
  });
};

const focusedKeyRef = useRef/** @type {null | 'fullName' | 'email' | 'message'} */(null);

useEffect(() => {
  const showSub = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    (e) => {
      setKbH(e.endCoordinates?.height ?? 0);
      // now we know the actual keyboard height — scroll the focused field again
      if (focusedKeyRef.current) {
        // slight delay so layout settles
        setTimeout(() => bringIntoView(focusedKeyRef.current), 30);
      }
    }
  );
  const hideSub = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    () => setKbH(0)
  );
  return () => { showSub.remove(); hideSub.remove(); };
}, []);


  const scrollToInput = (ref) => {
    ref.current?.measureLayout(
      scrollRef.current,
      (x, y) => {
        // A fixed offset from the top of the input field to make sure it's visible.
        const scrollPosition = y - 170;
        
        scrollRef.current?.scrollTo({
          y: scrollPosition,
          animated: true,
        });
      },
      () => {} // onError callback
    );
  };

  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef(null);
  const [showCam, setShowCam] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const initialMode = route?.params?.mode === "public" ? "public" : "private";
  const [isPublic, setIsPublic] = useState(initialMode === "public");

  const openCamera = async () => {
    const res = await requestPermission();
    if (res?.granted) setShowCam(true);
  };

  const capture = async () => {
    try {
      const shot = await camRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      if (shot?.uri) setPhotoUri(shot.uri);
      setShowCam(false);
    } catch {}
  };

  // Form
  const messageRef = useRef(null);
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const MSG_MAX = 160;
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const upperIfEn = (t) => (lang === "ar" ? t : String(t || "").toUpperCase());
  const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// --- SendGrid error localization (EN/AR) ---
const SG_MSG = {
  en: {
    invalid_format: "Invalid email format",
    provider_invalid: "Provider marked invalid",
    no_mail: "Domain does not accept mail",
    disposable: "Disposable email not allowed",
    role: "Role address not allowed",
    mailbox_risky: "Mailbox unverifiable or catch-all – high risk",
    service_down: "Validation service unavailable",
    failed: "Email failed verification",
  },
  ar: {
    invalid_format: "صيغة البريد الإلكتروني غير صحيحة",
    provider_invalid: "تم تصنيف البريد كغير صالح من المزود",
    no_mail: "النطاق لا يقبل الرسائل البريدية",
    disposable: "البريد المؤقت غير مسموح",
    role: "عناوين الدور/القسم غير مسموح بها",
    mailbox_risky: "تعذّر التحقق من الصندوق أو النطاق من نوع catch-all (مخاطرة عالية)",
    service_down: "خدمة التحقق غير متاحة حالياً",
    failed: "فشل التحقق من البريد الإلكتروني",
  },
};

/** Map SendGrid verdict/reason -> localized string */
const tEmailError = (lang, verdict, reason) => {
  const L = SG_MSG[lang] || SG_MSG.en;
  const r = (reason || "").toLowerCase();

  if (r.includes("invalid email format")) return L.invalid_format;
  if (r.includes("provider marked invalid")) return L.provider_invalid;
  if (r.includes("domain does not accept mail")) return L.no_mail;
  if (r.includes("disposable")) return L.disposable;
  if (r.includes("role address")) return L.role;
  if (r.includes("mailbox unverifiable") || r.includes("catch-all")) return L.mailbox_risky;
  if (r.includes("validation service unavailable")) return L.service_down;

  if (verdict === "Invalid") return L.provider_invalid;
  if (verdict === "Risky")   return L.mailbox_risky;
  if (verdict === "Unknown") return L.service_down;

  return L.failed;
};

const validateEmailRemote = async (emailStr) => {
  try {
    const r = await fetch("https://journeyofnation.com/api/api.php?action=email.validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailStr.trim() }),
    });
    const j = await r.json(); // { email, ok, verdict, reason }
    if (r.ok && j?.ok) return { ok: true };
    return {
      ok: false,
      verdict: j?.verdict || "Unknown",
      reason: j?.reason || j?.error || "",
    };
  } catch {
    return { ok: false, verdict: "Unknown", reason: "Validation service unavailable" };
  }
};


  useEffect(() => {
    if (route?.params?.mode) {
      setIsPublic(route.params.mode === "public");
    }
  }, [route?.params?.mode]);

  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
    })();
    return () => {
      (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch {}
      })();
    };
  }, []);

  useEffect(() => {
    try {
      I18nManager.allowRTL(rtl(lang));
    } catch {}
  }, [lang]);

  const inputTheme = {
    roundness: 10,
    colors: {
      primary: GOLD,
      outline: LINE,
      onSurfaceVariant: INK,
      surface: "transparent",
      background: "transparent",
      onSurface: INK,
      text: INK,
      placeholder: INK,
    },
  };

  // Field-level errors
  const [errors, setErrors] = useState({
    message: "",
    fullName: "",
    email: "",
    consent: "",
  });

  const onSubmit = async () => {
  // reset old errors + banner note
  setErrors({ message: "", fullName: "", email: "", consent: "" });
  setNote("");

  const newErr = { message: "", fullName: "", email: "", consent: "" };

  if (!message?.trim()) newErr.message = S.invalidMessage || "Please write a message.";
  if (!fullName?.trim()) newErr.fullName = S.invalidName || "Please enter your full name.";
  if (!emailOK(email)) newErr.email = S.invalidEmail || "Please enter a valid email.";
  if (!consent) newErr.consent = S.invalidConsent || "You must agree to the consent statement.";

  const hasLocalErr = Object.values(newErr).some(Boolean);
  if (hasLocalErr) {
    setErrors(newErr);
    // if email was bad, bring it into view
    if (newErr.email) { focusedKeyRef.current = 'email'; bringIntoView('email'); }
    return;
  }

  // ▶ Remote validation (SendGrid) — show error under email if it fails
  setBusy(true);
  setNote(S.submitting || "Submitting…");
  const v = await validateEmailRemote(email);
  if (!v.ok) {
    setBusy(false);
    setNote(""); // clear banner; show field error instead
  const msg = tEmailError(lang, v.verdict, v.reason);
  setErrors((e) => ({ ...e, email: msg }));
      focusedKeyRef.current = 'email';
    bringIntoView('email', 140);
    return;
  }

  try {
    const res = await createEntry({
      full_name: fullName.trim(),
      email: email.trim(),
      message: message.trim(),
      photoUri: photoUri || null,
      lang,
      consent,
      is_public: isPublic,
      mode: isPublic ? "public" : "private",
    });

    if (res?.ok) {
      setPhotoUri(null);
      setNote("");
      navigation.navigate("ThankYou");
      return;
    }

    // ▶ If backend still rejects (e.g., server-side verification), map to field
    if (res?.error && /email/i.test(res.error)) {
      setErrors((e) => ({ ...e, email: res.error }));
      focusedKeyRef.current = 'email';
      bringIntoView('email', 140);
      setNote("");
    } else {
      setNote((S.error || "Something went wrong.") + (res?.error ? " - " + res.error : ""));
    }
  } catch {
    setNote(S.error || "Something went wrong.");
  } finally {
    setBusy(false);
  }
};


  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      <StatusBar hidden />

      <ImageBackground source={bgImg} style={styles.bg} imageStyle={styles.bgImg}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
          style={[
            styles.backBtn,
            {
              top: Math.round(shortSide * 0.09),
              ...(isRTL ? { right: Math.round(shortSide * 0.09) } : { left: Math.round(shortSide * 0.09) }),
              width: Math.round(shortSide * 0.1),
              height: Math.round(shortSide * 0.1),
            },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={backPng}
            style={{
              width: "65%",
              height: "65%",
              resizeMode: "contain",
              transform: isRTL ? [{ scaleX: -1 }] : undefined,
            }}
          />
        </TouchableOpacity>

        {/* Title */}
        <View style={[styles.titleWrap, { marginTop: Math.round(shortSide * 0.2) }]}>
          <ImageBackground source={titleBg} style={styles.titleBg} imageStyle={styles.titleBgImg}>
            <Text
              style={[
                styles.titleText,
                lang === "ar" && { letterSpacing: 0, writingDirection: "rtl" },
              ]}
            >
              {S.formTitle || S.title2030 || "Where do you see yourself in 2030?"}
            </Text>
          </ImageBackground>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: kbH +120 }]}
        >
          {/* Main content wrapper */}
          <View style={[styles.contentWrap, { width: CONTENT_W }]}>
            {/* LEFT: GOLD CARD */}
            <Pressable
              onPress={openCamera}
              style={[
                styles.panel,
                { width: panelW, height: panelH, borderRadius: Math.round(panelW * 0.08) },
              ]}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
              ) : (
                <View style={styles.viewportStub}>
                  <Image
                    source={camPng}
                    style={{ width: "70%", height: "70%", resizeMode: "contain", tintColor: "#fff" }}
                  />
                </View>
              )}
            </Pressable>

            {/* RIGHT: form */}
            <View  onLayout={rememberY('message')} style={[styles.form, { width: Math.round(CONTENT_W - panelW - 40) }]}>

              <TextInput
                ref={messageRef}
 onFocus={() => {
      focusedKeyRef.current = 'message';
      // a little extra lift vs defaults, tweak 135–150 if you want more/less
      bringIntoView('message', 140);
    }}                mode="outlined"
                theme={inputTheme}
                placeholder={upperIfEn(S.phMessage || "YOUR MESSAGES")}
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
                maxLength={MSG_MAX}
                style={[styles.input, { height: 96 }, isRTL && { textAlign: "right" }]}
                outlineStyle={styles.inputOutline}
                contentStyle={[
                  styles.inputContent,
                  isRTL ? { writingDirection: "rtl", textAlign: "right" } : { writingDirection: "ltr", textAlign: "left" },
                ]}
              />
              <HelperText
                type="error"
                visible={!!errors.message}
                style={[styles.helperText, isRTL && { textAlign: 'right' }]}
              >
                {errors.message}
              </HelperText>

              <Text style={{ color: INK, opacity: 0.75, alignSelf: "flex-end", marginTop: -6, marginBottom: 10, fontFamily: "IthraV3-light" }}>
                {message.length}/{MSG_MAX}
              </Text>


              {/* NAME */}

<View onLayout={rememberY('fullName')}>
  <TextInput
    ref={fullNameRef}
    onFocus={() => {
      focusedKeyRef.current = 'fullName';
      bringIntoView('fullName');      }}      // initial nudge
    mode="outlined"
    theme={inputTheme}
    placeholder={upperIfEn(S.phName || "YOUR NAME")}
    placeholderTextColor="rgba(255,255,255,0.6)"
    value={fullName}
    onChangeText={setFullName}
    dense
    style={[styles.input, isRTL && { textAlign: "right" }]}
    outlineStyle={styles.inputOutline}
    contentStyle={[
      styles.inputContent,
      isRTL ? { writingDirection: "rtl", textAlign: "right" } : { writingDirection: "ltr", textAlign: "left" },
    ]}
  />
  <HelperText
    type="error"
    visible={!!errors.fullName}
    style={[styles.helperText, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
  >
    {errors.fullName}
  </HelperText>
</View>

{/* EMAIL */}
<View onLayout={rememberY('email')}>
  <TextInput
    ref={emailRef}
  onFocus={() => {
      focusedKeyRef.current = 'email';
      bringIntoView('email');             // initial nudge
    }}
        mode="outlined"
    theme={inputTheme}
    placeholder={upperIfEn(S.phEmail || "YOUR EMAIL ADDRESS")}
    placeholderTextColor="rgba(255,255,255,0.6)"
    keyboardType="email-address"
    autoCapitalize="none"
    value={email}
    onChangeText={setEmail}
    dense
    style={[styles.input, isRTL && { textAlign: "right" }]}
    outlineStyle={styles.inputOutline}
    contentStyle={[
      styles.inputContent,
      { writingDirection: "ltr", textAlign: isRTL ? "right" : "left" },
    ]}
  />
  <HelperText
    type="error"
    visible={!!errors.email}
    style={[styles.helperText, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
  >
    {errors.email}
  </HelperText>
</View>


              <View style={[styles.consentRow, isRTL && { flexDirection: "row-reverse", justifyContent: "flex-start" }]}>
                <View style={[styles.checkboxFrame, isRTL ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6 }]}>
                  <Checkbox
                    status={consent ? "checked" : "unchecked"}
                    onPress={() => setConsent((v) => !v)}
                    color="#fff"
                    uncheckedColor="#fff"
                  />
                </View>
                <Text
                  style={[
                    styles.consentText,
                    { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" },
                  ]}
                >
                  {S.consentLabel || "I agree to participate and receive an email in the future."}
                </Text>
              </View>
              {!!errors.consent && (
                <HelperText
                  type="error"
                  visible
                  style={[styles.helperText, isRTL && { textAlign: 'right', marginTop: -8 }]}
                >
                  {errors.consent}
                </HelperText>
              )}
              <View style={{ alignItems: "center", marginTop: 6 }}>
                <Button
                  mode="contained"
                  onPress={onSubmit}
                  loading={busy}
                  disabled={busy}
                  style={styles.sendBtn}
                  labelStyle={styles.sendLabel}
                >
                  {upperIfEn(S.send || "SEND")}
                </Button>
              </View>

              {!!note && <Text style={styles.note}>{note}</Text>}
            </View>
          </View>
        </ScrollView>
      </ImageBackground>

      {/* Camera modal (single session) */}
      <BlurCameraModal
        isVisible={showCam}
        onRequestClose={() => setShowCam(false)}
        onCapture={capture}
        faceDia={faceDia}
        camRef={camRef}
        permission={permission}
        requestPermission={requestPermission}
        S={S}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: "flex-start" },
  bgImg: { resizeMode: "cover" },

  backBtn: { position: "absolute", zIndex: 20, alignItems: "center", justifyContent: "center" },

  titleWrap: { alignItems: "center", marginBottom: 10 },
  titleBg: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, overflow: "hidden" },
  titleBgImg: { resizeMode: "cover", borderRadius: 12 },
  titleText: { color: INK, fontSize: 36, fontFamily: "IthraV3-bold", textAlign: "center" },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 20, // Add padding to create space from the top
  },

  contentWrap: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start", // Changed from "center" to "flex-start"
    justifyContent: "space-between",
    columnGap: 32,
    paddingHorizontal: 8,
  },

  panel: {
    backgroundColor: GOLD,
    borderRadius: 24,
    padding: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  viewportStub: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
    borderColor: "rgba(0,0,0,0.12)",
    borderWidth: 2,
  },
  fill: { width: "100%", height: "100%" },

  form: { alignSelf: "center", flex: 1 }, // Added flex: 1 for better spacing
  input: { marginBottom: 12, backgroundColor: "transparent" },
  inputOutline: { borderRadius: 0, borderColor: LINE },
  inputContent: { color: INK, fontFamily: "IthraV3-bold", textAlignVertical: "top" },

  consentRow: { flexDirection: "row", alignItems: "center", marginTop: 6, marginBottom: 18 },
  checkboxFrame: { borderWidth: 1, borderColor: "#fff", borderRadius: 3, marginRight: 6 },
  consentText: { color: INK, fontSize: 18, fontFamily: "IthraV3-bold", flexShrink: 1 },

  sendBtn: { backgroundColor: GOLD, borderRadius: 28, paddingVertical: 8, paddingHorizontal: 56, minWidth: 220 },
  sendLabel: { color: "#fff", fontSize: 16, fontFamily: "IthraV3-bold" },
  note: { color: INK, opacity: 0.9, marginTop: 10, fontFamily: "IthraV3-light", textAlign: "center" },

  helperText: {
    color: "#ffb3b3"
  },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  modalCard: { width: "70%", maxWidth: 900, backgroundColor: BG_COLOR, borderRadius: 20, padding: 18, borderWidth: 2, borderColor: LINE },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
  modalBtn: { borderRadius: 24, paddingHorizontal: 18 },

  // Live preview container
  liveCameraContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  liveCameraBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  frostedOverlay: {
    // ...StyleSheet.absoluteFillObject,
    // backgroundColor: "rgba(255,255,255,0.10)",
  },
  circularCutout: {},
});