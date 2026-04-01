import React from 'react';
import { Info, Target, BarChart2, Users, Shield, Database, TrendingUp, Award, Swords, Upload, CheckCircle, ArrowRight, GitCompare, FileText } from 'lucide-react';

const S = {
    page: { background: '#04080f', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    wrap: { maxWidth: 900, margin: '0 auto', padding: '40px 20px 56px' },
    card: { background: 'linear-gradient(145deg,#0f1a2e,#0d1528)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '24px' },
    secTitle: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
    secTitleText: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e2e8f0' },
    iconBox: (c) => ({ width: 34, height: 34, borderRadius: 9, background: `${c}18`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.16)', borderRadius: 20, fontSize: 11, color: '#60a5fa', fontWeight: 500 },
};

const FEATURES = [
    { icon: BarChart2,  label: 'Deep Battle Analytics',  desc: 'Per-battle and aggregated stats: kills, SL, RP, activity',   accent: '#60a5fa' },
    { icon: GitCompare, label: 'Player Comparison',      desc: 'Side-by-side radar charts and stat comparisons',             accent: '#a78bfa' },
    { icon: Award,      label: 'Leaderboard',            desc: 'Sort & filter players by any metric',                        accent: '#f59e0b' },
    { icon: FileText,   label: 'Battle Log Viewer',      desc: 'Full history with detailed overlay per battle',              accent: '#22d3ee' },
    { icon: Database,   label: 'Import / Export',        desc: 'JSON backup and restore, CSV export',                       accent: '#4ade80' },
    { icon: Users,      label: 'Multi-Profile',          desc: 'Track and compare unlimited players locally',               accent: '#fb7185' },
];

const STEPS = [
    { n: '1', title: 'Create a Profile',      desc: 'Head to Data Management and add a player name.' },
    { n: '2', title: 'Paste Battle Logs',     desc: 'Copy your War Thunder session log and paste it into the parser.' },
    { n: '3', title: 'Explore Stats',         desc: 'Browse the Stats page for charts, tables, and economy data.' },
    { n: '4', title: 'Compare & Export',      desc: 'Use Compare or Leaderboard to benchmark, then export your data.' },
];

const TECH = ['React 18', 'Recharts', 'Lucide Icons', 'localStorage', 'React.lazy', 'Inter + Rajdhani'];

const AboutPage = () => (
    <div style={S.page}>
        <div style={S.wrap}>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
                    <Swords size={26} color="#fff" strokeWidth={2.5} />
                </div>
                <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e2e8f0', marginBottom: 10 }}>
                    War Thunder Stats Tracker
                </h1>
                <p style={{ fontSize: 14, color: '#475569', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                    An unofficial fan-built tool to track, analyze, and compare your War Thunder battle performance — all stored privately in your browser.
                </p>
            </div>

            {/* Two-col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 20, marginBottom: 20 }}>
                {/* Features */}
                <div style={S.card}>
                    <div style={S.secTitle}>
                        <div style={S.iconBox('#60a5fa')}><BarChart2 size={16} color="#60a5fa" /></div>
                        <span style={S.secTitleText}>Features</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FEATURES.map(({ icon: Icon, label, desc, accent }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: `${accent}08`, border: `1px solid ${accent}14`, borderRadius: 10 }}>
                                <div style={{ ...S.iconBox(accent), marginTop: 1 }}><Icon size={14} color={accent} /></div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#c8d5e8', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={S.card}>
                        <div style={S.secTitle}>
                            <div style={S.iconBox('#a78bfa')}><ArrowRight size={16} color="#a78bfa" /></div>
                            <span style={S.secTitleText}>How It Works</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {STEPS.map(({ n, title, desc }) => (
                                <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: '#60a5fa', flexShrink: 0 }}>{n}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#c8d5e8', marginBottom: 2 }}>{title}</div>
                                        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* What we track */}
                    <div style={S.card}>
                        <div style={S.secTitle}>
                            <div style={S.iconBox('#4ade80')}><Target size={16} color="#4ade80" /></div>
                            <span style={S.secTitleText}>What We Track</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                                { label: 'Battle Results', sub: 'Win / Defeat / Draw' },
                                { label: 'Combat Stats',  sub: 'Kills, assists, damage' },
                                { label: 'Economy',       sub: 'SL, RP, CRP earned' },
                                { label: 'Performance',   sub: 'Activity %, time played' },
                            ].map(({ label, sub }) => (
                                <div key={label} style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: 9, padding: '10px 12px' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#c8d5e8', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech stack */}
                    <div style={S.card}>
                        <div style={S.secTitle}>
                            <div style={S.iconBox('#22d3ee')}><Info size={16} color="#22d3ee" /></div>
                            <span style={S.secTitleText}>Built With</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {TECH.map(t => <span key={t} style={S.badge}>{t}</span>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ ...S.card, textAlign: 'center', borderColor: 'rgba(245,158,11,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <Shield size={14} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Important Notice</span>
                </div>
                <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
                    This is an unofficial fan-made tool not affiliated with, endorsed, or sponsored by Gaijin Entertainment.
                    War Thunder and its associated logos are trademarks of Gaijin Entertainment.
                    All battle data is stored locally in your browser — nothing is sent to any server.
                </p>
            </div>
        </div>
    </div>
);

export default AboutPage; 