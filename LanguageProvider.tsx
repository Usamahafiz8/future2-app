// LanguageProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'en' | 'ar';
type Ctx = { lang: Lang; setLangPersist: (l: Lang) => Promise<void> };

const LanguageContext = createContext<Ctx>({ lang: 'en', setLangPersist: async () => {} });
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('app_lang');
      const l = stored === 'ar' ? 'ar' : 'en';
      setLang(l);
      I18nManager.allowRTL(l === 'ar');
      I18nManager.forceRTL(l === 'ar');
    })();
  }, []);

  const setLangPersist = async (l: Lang) => {
    setLang(l);
    await AsyncStorage.setItem('app_lang', l);
    I18nManager.allowRTL(l === 'ar');
    I18nManager.forceRTL(l === 'ar');
  };

  const value = useMemo(() => ({ lang, setLangPersist }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
