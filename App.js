// App.tsx
import * as React from 'react';
import { Provider as PaperProvider, configureFonts } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';  // ⬅️ add

import theme from './theme';
import HomeScreen from './HomeScreen';
import CaptureScreen from './CaptureScreen';
import StartScreen from './StartScreen';
import ModeSelectScreen from './ModeSelectScreen';
import ThankYou from './ThankYou';
import { LanguageProvider, useLanguage } from './LanguageProvider';

const Stack = createNativeStackNavigator();

function ThemedApp() {
  const { lang } = useLanguage();

  const [fontsLoaded] = useFonts({
    // use consistent, real family names you reference in styles
    'ithraV3-bold': require('./ithraV3-bold.otf'),
    'ithraV3-light': require('./ithraV3-light.otf'),
    'ithraV3-medium': require('./ithraV3-medium.otf'),
  });

  // Map Paper variants -> your real families
  const F = React.useCallback(
    (w) => {
      // if you ever add true Arabic-specific families, switch here by lang
      if (w === 'Bold' || w === 'Heavy') return 'ithraV3-bold';
      return 'ithraV3-medium'; // use medium as your Regular body
    },
    [lang]
  );

  const fontConfig = React.useMemo(
    () => ({
      displayLarge:   { fontFamily: F('Heavy') },
      displayMedium:  { fontFamily: F('Heavy') },
      displaySmall:   { fontFamily: F('Bold')  },
      headlineLarge:  { fontFamily: F('Bold')  },
      headlineMedium: { fontFamily: F('Bold')  },
      headlineSmall:  { fontFamily: F('Bold')  },
      titleLarge:     { fontFamily: F('Bold')  },
      titleMedium:    { fontFamily: F('Bold')  },
      titleSmall:     { fontFamily: F('Regular') },
      bodyLarge:      { fontFamily: F('Regular') },
      bodyMedium:     { fontFamily: F('Regular') },
      bodySmall:      { fontFamily: F('Regular') },
      labelLarge:     { fontFamily: F('Bold')  },
      labelMedium:    { fontFamily: F('Bold')  },
      labelSmall:     { fontFamily: F('Regular') },
    }),
    [F]
  );

  const themed = React.useMemo(
    () => ({ ...theme, fonts: configureFonts({ config: fontConfig }) }),
    [fontConfig]
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider> {/* ⬅️ enables useSafeAreaInsets in screens */}
      <PaperProvider theme={themed}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} /* initialRouteName="Start" */>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Capture" component={CaptureScreen} />
            <Stack.Screen name="Start" component={StartScreen} />
            <Stack.Screen name="ModeSelectScreen" component={ModeSelectScreen} />
            <Stack.Screen name="ThankYou" component={ThankYou} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemedApp />
    </LanguageProvider>
  );
}
