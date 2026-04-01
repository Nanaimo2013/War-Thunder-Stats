import React from 'react';
import { Heart, Swords, Github, ExternalLink, BarChart2, Users, Award, GitCompare, FileText, Info, Shield } from 'lucide-react';

const S = {
    footer: {
        background: 'linear-gradient(180deg, #04080f 0%, #070c18 100%)',
        borderTop: '1px solid rgba(59,130,246,0.1)',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    inner: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px 24px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 32 },
    colTitle: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#60a5fa', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 },
    link: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', color: '#475569', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'none', transition: 'color 0.16s', fontFamily: "'Inter', sans-serif' " },
    divider: { height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)', margin: '0 0 20px' },
    bottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 20, fontSize: 11, color: '#475569' },
    iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 8, color: '#475569', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.18s' },
};

const NAV = [
    { label: 'Statistics',   icon: BarChart2, page: 'stats' },
    { label: 'Leaderboard',  icon: Award,     page: 'leaderboard' },
    { label: 'Compare',      icon: GitCompare,page: 'compare-players' },
    { label: 'Battle Logs',  icon: FileText,  page: 'battle-logs' },
    { label: 'Data',         icon: Users,     page: 'data-management' },
    { label: 'About',        icon: Info,      page: 'about' },
];

const FEATURES = ['Advanced Analytics', 'Multi-User Profiles', 'Data Export / Import', 'Battle History', 'Player Comparison', 'localStorage Persistence'];

const Footer = () => {
    const year = new Date().getFullYear();
    return (
        <footer style={S.footer}>
            <div style={S.inner}>
                <div style={S.grid}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(59,130,246,0.35)' }}>
                                <Swords size={15} color="#fff" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e2e8f0' }}>
                                    WAR <span style={{ color: '#60a5fa' }}>THUNDER</span>
                                </div>
                                <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#334155', textTransform: 'uppercase' }}>Stats Tracker</div>
                            </div>
                        </div>
                        <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 14, maxWidth: 220 }}>
                            Track, analyze, and compare your War Thunder battle performance across all players.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#1e293b' }}>
                            <span>Made with</span>
                            <Heart size={11} color="#f43f5e" fill="#f43f5e" />
                            <span>for the community</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <div style={S.colTitle}><Shield size={12} />Navigation</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {NAV.map(({ label, icon: Icon }) => (
                                <span key={label} style={S.link}>
                                    <Icon size={12} />{label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <div style={S.colTitle}><BarChart2 size={12} />Features</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {FEATURES.map(f => (
                                <span key={f} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#1e3a5f', flexShrink: 0 }} />
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <div style={S.colTitle}><Info size={12} />About</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#334155' }}>
                            <span> {year} War Thunder Stats</span>
                            <span>Unofficial fan project</span>
                            <span>Not affiliated with Gaijin</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={S.iconBtn} title="GitHub">
                                <Github size={15} />
                            </a>
                            <a href="https://warthunder.com" target="_blank" rel="noopener noreferrer" style={S.iconBtn} title="War Thunder">
                                <ExternalLink size={15} />
                            </a>
                        </div>
                    </div>
                </div>

                <div style={S.divider} />

                <div style={S.bottom}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={S.badge}>v3.0</span>
                        <span style={S.badge}>React 18</span>
                        <span style={S.badge}>localStorage</span>
                        <span style={S.badge}>Recharts</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#1e293b' }}>Built with React · War Thunder is a trademark of Gaijin Entertainment</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;