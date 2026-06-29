import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Mic,
    Factory,
    Boxes,
    ClipboardCheck,
    LineChart,
    ShoppingCart,
    Sparkles,
    ShieldCheck,
    Clock,
    Languages,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

const NAVY = '#2e2e7a';
const NAVY_DARK = '#1f1f5c';
const GOLD = '#f5b829';

const INDUSTRIES = [
    { icon: Factory, name: 'Manufacturing', desc: 'Capture shop-floor production, machine output and shift data by voice — in real time.' },
    { icon: Boxes, name: 'Textile', desc: 'From yarn and twine to winding, doubling and packing — record every stage hands-free.' },
    { icon: Sparkles, name: 'Chemical', desc: 'Log batches, quality checks and dispatches accurately, even in gloves-on environments.' },
    { icon: ClipboardCheck, name: 'Pharmaceuticals', desc: 'Voice-driven entries with built-in validation for traceable, audit-ready records.' },
    { icon: ShoppingCart, name: 'Food & Processing', desc: 'Track receipts, production and stock movement without stopping to type.' },
    { icon: LineChart, name: 'Automotive & More', desc: 'Any process-driven operation that needs fast, accurate data from the floor.' },
];

const FEATURES = [
    { icon: Mic, title: 'Voice-First Data Entry', desc: 'Speak naturally and Voice2Data converts your words into structured ERP records — no keyboards, no forms to hunt through.' },
    { icon: Sparkles, title: 'AI Grounding & Smart Matching', desc: 'AI matches what you say to your masters — customers, items, machines — so entries are clean and consistent every time.' },
    { icon: Factory, title: 'Production & Shop-Floor Tracking', desc: 'Record production, machine and shift data live from the floor, keeping plans and actuals always in sync.' },
    { icon: ShoppingCart, title: 'Sales Orders & Dispatch', desc: 'Create orders, manage dispatch and keep customers updated from one connected workflow.' },
    { icon: Boxes, title: 'Inventory & Stock Control', desc: 'Real-time visibility of receipts, stock and movement across stores and the shop floor.' },
    { icon: LineChart, title: 'Live Dashboards & Reports', desc: 'Management dashboards and reports turn day-to-day entries into decisions you can act on.' },
];

const BENEFITS = [
    { icon: Clock, title: 'Faster on the floor', desc: 'Entries that took minutes of typing now take seconds of speaking.' },
    { icon: ShieldCheck, title: 'Fewer errors', desc: 'AI validation against your master data catches mistakes before they enter your system.' },
    { icon: Languages, title: 'Works for everyone', desc: 'Operators enter data in plain language, lowering training time and adoption barriers.' },
];

export default function LandingPage() {
    const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', industry: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        // No backend endpoint yet — capture intent client-side and acknowledge.
        // Falls back to opening the user's mail client so the request is not lost.
        const subject = encodeURIComponent('Voice2Data ERP — Demo Request');
        const body = encodeURIComponent(
            `Name: ${form.name}\nCompany: ${form.company}\nEmail: ${form.email}\nPhone: ${form.phone}\nIndustry: ${form.industry}\n\n${form.message}`
        );
        window.location.href = `mailto:sales@voice2data.app?subject=${subject}&body=${body}`;
        setSubmitted(true);
    };

    const input = {
        width: '100%',
        padding: '0.7rem 0.9rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        outline: 'none',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        backgroundColor: 'white',
    };

    const scrollToDemo = (e) => {
        e.preventDefault();
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div style={{ background: 'var(--surface-gray)', color: 'var(--text-main)' }}>
            {/* Hero */}
            <section style={{
                background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 60%, #3a3a96 100%)`,
                color: 'white',
                padding: '5rem 1.5rem 5.5rem',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(245,184,41,0.15)', color: GOLD,
                        padding: '0.4rem 0.9rem', borderRadius: 999, fontSize: '0.8rem',
                        fontWeight: 600, marginBottom: '1.75rem', letterSpacing: '0.02em',
                    }}>
                        <Sparkles size={15} /> AI-first · Voice-first ERP
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800,
                        lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: '1.25rem',
                    }}>
                        Speak your operations<br />straight into data.
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)', color: 'rgba(255,255,255,0.82)',
                        maxWidth: 680, margin: '0 auto 2.25rem', lineHeight: 1.6,
                    }}>
                        Voice2Data ERP helps manufacturing, textile, chemical and process-driven
                        businesses capture shop-floor data by voice — no typing, no delays, no errors.
                    </p>
                    <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="#demo" onClick={scrollToDemo} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: GOLD, color: NAVY_DARK, fontWeight: 700,
                            padding: '0.85rem 1.6rem', borderRadius: 10, textDecoration: 'none',
                            fontSize: '1rem', boxShadow: '0 8px 20px -6px rgba(245,184,41,0.5)',
                        }}>
                            Request a Demo <ArrowRight size={18} />
                        </a>
                        <Link to="/login" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
                            padding: '0.85rem 1.6rem', borderRadius: 10, textDecoration: 'none',
                            fontSize: '1rem', border: '1px solid rgba(255,255,255,0.25)',
                        }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Industries */}
            <section style={{ maxWidth: 1180, margin: '0 auto', padding: '4.5rem 1.5rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Built for every industry that runs on data
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 620, margin: '0 auto' }}>
                        One voice-driven ERP, adaptable to the way your industry actually works.
                    </p>
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem',
                }}>
                    {INDUSTRIES.map(({ icon: Icon, name, desc }) => (
                        <div key={name} style={{
                            background: 'white', border: '1px solid var(--border-color)',
                            borderRadius: 14, padding: '1.6rem',
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 10, background: 'rgba(46,46,122,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                            }}>
                                <Icon size={22} color={NAVY} />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>{name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ maxWidth: 1180, margin: '0 auto', padding: '4rem 1.5rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Everything you need, driven by your voice
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 640, margin: '0 auto' }}>
                        A complete ERP — masters, production, sales, stock and quality — reimagined to be spoken, not typed.
                    </p>
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem',
                }}>
                    {FEATURES.map(({ icon: Icon, title, desc }) => (
                        <div key={title} style={{
                            background: 'white', border: '1px solid var(--border-color)',
                            borderRadius: 14, padding: '1.75rem', display: 'flex', gap: '1rem',
                        }}>
                            <div style={{
                                width: 44, height: 44, flexShrink: 0, borderRadius: 10,
                                background: 'rgba(245,184,41,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={22} color="#b8851a" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits strip */}
            <section style={{ maxWidth: 1180, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
                <div style={{
                    background: NAVY_DARK, borderRadius: 20, padding: 'clamp(2rem, 4vw, 3rem)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem',
                }}>
                    {BENEFITS.map(({ icon: Icon, title, desc }) => (
                        <div key={title}>
                            <Icon size={26} color={GOLD} />
                            <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, margin: '0.75rem 0 0.4rem' }}>{title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.97rem', lineHeight: 1.55 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Demo / Sign-up form */}
            <section id="demo" style={{ background: 'white', borderTop: '1px solid var(--border-color)', padding: '4.5rem 1.5rem' }}>
                <div style={{
                    maxWidth: 1040, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem',
                    alignItems: 'start',
                }}>
                    <div>
                        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 800, marginBottom: '1rem' }}>
                            See Voice2Data in your operation
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                            Tell us a little about your business and we’ll set up a personalized demo
                            tailored to your industry and workflows.
                        </p>
                        {['Tailored to your industry and processes', 'Live walkthrough with our team', 'No commitment — just a conversation'].map((t) => (
                            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                <CheckCircle2 size={20} color={NAVY} />
                                <span style={{ color: 'var(--text-main)', fontSize: '0.97rem' }}>{t}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'var(--surface-gray)', border: '1px solid var(--border-color)',
                        borderRadius: 16, padding: '2rem',
                    }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                                <CheckCircle2 size={48} color={NAVY} style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Thank you!</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
                                    Your demo request is on its way. Our team will reach out to you shortly
                                    to schedule a session.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Request a Demo</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <input style={input} name="name" placeholder="Your name *" value={form.name} onChange={handleChange} required />
                                    <input style={input} name="company" placeholder="Company *" value={form.company} onChange={handleChange} required />
                                    <input style={input} type="email" name="email" placeholder="Work email *" value={form.email} onChange={handleChange} required />
                                    <input style={input} name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
                                    <select style={input} name="industry" value={form.industry} onChange={handleChange} required>
                                        <option value="">Select your industry *</option>
                                        <option>Manufacturing</option>
                                        <option>Textile</option>
                                        <option>Chemical</option>
                                        <option>Pharmaceuticals</option>
                                        <option>Food & Processing</option>
                                        <option>Automotive</option>
                                        <option>Other</option>
                                    </select>
                                    <textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} name="message" placeholder="What would you like to see? (optional)" value={form.message} onChange={handleChange} />
                                    <button type="submit" style={{
                                        marginTop: '0.25rem', background: GOLD, color: NAVY_DARK, fontWeight: 700,
                                        border: 'none', padding: '0.85rem', borderRadius: 10, fontSize: '1rem',
                                        cursor: 'pointer',
                                    }}>
                                        Request a Demo
                                    </button>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', margin: 0 }}>
                                        We’ll only use your details to get in touch about Voice2Data.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: NAVY_DARK, color: 'rgba(255,255,255,0.7)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <img src="/v2d-logo.png" alt="Voice2Data" style={{ height: 36, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    Voice2Data ERP — The AI-first, voice-first ERP for modern industry.
                </p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                    © {new Date().getFullYear()} Voice2Data. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
