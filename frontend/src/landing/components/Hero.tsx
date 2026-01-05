import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section id="home" className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/assets/videos/index.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-green-900/40 mix-blend-multiply" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">{t('hero.title')}</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto drop-shadow-md">{t('hero.subtitle')}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="inline-flex items-center gap-2 bg-[#2E8B57] text-white px-8 py-4 rounded-lg hover:bg-[#3CB371] transition-all hover:scale-105 shadow-lg">{t('hero.exploreButton')}<ArrowRight className="w-5 h-5" /></a>
            <a href="#contact" className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-[#2E8B57] transition-all shadow-lg">{t('hero.contactButton')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

