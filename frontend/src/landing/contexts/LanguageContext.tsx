import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        const currentLang = (i18n.language || 'en') as Language;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLang;
    }, [i18n.language]);

    return (
        <LanguageContext.Provider value={{ language: i18n.language as Language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
