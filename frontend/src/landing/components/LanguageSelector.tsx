import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳' },
];

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const currentLang = languages.find(lang => lang.code === language);

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group" aria-label="Select language">
                <Globe className="w-5 h-5 text-[#343A40] group-hover:text-[#2E8B57] transition-colors" />
                <span className="text-2xl">{currentLang?.flag}</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slideDown">
                        {languages.map((lang) => (
                            <button key={lang.code} onClick={() => { setLanguage(lang.code as 'fr' | 'en' | 'ar'); setIsOpen(false); }} className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${language === lang.code ? 'bg-[#2E8B57]/5' : ''}`}>
                                <span className="text-2xl">{lang.flag}</span>
                                <span className={`flex-1 text-left font-medium ${language === lang.code ? 'text-[#2E8B57]' : 'text-[#343A40]'}`}>{lang.name}</span>
                                {language === lang.code && (<Check className="w-4 h-4 text-[#2E8B57]" />)}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-slideDown { animation: slideDown 0.2s ease-out; }`}</style>
        </div>
    );
}
