import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoSvg from '../../assets/images/u4-logo.svg';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-br from-[#1a472a] to-[#2E8B57] text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 overflow-hidden">
        <svg className="w-full h-12" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z" fill="#F8F9FA" className="animate-wave" />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4 group">
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
              <span className="text-2xl font-bold">U4GREEN Africa</span>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">{t('footer.description')}</p>
            <div className="flex gap-4">{[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-1 group"><Icon className="w-5 h-5 group-hover:rotate-12 transition-transform" /></a>
            ))}</div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">{['home', 'mission', 'products', 'features', 'contact'].map((link) => (
              <li key={link}><a href={`#${link}`} className="text-white/80 hover:text-white transition-all hover:translate-x-2 inline-block relative group"><span className="relative">{t(`header.${link}`)}<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span></span></a></li>
            ))}</ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform"><Mail className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" /><a href="mailto:contact@u4green-africa.com" className="text-white/80 hover:text-white transition-colors">contact@u4green-africa.com</a></li>
              <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform"><Phone className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" /><div className="text-white/80"><div>+216 25 419 190</div><div>+216 21 987 638</div></div></li>
              <li className="flex items-start gap-3 group hover:translate-x-1 transition-transform"><MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" /><span className="text-white/80">{t('contact.locationValue')}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">© {new Date().getFullYear()} U4GREEN Africa. {t('footer.rights')}</p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-white/60 hover:text-white transition-all relative group"><span className="relative">{t('footer.privacy')}<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span></span></Link>
              <Link to="/terms" className="text-white/60 hover:text-white transition-all relative group"><span className="relative">{t('footer.terms')}<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span></span></Link>
              <Link to="/cookies" className="text-white/60 hover:text-white transition-all relative group"><span className="relative">{t('footer.cookies')}<span className="absolute bottom-0 left-0 w-0.5 bg-white group-hover:w-full transition-all duration-300"></span></span></Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave { 0%,100% { d: path("M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z"); } 50% { d: path("M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z"); } }
        .animate-wave { animation: wave 8s ease-in-out infinite; }
      `}</style>
    </footer>
  );
}

