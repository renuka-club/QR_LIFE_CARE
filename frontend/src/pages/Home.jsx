import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Zap, ArrowRight, QrCode, HeartPulse, UserPlus, FileText, Smartphone, Lock, Globe, Heart, X, Phone, AlertTriangle, ChevronDown, ChevronUp, Database, Server, CheckCircle, Fingerprint } from 'lucide-react';
import Header from '../components/Header';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [calling, setCalling] = useState(false);

  const handleCall = () => {
    setCalling(true);
    setTimeout(() => {
      setCalling(false);
    }, 3000); // Simulate 3s call connection
  };

  const [activeAccordion, setActiveAccordion] = useState(null);
  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="home-wrapper">
      <Header />

      {/* HERO SECTION */}
      <motion.section
        className="hero"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="hero-content">
          <motion.div variants={fadeInUp} className="hero-badge">
            <HeartPulse size={16} className="text-accent" />
            <span>Smart Emergency Response System</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="hero-title">
            QR LIFE <span className="text-gradient">CARE</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="subtitle">
            Your Medical History, Instantly Accessible.
          </motion.p>

          <motion.div variants={fadeInUp} className="description-box">
            <p>Secure, instant access to medical records using QR technology designed for emergencies and everyday healthcare.</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="cta-buttons">
            <button className="btn-primary-glow" onClick={() => navigate('/register')}>
              Register Now <ArrowRight size={18} />
            </button>
            <button className="btn-secondary-glass" onClick={() => navigate('/login')}>
              Member Login
            </button>
            <button className="btn-secondary-glass" onClick={() => setShowDemo(true)}>
              <Smartphone size={18} /> Live Demo
            </button>
            <button className="btn-secondary-glass" onClick={() => window.location.href = '/scan-qr'}>
              <QrCode size={18} /> Scan QR Code
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* STATS SECTION */}
      <div className="stats-section">
        <div className="stat-item">
          <h2>
            <CountUp end={100} suffix="%" />
          </h2>
          <p>Secure & Private</p>
        </div>
        <div className="separator"></div>
        <div className="stat-item">
          <h2>
            <CountUp end={24} suffix="/7" />
          </h2>
          <p>Emergency Access</p>
        </div>
        <div className="separator"></div>
        <div className="stat-item">
          <h2>
            <CountUp end={0} suffix="ms" duration={0.5} />
          </h2>
          <p>Latency</p>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <motion.section
        id="features"
        className="features-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="section-title">Why Choose <span className="text-gradient">QR Life Care?</span></h2>

        <div className="features-grid">
          <motion.div className="feature-card neo-glass" whileHover={{ y: -10 }}>
            <div className="icon-box cyan"><QrCode size={32} /></div>
            <h3>Instant Access</h3>
            <p>One scan reveals critical medical data during emergencies.</p>
          </motion.div>

          <motion.div className="feature-card neo-glass" whileHover={{ y: -10 }}>
            <div className="icon-box purple"><Zap size={32} /></div>
            <h3>AI Health Analysis</h3>
            <p>Smart insights and summaries from your medical reports.</p>
          </motion.div>

          <motion.div className="feature-card neo-glass" whileHover={{ y: -10 }}>
            <div className="icon-box red"><Shield size={32} /></div>
            <h3>Emergency Ready</h3>
            <p>Critical info available 24/7 to first responders.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="how-it-works-section">
        <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>

        <div className="timeline-container">
          <div className="timeline-line"></div>

          {[
            { icon: UserPlus, title: "Create Account", desc: "Sign up and build your medical profile." },
            { icon: FileText, title: "Upload Reports", desc: "Securely upload PDF/JPG medical records." },
            { icon: Zap, title: "AI Analysis", desc: "Our AI extracts key vitals & risks instantly." },
            { icon: QrCode, title: "Get QR Code", desc: "Print your life-saving Emergency QR." }
          ].map((step, index) => (
            <motion.div
              key={index}
              className="timeline-item"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="timeline-dot"></div>
              <div className="timeline-content neo-glass">
                <div className="step-icon"><step.icon size={24} /></div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PREMIUM ADD-ONS SECTION */}
      <section className="security-section">
        <div className="security-card neo-glass">
          <div className="security-header">
            <Zap size={48} className="text-accent" />
            <h2>Premium Add-ons</h2>
          </div>
          <div className="security-grid">
            <div className="security-item">
              <Smartphone size={24} />
              <div>
                <h4>Smart Device Sync</h4>
                <p>Connect wearables for live vitals monitoring.</p>
              </div>
            </div>
            <div className="security-item">
              <UserPlus size={24} />
              <div>
                <h4>Family Sharing</h4>
                <p>Securely link up to 5 family member profiles.</p>
              </div>
            </div>
            <div className="security-item">
              <Globe size={24} />
              <div>
                <h4>Global Travel Mode</h4>
                <p>Auto-translate records for local hospitals.</p>
              </div>
            </div>
            <div className="security-item">
              <Fingerprint size={24} />
              <div>
                <h4>Biometric Emergency Access</h4>
                <p>Direct reports view via fingerprint/FaceID authentication.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="faq-section">
        <h2 className="section-title">Frequently Asked <span className="text-gradient">Questions</span></h2>
        <div className="faq-container">
          {[
            { q: "What if I lose my phone?", a: "Your medical data is stored securely in the cloud. You can access it from any device or reprint your QR code." },
            { q: "Who can scan my code?", a: "Anyone with a standard camera app can scan it in an emergency. You control what data is visible." },
            { q: "Is my data private?", a: "Yes. We use end-to-end encryption. Only you and authorized emergency responders can view critical data." },
            { q: "Does it work offline?", a: "The QR code link works anywhere with internet. For responders without internet, the basic text summary is embedded." }
          ].map((item, index) => (
            <div key={index} className="faq-item neo-glass" onClick={() => toggleAccordion(index)}>
              <div className="faq-question">
                <h3>{item.q}</h3>
                {activeAccordion === index ? <ChevronUp /> : <ChevronDown />}
              </div>
              <AnimatePresence>
                {activeAccordion === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="faq-answer"
                  >
                    <p>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* TRENDY ABOUT SECTION */}
      <div id="about" className="about-badge-container">
        <motion.div
          className="about-badge neo-glass"
          whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.2)" }}
        >
          <div className="about-badge-icon">
            <HeartPulse size={32} className="text-accent" />
          </div>
          <div className="about-badge-content">
            <span className="about-label text-gradient">The Vision</span>
            <p>
              We're redefining the future of healthcare by giving your life-saving medical data a smart, digital heartbeat. Instant emergency access, AI-driven insights, and a seamless flow of information precisely when <span>every second counts</span>.
            </p>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>QR LIFE CARE</h3>
            <p>Protecting lives through smart technology.</p>
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 QR Life Care Systems. All rights reserved.</p>
          <p className="made-with">Made for Humanity</p>
        </div>
      </footer>

      {/* DEMO MODAL */}
      <AnimatePresence>
        {showDemo && (
          <div className="modal-overlay" onClick={() => setShowDemo(false)}>
            <motion.div
              className="phone-mockup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="phone-notch"></div>

              {/* CALLING OVERLAY */}
              <AnimatePresence>
                {calling && (
                  <motion.div
                    className="calling-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="caller-info">
                      <div className="caller-avatar">JD</div>
                      <h2>Calling...</h2>
                      <h3>Jane Doe</h3>
                      <p>Mobile via QR Life</p>
                    </div>
                    <div className="call-actions">
                      <button className="end-call-btn" onClick={() => setCalling(false)}>
                        <Phone size={28} style={{ transform: 'rotate(135deg)' }} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="phone-screen">
                <div className="demo-header">
                  <div className="status-bar">
                    <span>9:41</span>
                    <span>🔋 100%</span>
                  </div>
                  <div className="demo-app-bar">
                    <Shield size={16} /> QR Life Emergency
                  </div>
                </div>

                <div className="demo-content">
                  <div className="demo-alert">
                    <AlertTriangle size={20} />
                    CRITICAL MEDICAL DATA
                  </div>

                  <div className="demo-profile">
                    <div className="demo-avatar">JS</div>
                    <h3>John Smith</h3>
                    <p>Male, 34 Years</p>
                    <div className="demo-blood">A+</div>
                  </div>

                  <div className="demo-section">
                    <h4><Activity size={14} /> Allergies</h4>
                    <div className="demo-tag red">Penicillin</div>
                    <div className="demo-tag red">Peanuts</div>
                  </div>

                  <div className="demo-section">
                    <h4><Phone size={14} /> Emergency Contact</h4>
                    <div className="demo-contact">
                      <span>Jane Doe (Wife)</span>
                      <button className="demo-call-btn" onClick={handleCall}>Call</button>
                    </div>
                  </div>

                  <button className="demo-close-btn" onClick={() => setShowDemo(false)}>
                    <X size={16} /> Close Demo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Helper Component for Counting Up
function CountUp({ end, suffix = "", duration = 2 }) {
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

export default Home;
