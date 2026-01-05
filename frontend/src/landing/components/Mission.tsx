import { Target, Wind, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Mission() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) setIsVisible(true); }, { threshold: 0.1 });
    const section = document.getElementById('mission'); if (section) observer.observe(section);
    const handleScroll = () => {
      const section = document.getElementById('mission');
      if (section) {
        const rect = section.getBoundingClientRect();
        const scrollProgress = -rect.top / (rect.height + window.innerHeight);
        setScrollY(scrollProgress * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => { observer.disconnect(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const cards = [
    { icon: Target, titleKey: 'mission.problem.title', descKey: 'mission.problem.description', gradient: 'from-red-500 to-orange-500', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
    { icon: Wind, titleKey: 'mission.solution.title', descKey: 'mission.solution.description', gradient: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: BarChart3, titleKey: 'mission.value.title', descKey: 'mission.value.description', gradient: 'from-green-500 to-emerald-600', iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  ];

  return (
    <section id="mission" className="py-20 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2E8B57] via-blue-500 to-purple-500"></div>
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#2E8B57]/5 rounded-full blur-3xl" style={{ transform: `translateY(${scrollY * 0.5}px)` }} />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" style={{ transform: `translateY(${scrollY * -0.3}px)` }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className={`text-center mb-16 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#2E8B57] to-blue-600 text-white rounded-full text-sm font-semibold mb-4 hover:scale-110 transition-transform">{t('mission.badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#343A40] mb-6">{t('mission.title')}</h2>
          <p className="text-lg text-[#343A40]/70 max-w-3xl mx-auto leading-relaxed">{t('mission.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div key={card.titleKey} className={`group relative transform transition-all duration-700 hover:-translate-y-2 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`} style={{ transitionDelay: `${index * 200}ms`, transform: isVisible ? `translateY(${scrollY * (index - 1) * 0.1}px)` : '' }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
              <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 group-hover:border-transparent">
                <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-50 blur-md rounded-2xl`} />
                  <card.icon className={`w-8 h-8 ${card.iconColor} relative z-10`} />
                </div>
                <div className={`h-1 w-16 bg-gradient-to-r ${card.gradient} rounded-full mb-4 group-hover:w-24 transition-all duration-300`} />
                <h3 className="text-2xl font-bold text-[#343A40] mb-4 group-hover:text-[#2E8B57] transition-colors">{t(card.titleKey)}</h3>
                <p className="text-[#343A40]/70 leading-relaxed">{t(card.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
