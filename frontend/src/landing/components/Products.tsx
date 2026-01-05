import { MapPin, Truck, LineChart, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Products() {
  const { t } = useTranslation();
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { const index = parseInt(entry.target.getAttribute('data-index') || '0'); setVisibleCards((prev) => [...new Set([...prev, index])]); } }); }, { threshold: 0.1 });
    document.querySelectorAll('.product-card').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const products = [
    { icon: MapPin, titleKey: 'products.fixed.title', descKey: 'products.fixed.description', featuresKey: 'products.fixed.features', gradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Truck, titleKey: 'products.mobile.title', descKey: 'products.mobile.description', featuresKey: 'products.mobile.features', gradient: 'from-green-500 to-emerald-600', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: LineChart, titleKey: 'products.analytics.title', descKey: 'products.analytics.description', featuresKey: 'products.analytics.features', gradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Users, titleKey: 'products.access.title', descKey: 'products.access.description', featuresKey: 'products.access.features', gradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  ];

  return (
    <section id="products" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2E8B57]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 animate-fadeIn">
          <span className="inline-block px-4 py-2 bg-[#2E8B57]/10 text-[#2E8B57] rounded-full text-sm font-semibold mb-4 hover:bg-[#2E8B57]/20 transition-colors">{t('products.badge')}</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#343A40] mb-4">{t('products.title')}</h2>
          <p className="text-lg text-[#343A40]/70 max-w-2xl mx-auto">{t('products.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <div key={product.titleKey} data-index={index} className={`product-card group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ${visibleCards.includes(index) ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${index * 150}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-r ${product.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
              <div className={`h-2 bg-gradient-to-r ${product.gradient}`} />
              <div className="p-8 relative">
                <div className={`w-16 h-16 ${product.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${product.gradient} opacity-0 group-hover:opacity-30 blur-md rounded-2xl`} />
                  <product.icon className={`w-8 h-8 ${product.iconColor} relative z-10`} />
                </div>
                <h3 className="text-2xl font-bold text-[#343A40] mb-3 group-hover:text-[#2E8B57] transition-colors">{t(product.titleKey)}</h3>
                <p className="text-[#343A40]/70 mb-6 leading-relaxed">{t(product.descKey)}</p>
                <div className="space-y-3">
                  {(() => {
                    const raw = t(product.featuresKey, { returnObjects: true });
                    const features = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
                    return features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 group-hover:translate-x-2 transition-transform" style={{ transitionDelay: `${idx * 50}ms` }}>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.gradient} group-hover:scale-150 transition-transform`} />
                        <span className="text-[#343A40]/80 text-sm font-medium">{feature}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
      `}</style>
    </section>
  );
}
