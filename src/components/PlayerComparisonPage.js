import React, { useState, useMemo } from 'react';
import {
    GitCompare, Users, Target, Trophy, TrendingUp, Activity,
    DollarSign, FlaskConical, Swords, Award, Shield, ChevronDown
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { formatNumber } from '../utils/helpers';

const C1 = '#60a5fa';  // blue  — player 1
const C2 = '#f59e0b';  // amber — player 2

const fmtK = (n) => {
    if (!Number.isFinite(n) || n === 0) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
};

const calcStats = (battles = []) => {
    let gKills = 0, aKills = 0, sl = 0, rp = 0, wins = 0, defeats = 0,
        assists = 0, activity = 0, damage = 0, crp = 0;
    battles.forEach(b => {
        gKills   += b.killsGround    || 0;
        aKills   += b.killsAircraft  || 0;
        sl       += b.earnedSL       || 0;
        rp       += b.totalRP        || 0;
        assists  += b.assists        || 0;
        activity += b.activity       || 0;
        damage   += b.damage         || 0;
        crp      += b.earnedCRP      || 0;
        if (b.result === 'Victory') wins++;
        if (b.result === 'Defeat')  defeats++;
    });
    const n = battles.length;
    return {
        totalBattles: n, wins, defeats,
        totalKillsGround: gKills, totalKillsAircraft: aKills,
        totalAssists: assists, totalEarnedSL: sl,
        overallTotalRP: rp, totalCRP: crp, totalDamage: damage,
        winRate:            n ? (wins / n) * 100 : 0,
        avgActivity:        n ? activity / n : 0,
        avgKills:           n ? (gKills + aKills) / n : 0,
        avgGroundKills:     n ? gKills / n : 0,
        avgAirKills:        n ? aKills / n : 0,
        avgSL:              n ? sl / n : 0,
        avgRP:              n ? rp / n : 0,
    };
};

const S = {
    page:   { background: '#04080f', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    wrap:   { maxWidth: 1200, margin: '0 auto', padding: '32px 20px 56px' },
    card:   { background: 'linear-gradient(145deg,#0f1a2e,#0d1528)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '22px 24px' },
    sel:    { width: '100%', padding: '9px 12px', background: 'rgba(15,26,46,0.9)', border: '1px solid rgba(59,130,246,0.16)', borderRadius: 9, color: '#c8d5e8', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', cursor: 'pointer' },
    label:  { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#475569', marginBottom: 6, display: 'block' },
    secHdr: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16 },
};

const TT_STYLE = { background: '#0f1a2e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, color: '#c8d5e8' };

function PlayerCard({ user, stats, color }) {
    const wr = stats.winRate;
    const wrColor = wr >= 60 ? '#4ade80' : wr >= 40 ? '#f59e0b' : '#fb7185';
    const rows = [
        { label: 'Battles',      value: stats.totalBattles,                      color: '#e2e8f0' },
        { label: 'Win Rate',     value: `${wr.toFixed(1)}%`,                      color: wrColor },
        { label: 'Ground Kills', value: formatNumber(stats.totalKillsGround),     color: '#fb7185' },
        { label: 'Air Kills',    value: formatNumber(stats.totalKillsAircraft),   color: '#60a5fa' },
        { label: 'Assists',      value: formatNumber(stats.totalAssists),         color: '#a78bfa' },
        { label: 'Avg Activity', value: `${stats.avgActivity.toFixed(1)}%`,       color: '#22d3ee' },
        { label: 'Avg Kills/B',  value: stats.avgKills.toFixed(2),               color: '#fb7185' },
        { label: 'SL Earned',    value: fmtK(stats.totalEarnedSL),               color: '#4ade80' },
        { label: 'RP Earned',    value: fmtK(stats.overallTotalRP),              color: '#22d3ee' },
        { label: 'Avg SL/B',     value: fmtK(stats.avgSL),                       color: '#4ade80' },
    ];
    return (
        <div style={{ ...S.card, borderColor: `${color}25`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{stats.totalBattles} battles logged</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rows.map(({ label, value, color: vc }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(59,130,246,0.03)', borderRadius: 7, border: '1px solid rgba(59,130,246,0.05)' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: vc, fontFamily: "'Rajdhani', sans-serif" }}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DeltaRow({ label, v1, v2, fmt = (x) => x, higherBetter = true }) {
    const n1 = parseFloat(v1) || 0, n2 = parseFloat(v2) || 0;
    const p1Wins = higherBetter ? n1 > n2 : n1 < n2;
    const p2Wins = higherBetter ? n2 > n1 : n2 < n1;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(59,130,246,0.05)' }}>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: p1Wins ? 700 : 400, color: p1Wins ? C1 : '#475569', fontFamily: p1Wins ? "'Rajdhani', sans-serif" : 'inherit' }}>{fmt(n1)}</div>
            <div style={{ fontSize: 10, color: '#334155', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', minWidth: 80 }}>{label}</div>
            <div style={{ textAlign: 'left', fontSize: 13, fontWeight: p2Wins ? 700 : 400, color: p2Wins ? C2 : '#475569', fontFamily: p2Wins ? "'Rajdhani', sans-serif" : 'inherit' }}>{fmt(n2)}</div>
        </div>
    );
}

const PlayerComparisonPage = ({ users }) => {
    const [p1Id, setP1Id] = useState('');
    const [p2Id, setP2Id] = useState('');
    const [chartMode, setChartMode] = useState('radar'); // 'radar' | 'bar'

    const p1 = users.find(u => u.id === p1Id);
    const p2 = users.find(u => u.id === p2Id);
    const s1 = useMemo(() => calcStats(p1?.battles), [p1]);
    const s2 = useMemo(() => calcStats(p2?.battles), [p2]);

    const radarData = useMemo(() => {
        if (!p1 || !p2) return [];
        const normalize = (v, max) => max > 0 ? Math.round((v / max) * 100) : 0;
        const maxBattles  = Math.max(s1.totalBattles, s2.totalBattles, 1);
        const maxKills    = Math.max(s1.totalKillsGround + s1.totalKillsAircraft, s2.totalKillsGround + s2.totalKillsAircraft, 1);
        const maxSL       = Math.max(s1.totalEarnedSL, s2.totalEarnedSL, 1);
        const maxRP       = Math.max(s1.overallTotalRP, s2.overallTotalRP, 1);
        const maxAssists  = Math.max(s1.totalAssists, s2.totalAssists, 1);
        return [
            { subject: 'Battles',    [p1.name]: normalize(s1.totalBattles, maxBattles),  [p2.name]: normalize(s2.totalBattles, maxBattles) },
            { subject: 'Win Rate',   [p1.name]: Math.round(s1.winRate),                   [p2.name]: Math.round(s2.winRate) },
            { subject: 'Kills',      [p1.name]: normalize(s1.totalKillsGround + s1.totalKillsAircraft, maxKills), [p2.name]: normalize(s2.totalKillsGround + s2.totalKillsAircraft, maxKills) },
            { subject: 'SL',         [p1.name]: normalize(s1.totalEarnedSL, maxSL),       [p2.name]: normalize(s2.totalEarnedSL, maxSL) },
            { subject: 'RP',         [p1.name]: normalize(s1.overallTotalRP, maxRP),      [p2.name]: normalize(s2.overallTotalRP, maxRP) },
            { subject: 'Activity',   [p1.name]: Math.round(s1.avgActivity),               [p2.name]: Math.round(s2.avgActivity) },
            { subject: 'Assists',    [p1.name]: normalize(s1.totalAssists, maxAssists),    [p2.name]: normalize(s2.totalAssists, maxAssists) },
        ];
    }, [p1, p2, s1, s2]);

    const barData = useMemo(() => {
        if (!p1 || !p2) return [];
        return [
            { name: 'Ground Kills', [p1.name]: s1.totalKillsGround,   [p2.name]: s2.totalKillsGround },
            { name: 'Air Kills',    [p1.name]: s1.totalKillsAircraft, [p2.name]: s2.totalKillsAircraft },
            { name: 'Win Rate',     [p1.name]: parseFloat(s1.winRate.toFixed(1)), [p2.name]: parseFloat(s2.winRate.toFixed(1)) },
            { name: 'Avg Activity', [p1.name]: parseFloat(s1.avgActivity.toFixed(1)), [p2.name]: parseFloat(s2.avgActivity.toFixed(1)) },
            { name: 'Assists',      [p1.name]: s1.totalAssists,       [p2.name]: s2.totalAssists },
            { name: 'Avg K/Battle', [p1.name]: parseFloat(s1.avgKills.toFixed(2)), [p2.name]: parseFloat(s2.avgKills.toFixed(2)) },
        ];
    }, [p1, p2, s1, s2]);

    const bothSelected = !!(p1 && p2);
    const togBtn = (active) => ({
        padding: '5px 12px', border: active ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
        background: active ? 'rgba(59,130,246,0.14)' : 'transparent', borderRadius: 7, color: active ? '#60a5fa' : '#475569',
        fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.18s',
    });

    return (
        <div style={S.page}>
            <div style={S.wrap}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(139,92,246,0.35)' }}>
                        <GitCompare size={16} color="#fff" />
                    </div>
                    <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#e2e8f0' }}>Player Comparison</h1>
                </div>

                {/* Player selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {[
                        { id: p1Id, set: setP1Id, label: 'Player 1', color: C1 },
                        { id: p2Id, set: setP2Id, label: 'Player 2', color: C2 },
                    ].map(({ id, set, label, color }) => (
                        <div key={label}>
                            <label style={{ ...S.label, color }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                                <select style={{ ...S.sel, borderColor: id ? `${color}30` : 'rgba(59,130,246,0.16)' }} value={id} onChange={e => set(e.target.value)}>
                                    <option value="">— Select player —</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                {!bothSelected ? (
                    <div style={{ ...S.card, textAlign: 'center', padding: '56px 24px' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <GitCompare size={24} color="#8b5cf6" />
                        </div>
                        <p style={{ fontSize: 15, color: '#475569' }}>Select two players above to compare their stats</p>
                    </div>
                ) : (
                    <>
                        {/* Chart toggle + chart */}
                        <div style={{ ...S.card, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                <span style={S.secHdr}>Performance Overview</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button style={togBtn(chartMode === 'radar')} onClick={() => setChartMode('radar')}>Radar</button>
                                    <button style={togBtn(chartMode === 'bar')}   onClick={() => setChartMode('bar')}>Bar</button>
                                </div>
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                {[{ name: p1.name, color: C1 }, { name: p2.name, color: C2 }].map(l => (
                                    <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                                        {l.name}
                                    </div>
                                ))}
                            </div>

                            {chartMode === 'radar' ? (
                                <ResponsiveContainer width="100%" height={340}>
                                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                        <PolarGrid stroke="rgba(59,130,246,0.12)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name={p1.name} dataKey={p1.name} stroke={C1} fill={C1} fillOpacity={0.15} strokeWidth={2} dot={{ fill: C1, r: 3 }} />
                                        <Radar name={p2.name} dataKey={p2.name} stroke={C2} fill={C2} fillOpacity={0.15} strokeWidth={2} dot={{ fill: C2, r: 3 }} />
                                        <Tooltip contentStyle={TT_STYLE} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
                                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                                        <Tooltip contentStyle={TT_STYLE} />
                                        <Bar dataKey={p1.name} fill={C1} radius={[4,4,0,0]} />
                                        <Bar dataKey={p2.name} fill={C2} radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Head-to-head delta table */}
                        <div style={{ ...S.card, marginBottom: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: C1 }}>{p1.name}</div>
                                <div style={{ fontSize: 10, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', minWidth: 80 }}>Head to Head</div>
                                <div style={{ textAlign: 'left', fontWeight: 700, fontSize: 14, color: C2 }}>{p2.name}</div>
                            </div>
                            <DeltaRow label="Battles"       v1={s1.totalBattles}          v2={s2.totalBattles}          fmt={v => Math.round(v)} />
                            <DeltaRow label="Win Rate"      v1={s1.winRate}               v2={s2.winRate}               fmt={v => `${v.toFixed(1)}%`} />
                            <DeltaRow label="Ground Kills"  v1={s1.totalKillsGround}      v2={s2.totalKillsGround}      fmt={v => formatNumber(Math.round(v))} />
                            <DeltaRow label="Air Kills"     v1={s1.totalKillsAircraft}    v2={s2.totalKillsAircraft}    fmt={v => formatNumber(Math.round(v))} />
                            <DeltaRow label="Assists"       v1={s1.totalAssists}          v2={s2.totalAssists}          fmt={v => formatNumber(Math.round(v))} />
                            <DeltaRow label="Avg Activity"  v1={s1.avgActivity}           v2={s2.avgActivity}           fmt={v => `${v.toFixed(1)}%`} />
                            <DeltaRow label="Avg K/Battle"  v1={s1.avgKills}              v2={s2.avgKills}              fmt={v => v.toFixed(2)} />
                            <DeltaRow label="SL Earned"     v1={s1.totalEarnedSL}         v2={s2.totalEarnedSL}         fmt={v => fmtK(v)} />
                            <DeltaRow label="RP Earned"     v1={s1.overallTotalRP}        v2={s2.overallTotalRP}        fmt={v => fmtK(v)} />
                            <DeltaRow label="Avg SL/Battle" v1={s1.avgSL}                 v2={s2.avgSL}                 fmt={v => fmtK(v)} />
                        </div>

                        {/* Side-by-side detail cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <PlayerCard user={p1} stats={s1} color={C1} />
                            <PlayerCard user={p2} stats={s2} color={C2} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayerComparisonPage; 