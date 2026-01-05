import { Shield, Zap, Smartphone, Globe2, Users, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PCBAnimation from './PCBAnimation';

export default function Features() {
  const { t } = useTranslation();
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setVisibleCards((prev) => [...new Set([...prev, index])]);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Shield, titleKey: 'features.reliableData.title', descKey: 'features.reliableData.description', color: 'from-blue-500 to-blue-600' },
    { icon: Zap, titleKey: 'features.realTimeAlerts.title', descKey: 'features.realTimeAlerts.description', color: 'from-yellow-500 to-orange-500' },
    { icon: Smartphone, titleKey: 'features.mobileAccess.title', descKey: 'features.mobileAccess.description', color: 'from-purple-500 to-pink-500' },
    { icon: Globe2, titleKey: 'features.wideCoverage.title', descKey: 'features.wideCoverage.description', color: 'from-green-500 to-emerald-600' },
    { icon: Users, titleKey: 'features.communityDriven.title', descKey: 'features.communityDriven.description', color: 'from-indigo-500 to-purple-600' },
    { icon: Leaf, titleKey: 'features.ecoFriendly.title', descKey: 'features.ecoFriendly.description', color: 'from-teal-500 to-green-600' },
  ];

  return (
    <section id="features" className="py-20 px-6 text-white relative overflow-hidden">
      <PCBAnimation />
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 via-green-800/40 to-green-900/60 z-0" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 animate-fadeIn">
          <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4">{t('features.badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">{t('features.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={feature.titleKey} data-index={index} className={`feature-card group relative transform ${visibleCards.includes(index) ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} transition-all duration-500`} style={{ transitionDelay: `${index * 100}ms` }}>
              <div className="relative p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:-translate-y-2 transition-all duration-300 h-full">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} rounded-t-2xl`}></div>
                <div className={`w-14 h-14 mb-6 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t(feature.titleKey)}</h3>
                <p className="text-white/80 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 relative">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center animate-fadeIn">
            <h3 className="text-3xl font-bold mb-4">{t('features.techStack.title')}</h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">{t('features.techStack.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['React 18', 'TypeScript', 'Firebase', 'LoRaWAN', 'Tailwind CSS', 'Cloud Functions'].map((tech) => (
                <span key={tech} className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-colors cursor-default">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
      `}</style>
    </section>
  );
}
