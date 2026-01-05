import { Activity, Wifi, AlertCircle, Globe } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const duration = 2000; const steps = 60; const stepTime = duration / steps; const increment = value / steps; let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) { setCount(value); clearInterval(timer); } else { setCount(Math.floor(current)); }
        }, stepTime);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [value]);

  return <div ref={elementRef} className="text-3xl font-bold text-[#343A40] mb-1">{count}{suffix}</div>;
}

export default function Statistics() {
  const { t } = useTranslation();

  const stats = [
    { icon: Activity, labelKey: 'statistics.activeSensors', value: 150, suffix: '+' },
    { icon: Wifi, labelKey: 'statistics.coverageAreas', value: 12, suffix: '' },
    { icon: AlertCircle, labelKey: 'statistics.realTimeAlerts', value: 24, suffix: '/7' },
    { icon: Globe, labelKey: 'statistics.countries', value: 5, suffix: '' },
  ];

  return (
    <section className="py-16 bg-white border-y border-[#F8F9FA] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#2E8B57] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#3CB371] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={stat.labelKey} className="text-center group hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-[#2E8B57]/20 rounded-full animate-ping"></div>
                <stat.icon className="w-10 h-10 text-[#2E8B57] mx-auto relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <Counter value={stat.value} suffix={stat.suffix} />
              <div className="text-sm text-[#343A40]/70 font-medium">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
