import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations/translations';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../constants/languages';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return saved && SUPPORTED_LANGUAGES.find(lang => lang.code === saved) 
      ? saved 
      : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem('selectedLanguage', currentLanguage);
  }, [currentLanguage]);

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let translation = translations[currentLanguage];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        break;
      }
    }

    // Fallback to English if translation not found
    if (translation === undefined) {
      let fallback = translations[DEFAULT_LANGUAGE];
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          break;
        }
      }
      translation = fallback || key;
    }

    // Handle parameter substitution
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return translation || key;
  };

  const changeLanguage = (languageCode) => {
    if (SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
    }
  };

  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      t,
      getCurrentLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};