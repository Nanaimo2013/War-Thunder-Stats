/**
 * Navbar.js  v2.0
 * Military HUD aesthetic, WTTheme-consistent, sticky, full-width.
 */

import React, { useState, useEffect } from 'react';
import { Home, Users, BarChart2, Award, GitCompare, Info, FileText, Menu, X } from 'lucide-react';
import { StyleInjector } from '../styles/wtTheme';

const WT_LOGO = () => (
  <svg viewBox="0 0 40 40" width="34" height="34" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <filter id="logo-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Shield */}
    <path
      d="M20 2 L37 9 L37 28 L20 38 L3 28 L3 9 Z"
      fill="url(#logo-grad)"
      stroke="#b45309"
      strokeWidth="1.5"
      filter="url(#logo-glow)"
    />
    {/* W */}
    <text
      x="20" y="26"
      fontFamily="'Rajdhani', sans-serif"
      fontSize="18"
      fontWeight="800"
      fill="#0d1117"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      W
    </text>
  </svg>
);

const NAV_ITEMS = [
  { name: 'Home',          page: 'home',            icon: Home },
  { name: 'Stats',         page: 'stats',           icon: BarChart2 },
  { name: 'Leaderboard',   page: 'leaderboard',     icon: Award },
  { name: 'Compare',       page: 'compare-players', icon: GitCompare },
  { name: 'Data',          page: 'data-management', icon: Users },
  { name: 'Battle Logs',   page: 'battle-logs',     icon: FileText },
  { name: 'About',         page: 'about',           icon: Info },
];

const NAVBAR_STYLES = `
  .wt-navbar {
    background: linear-gradient(180deg, rgba(7,10,13,0.98) 0%, rgba(13,17,23,0.98) 100%);
    border-bottom: 1px solid rgba(245,158,11,0.18);
    position: sticky;
    top: 0;
    z-index: 200;
    box-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.06);
    backdrop-filter: blur(12px);
  }
  .wt-navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 58px;
    max-width: 100%;
    box-sizing: border-box;
  }
  .wt-navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .wt-navbar-title {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #f59e0b;
    text-shadow: 0 0 20px rgba(245,158,11,0.4);
    line-height: 1;
  }
  .wt-navbar-subtitle {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    color: #475569;
    text-transform: uppercase;
    line-height: 1;
    margin-top: 2px;
  }
  .wt-nav-list {
    display: flex;
    align-items: center;
    gap: 2px;
    list-style: none;
    margin: 0;
    padding: 0;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .wt-nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 6px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    color: #64748b;
    background: transparent;
    white-space: nowrap;
    position: relative;
  }
  .wt-nav-btn:hover {
    color: #f59e0b;
    background: rgba(245,158,11,0.07);
    border-color: rgba(245,158,11,0.18);
  }
  .wt-nav-btn.active {
    color: #0d1117;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-color: transparent;
    box-shadow: 0 2px 12px rgba(245,158,11,0.35), 0 0 0 1px rgba(245,158,11,0.15);
  }
  .wt-nav-btn.active::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 7px;
    background: linear-gradient(135deg, rgba(251,191,36,0.4), rgba(217,119,6,0.4));
    z-index: -1;
    filter: blur(6px);
  }

  /* Mobile menu */
  .wt-mobile-menu {
    display: none;
    position: fixed;
    top: 58px;
    left: 0; right: 0;
    background: rgba(7,10,13,0.98);
    border-bottom: 1px solid rgba(245,158,11,0.15);
    padding: 12px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    z-index: 199;
    backdrop-filter: blur(12px);
    flex-direction: column;
    gap: 4px;
    animation: wt-slide-down 0.25s ease both;
  }
  .wt-mobile-menu.open {
    display: flex;
  }
  .wt-mobile-menu .wt-nav-btn {
    width: 100%;
    justify-content: flex-start;
    padding: 10px 14px;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .wt-nav-list { display: none; }
    .wt-hamburger { display: flex !important; }
  }
  @media (min-width: 901px) {
    .wt-hamburger { display: none !important; }
    .wt-mobile-menu { display: none !important; }
  }

  /* Accent line animation */
  .wt-navbar::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 30%, rgba(251,191,36,0.8) 50%, rgba(245,158,11,0.5) 70%, transparent 100%);
    animation: wt-shimmer 4s linear infinite;
    background-size: 200% 100%;
  }
`;

const Navbar = ({ setCurrentPage, currentPage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPage]);

  const handleNav = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  return (
    <>
      <StyleInjector />
      {/* Inline navbar-specific styles */}
      <style>{NAVBAR_STYLES}</style>

      <nav className="wt-navbar" style={{ position: 'sticky' }}>
        <div className="wt-navbar-inner">
          {/* Brand */}
          <button className="wt-navbar-brand" onClick={() => handleNav('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <WT_LOGO />
            <div>
              <div className="wt-navbar-title">WAR THUNDER</div>
              <div className="wt-navbar-subtitle">STATS TRACKER</div>
            </div>
          </button>

          {/* Desktop nav */}
          <ul className="wt-nav-list">
            {NAV_ITEMS.map(({ name, page, icon: Icon }) => (
              <li key={page}>
                <button
                  className={`wt-nav-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handleNav(page)}
                >
                  <Icon size={14} />
                  {name}
                </button>
              </li>
            ))}
          </ul>

          {/* Hamburger */}
          <button
            className="wt-hamburger"
            style={{
              display: 'none',
              background: 'none', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 6, padding: '7px', cursor: 'pointer',
              color: '#f59e0b',
              transition: 'all 0.18s ease',
            }}
            onClick={() => setMenuOpen(m => !m)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div className={`wt-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map(({ name, page, icon: Icon }) => (
          <button
            key={page}
            className={`wt-nav-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => handleNav(page)}
          >
            <Icon size={16} />
            {name}
          </button>
        ))}
      </div>
    </>
  );
};

export default Navbar;