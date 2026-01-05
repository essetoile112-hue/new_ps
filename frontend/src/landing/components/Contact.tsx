import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', organization: '', message: '' });
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you! Your message has been sent.');
    setFormData({ name: '', email: '', organization: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 px-6 bg-[#F8F9FA] relative overflow-hidden">
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#2E8B57]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#2E8B57]/10 text-[#2E8B57] rounded-full text-sm font-semibold mb-4">{t('contact.badge')}</span>
          <h2 className="text-4xl font-bold text-[#343A40] mb-4">{t('contact.title')}</h2>
          <p className="text-lg text-[#343A40]/70 max-w-2xl mx-auto">{t('contact.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-[#343A40] mb-6">{t('contact.info')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
                  <div className="p-3 bg-[#2E8B57]/10 rounded-lg group-hover:bg-[#2E8B57]/20 transition-colors"><Mail className="w-6 h-6 text-[#2E8B57]" /></div>
                  <div>
                    <div className="font-semibold text-[#343A40]">{t('contact.email')}</div>
                    <a href="mailto:contact@u4green-africa.com" className="text-[#343A40]/70 hover:text-[#2E8B57] transition-colors">contact@u4green-africa.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
                  <div className="p-3 bg-[#2E8B57]/10 rounded-lg group-hover:bg-[#2E8B57]/20 transition-colors"><Phone className="w-6 h-6 text-[#2E8B57]" /></div>
                  <div>
                    <div className="font-semibold text-[#343A40]">{t('contact.phone')}</div>
                    <div className="text-[#343A40]/70">+216 25 419 190 / +216 21 987 638</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
                  <div className="p-3 bg-[#2E8B57]/10 rounded-lg group-hover:bg-[#2E8B57]/20 transition-colors"><MapPin className="w-6 h-6 text-[#2E8B57]" /></div>
                  <div>
                    <div className="font-semibold text-[#343A40]">{t('contact.location')}</div>
                    <div className="text-[#343A40]/70">{t('contact.locationValue')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-[#343A40] mb-6">{t('contact.team')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="aspect-square overflow-hidden"><img src="/assets/images/eyaAloui.jpg" alt="Eya Aloui" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="font-bold text-white text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Eya Aloui</span>
                    <span className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">CEO</span>
                    <span className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">+216 21 987 638</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white group-hover:translate-y-full transition-transform duration-300">
                    <div className="font-semibold text-[#343A40] text-sm">Eya Aloui</div>
                    <div className="text-[#343A40]/70 text-xs">CEO</div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="aspect-square overflow-hidden"><img src="/assets/images/ghaithHafdhaoui.jpg" alt="Ghaith Hafdhaoui" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="font-bold text-white text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Ghaith Hafdhaoui</span>
                    <span className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">COO</span>
                    <span className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">+216 25 419 190</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white group-hover:translate-y-full transition-transform duration-300">
                    <div className="font-semibold text-[#343A40] text-sm">Ghaith Hafdhaoui</div>
                    <div className="text-[#343A40]/70 text-xs">COO</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#343A40] mb-2">{t('contact.form.name')}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all ${focusedField === 'name' ? 'border-[#2E8B57] ring-2 ring-[#2E8B57]/20 scale-[1.02]' : 'border-[#343A40]/20'}`} placeholder={t('contact.form.namePlaceholder')} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#343A40] mb-2">{t('contact.form.email')}</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all ${focusedField === 'email' ? 'border-[#2E8B57] ring-2 ring-[#2E8B57]/20 scale-[1.02]' : 'border-[#343A40]/20'}`} placeholder={t('contact.form.emailPlaceholder')} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#343A40] mb-2">{t('contact.form.organization')}</label>
                <input type="text" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} onFocus={() => setFocusedField('organization')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all ${focusedField === 'organization' ? 'border-[#2E8B57] ring-2 ring-[#2E8B57]/20 scale-[1.02]' : 'border-[#343A40]/20'}`} placeholder={t('contact.form.organizationPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#343A40] mb-2">{t('contact.form.message')}</label>
                <textarea rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} onFocus={() => setFocusedField('message')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all resize-none ${focusedField === 'message' ? 'border-[#2E8B57] ring-2 ring-[#2E8B57]/20 scale-[1.02]' : 'border-[#343A40]/20'}`} placeholder={t('contact.form.messagePlaceholder')} required />
              </div>
              <button type="submit" className="relative w-full bg-[#2E8B57] text-white py-3 rounded-lg hover:bg-[#3CB371] transition-all font-semibold overflow-hidden group hover:scale-105">
                <span className="relative z-10">{t('contact.form.submit')}</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
