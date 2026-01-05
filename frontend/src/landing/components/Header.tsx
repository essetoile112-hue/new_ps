import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import logoSvg from '../../assets/images/u4-logo.svg';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['home', 'mission', 'products', 'features', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-lg' : 'bg-white/95 backdrop-blur-sm shadow-sm'}`}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-full bg-white/5">
              <img
                src="/assets/icons/u4-logo.png"
                alt="U4GREEN Africa"
                className="h-12 w-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('img.fallback-svg') as HTMLImageElement | null;
                    if (fallback) fallback.style.display = 'block';
                  }
                }}
              />
              <img src={logoSvg} alt="U4GREEN" className="fallback-svg h-12 w-auto hidden" />
            </div>
            <span className="text-2xl font-bold text-[#343A40] group-hover:text-[#2E8B57] transition-colors">U4GREEN Africa</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['home', 'mission', 'products', 'features', 'contact'].map((section) => (
              <a key={section} href={`#${section}`} onClick={(e) => scrollToSection(e, section)} className={`relative text-[#343A40] hover:text-[#2E8B57] transition-colors font-medium ${activeSection === section ? 'text-[#2E8B57]' : ''}`}>
                {t(`header.${section}`)}
                {activeSection === section && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#2E8B57] rounded-full" />}
              </a>
            ))}

            <LanguageSelector />

            {/* Always show Sign in button in navbar (replaces Dashboard for landing) */}
            <Link to="/auth" className="bg-[#2E8B57] text-white px-6 py-2 rounded-lg hover:bg-[#3CB371] hover:scale-105 transition-all shadow-md hover:shadow-lg">{t('header.signin', 'Sign in')}</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

