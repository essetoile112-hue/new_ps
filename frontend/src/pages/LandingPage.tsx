import Header from '../landing/components/Header';
import Hero from '../landing/components/Hero';
import Statistics from '../landing/components/Statistics';
import Mission from '../landing/components/Mission';
import Products from '../landing/components/Products';
import Features from '../landing/components/Features';
import Contact from '../landing/components/Contact';
import Footer from '../landing/components/Footer';
import ScrollToTop from '../landing/components/ScrollToTop';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Statistics />
      <Mission />
      <Products />
      <Features />
      <Contact />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
