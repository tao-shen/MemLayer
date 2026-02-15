import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar
    'nav.find': 'find --sweet',
    'nav.cd': 'cd /chocolates',
    'nav.man': 'man recipes',
    'nav.create': 'create skills',
    'nav.library': 'my skills',
    'theme': 'Theme',
    'chooseTheme': 'Choose Theme',
    'cart': 'Cart',
    'login': 'Login',
    'logout': 'Sign Out',
    'collapse': 'Collapse',
    'expand': 'Expand',
    'lightMode': 'Light Mode',
    'darkMode': 'Dark Mode',
    'language': 'Language',

    // Theme names
    'theme.indigo': 'Indigo',
    'theme.blue': 'Ocean',
    'theme.emerald': 'Emerald',
    'theme.amber': 'Sunset',
    'theme.rose': 'Rose',
    'theme.violet': 'Purple',

    // Theme descriptions
    'theme.indigo.desc': 'Professional & Modern',
    'theme.blue.desc': 'Calm & Trustworthy',
    'theme.emerald.desc': 'Fresh & Natural',
    'theme.amber.desc': 'Warm & Energetic',
    'theme.rose.desc': 'Bold & Vibrant',
    'theme.violet.desc': 'Creative & Elegant',
  },
  zh: {
    // Sidebar
    'nav.find': '搜索糖果',
    'nav.cd': '浏览分类',
    'nav.man': '使用指南',
    'nav.create': '创建技能',
    'nav.library': '我的技能',
    'theme': '主题',
    'chooseTheme': '选择主题',
    'cart': '购物车',
    'login': '登录',
    'logout': '退出',
    'collapse': '收起',
    'expand': '展开',
    'lightMode': '浅色模式',
    'darkMode': '深色模式',
    'language': '语言',

    // Theme names
    'theme.indigo': '靛蓝',
    'theme.blue': '海洋',
    'theme.emerald': '翠绿',
    'theme.amber': '日落',
    'theme.rose': '玫瑰',
    'theme.violet': '紫色',

    // Theme descriptions
    'theme.indigo.desc': '专业现代',
    'theme.blue.desc': '冷静可信',
    'theme.emerald.desc': '清新自然',
    'theme.amber.desc': '温暖活力',
    'theme.rose.desc': '大胆鲜艳',
    'theme.violet.desc': '创意优雅',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
