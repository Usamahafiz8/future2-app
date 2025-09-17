// LanguageProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext({ lang: 'en', setLangPersist: async () => {} });
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('app_lang');
      const l = stored === 'ar' ? 'ar' : 'en';
      setLang(l);
      I18nManager.allowRTL(l === 'ar');
      I18nManager.forceRTL(l === 'ar');
    })();
  }, []);

  const setLangPersist = async (l) => {
    setLang(l);
    await AsyncStorage.setItem('app_lang', l);
    I18nManager.allowRTL(l === 'ar');
    I18nManager.forceRTL(l === 'ar');
  };

  const value = useMemo(() => ({ lang, setLangPersist }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
