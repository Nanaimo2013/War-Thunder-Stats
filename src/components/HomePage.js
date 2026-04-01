import React, { useMemo } from 'react';
import {
    Users, Trophy, BarChart2, DollarSign, FlaskConical, Target,
    TrendingUp, Award, Swords, Shield, Activity, ArrowRight,
    GitCompare, FileText, Database
} from 'lucide-react';
import { formatNumber, formatCompact } from '../utils/helpers';

const fmtK = (n) => {
    if (!Number.isFinite(n)) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};

const KPI_CARD_STYLE = (accent) => ({
    background: 'linear-gradient(145deg, #101a30 0%, #0d1528 100%)',
    border: `1px solid ${accent}22`,
    borderRadius: 14,
    padding: '20px 22px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    cursor: 'default',
});

function KPICard({ icon: Icon, label, value, sub, accent = '#60a5fa', delay = 0 }) {
    return (
        <div className="wt-animate-in" style={{ ...KPI_CARD_STYLE(accent), animationDelay: `${delay}s` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: accent, opacity: 0.04 }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={accent} />
                </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.02em', lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 3, fontFamily: "'Inter', sans-serif" }}>{sub}</div>}
        </div>
    );
}

const FEATURE_ITEMS = [
    { icon: BarChart2,  label: 'Deep Analytics',    desc: 'Kills, economy, activity trends',  accent: '#60a5fa' },
    { icon: GitCompare, label: 'Player Compare',     desc: 'Side-by-side radar & stats',        accent: '#a78bfa' },
    { icon: Trophy,     label: 'Leaderboard',        desc: 'Rank players by any metric',        accent: '#f59e0b' },
    { icon: FileText,   label: 'Battle Logs',        desc: 'Full history with overlay viewer',  accent: '#22d3ee' },
    { icon: Database,   label: 'Data Management',    desc: 'Import, export, backup & restore',  accent: '#4ade80' },
    { icon: Users,      label: 'Multi-Profile',      desc: 'Track unlimited players',           accent: '#fb7185' },
];

const HomePage = ({ users, setCurrentPage }) => {
    const stats = useMemo(() => {
        let battles = 0, kills = 0, air = 0, sl = 0, rp = 0, wins = 0, defeats = 0, assists = 0, activity = 0;
        users.forEach(u => (u.battles || []).forEach(b => {
            battles++;
            kills    += b.killsGround    || 0;
            air      += b.killsAircraft  || 0;
            sl       += b.earnedSL       || 0;
            rp       += b.totalRP        || 0;
            assists  += b.assists        || 0;
            activity += b.activity       || 0;
            if (b.result === 'Victory') wins++;
            if (b.result === 'Defeat')  defeats++;
        }));
        return {
            users: users.length, battles, kills, air, sl, rp, wins, defeats, assists,
            winRate: battles > 0 ? (wins / battles) * 100 : 0,
            avgActivity: battles > 0 ? activity / battles : 0,
        };
    }, [users]);

    const hasData = stats.battles > 0;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#04080f', minHeight: '100vh' }}>
            {/* ── Hero ─────────────────────────────────────────── */}
            <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
                {/* Radial glow */}
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center', position: 'relative' }}>
                    <div className="wt-animate-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, fontSize: 12, color: '#60a5fa', fontWeight: 500, marginBottom: 24, letterSpacing: '0.02em' }}>
                        <Swords size={12} />
                        WAR THUNDER STATS TRACKER
                    </div>

                    <h1 className="wt-animate-in wt-stagger-1" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 'clamp(36px, 6vw, 68px)', letterSpacing: '0.02em', color: '#e2e8f0', lineHeight: 1.1, marginBottom: 16, textTransform: 'uppercase' }}>
                        Command Your <br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Battle Intelligence</span>
                    </h1>

                    <p className="wt-animate-in wt-stagger-2" style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px', fontWeight: 400 }}>
                        Track performance, analyze detailed statistics, and compare your prowess
                        with other players. Dive deep into your War Thunder combat history.
                    </p>

                    <div className="wt-animate-in wt-stagger-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {setCurrentPage && (
                            <>
                                <button
                                    onClick={() => setCurrentPage('data-management')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 16px rgba(59,130,246,0.4)', transition: 'all 0.18s' }}
                                >
                                    Get Started <ArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage('stats')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 9, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s' }}
                                >
                                    View Stats <BarChart2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Quick KPIs ───────────────────────────────────── */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 48 }}>
                    {[
                        { icon: Users,     label: 'Players',      value: stats.users,                                accent: '#60a5fa' },
                        { icon: Trophy,    label: 'Total Battles', value: fmtK(stats.battles),                       accent: '#f59e0b' },
                        { icon: TrendingUp,label: 'Win Rate',      value: `${stats.winRate.toFixed(1)}%`, sub: `${formatNumber(stats.wins)} wins`, accent: '#4ade80' },
                        { icon: Activity,  label: 'Avg Activity',  value: `${stats.avgActivity.toFixed(1)}%`,        accent: '#a78bfa' },
                        { icon: Target,    label: 'Ground Kills',  value: fmtK(stats.kills),                         accent: '#fb7185' },
                        { icon: Award,     label: 'Air Kills',     value: fmtK(stats.air),                           accent: '#22d3ee' },
                    ].map((k, i) => (
                        <KPICard key={k.label} {...k} delay={i * 0.04} />
                    ))}
                </div>

                {/* Economy row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 56 }}>
                    <KPICard icon={DollarSign}  label="Silver Lions Earned"  value={fmtK(stats.sl)} sub="Total SL accumulated"  accent="#f59e0b" delay={0.24} />
                    <KPICard icon={FlaskConical} label="Research Points"      value={fmtK(stats.rp)} sub="Total RP gained"       accent="#22d3ee" delay={0.28} />
                    <KPICard icon={Shield}       label="Total Assists"        value={fmtK(stats.assists)} sub="Team support actions" accent="#4ade80" delay={0.32} />
                </div>
            </div>

            {/* ── Features grid ────────────────────────────────── */}
            <div style={{ background: 'rgba(59,130,246,0.03)', borderTop: '1px solid rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 36 }}>
                        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e2e8f0', marginBottom: 8 }}>
                            Everything You Need
                        </h2>
                        <p style={{ fontSize: 13, color: '#475569' }}>Comprehensive tools for War Thunder performance analysis</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        {FEATURE_ITEMS.map(({ icon: Icon, label, desc, accent }, i) => (
                            <div key={label} className="wt-animate-in" style={{ background: 'linear-gradient(145deg,#101a30,#0d1528)', border: `1px solid ${accent}18`, borderRadius: 12, padding: '18px 16px', animationDelay: `${i * 0.05}s`, transition: 'all 0.2s' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${accent}14`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Icon size={17} color={accent} />
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#c8d5e8', marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>{label}</div>
                                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CTA / empty state ────────────────────────────── */}
            {!hasData && (
                <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 24px' }}>
                    <div style={{ background: 'linear-gradient(145deg,#101a30,#0d1528)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: '36px 32px', textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                            <Database size={24} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e2e8f0', marginBottom: 8 }}>No Data Yet</h3>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                            Head to <strong style={{ color: '#60a5fa' }}>Data Management</strong> to create a player profile and import your first battle session.
                        </p>
                        {setCurrentPage && (
                            <button
                                onClick={() => setCurrentPage('data-management')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 12px rgba(59,130,246,0.35)' }}
                            >
                                Add Battle Data <ArrowRight size={13} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage; 