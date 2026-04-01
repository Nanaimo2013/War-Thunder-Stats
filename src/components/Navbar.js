/**
 * Navbar.js  v3.0
 * Deep navy + electric blue design, Inter font, glassmorphism.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, BarChart2, Award, GitCompare, Info, FileText, Menu, X, Swords } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home',        page: 'home',            icon: Home },
  { name: 'Stats',       page: 'stats',           icon: BarChart2 },
  { name: 'Leaderboard', page: 'leaderboard',     icon: Award },
  { name: 'Compare',     page: 'compare-players', icon: GitCompare },
  { name: 'Battle Logs', page: 'battle-logs',     icon: FileText },
  { name: 'Data',        page: 'data-management', icon: Users },
  { name: 'About',       page: 'about',           icon: Info },
];

const STYLES = `
  .wt-nb { box-sizing: border-box; }
  .wt-nb-root {
    background: rgba(4,8,15,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(59,130,246,0.1);
    position: sticky;
    top: 0;
    z-index: 200;
    box-shadow: 0 1px 0 rgba(59,130,246,0.08), 0 4px 32px rgba(0,0,0,0.7);
  }
  .wt-nb-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 56px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .wt-nb-brand {
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer; padding: 0;
    flex-shrink: 0;
    text-decoration: none;
  }
  .wt-nb-logo {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 16px rgba(59,130,246,0.4), 0 2px 8px rgba(0,0,0,0.4);
    flex-shrink: 0;
  }
  .wt-nb-title {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #e2e8f0;
    line-height: 1;
  }
  .wt-nb-title span { color: #60a5fa; }
  .wt-nb-sub {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    letter-spacing: 0.14em;
    color: #334155;
    text-transform: uppercase;
    line-height: 1;
    margin-top: 2px;
  }
  .wt-nb-list {
    display: flex; align-items: center; gap: 1px;
    list-style: none; margin: 0; padding: 0;
    overflow: hidden;
  }
  .wt-nb-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px;
    border-radius: 7px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 12.5px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    color: #64748b;
    background: transparent;
    white-space: nowrap;
    line-height: 1;
  }
  .wt-nb-btn:hover { color: #93c5fd; background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.16); }
  .wt-nb-btn.active {
    color: #fff;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: transparent;
    box-shadow: 0 2px 12px rgba(59,130,246,0.4);
    font-weight: 600;
  }
  .wt-nb-ham {
    display: none;
    align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid rgba(59,130,246,0.18);
    border-radius: 7px;
    padding: 7px;
    cursor: pointer;
    color: #60a5fa;
    transition: all 0.18s ease;
  }
  .wt-nb-ham:hover { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); }
  .wt-nb-mobile {
    position: fixed;
    top: 56px; left: 0; right: 0;
    background: rgba(4,8,15,0.97);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(59,130,246,0.1);
    padding: 10px 16px 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    z-index: 199;
    flex-direction: column;
    gap: 3px;
    display: none;
    animation: wt-slide-down 0.22s ease both;
  }
  .wt-nb-mobile.open { display: flex; }
  .wt-nb-mobile .wt-nb-btn { width: 100%; justify-content: flex-start; padding: 9px 12px; font-size: 13px; }
  @media (max-width: 860px) {
    .wt-nb-list  { display: none; }
    .wt-nb-ham   { display: flex !important; }
  }
  @media (min-width: 861px) {
    .wt-nb-ham    { display: none !important; }
    .wt-nb-mobile { display: none !important; }
  }
`;

const Navbar = ({ setCurrentPage, currentPage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setMenuOpen(false); }, [currentPage]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const go = (page) => { setCurrentPage(page); setMenuOpen(false); };

  return (
    <>
      <style>{STYLES}</style>
      <nav className="wt-nb-root wt-nb">
        <div className="wt-nb-inner">
          <button className="wt-nb-brand" onClick={() => go('home')}>
            <div className="wt-nb-logo">
              <Swords size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div className="wt-nb-title">WAR<span> THUNDER</span></div>
              <div className="wt-nb-sub">Stats Tracker</div>
            </div>
          </button>

          <ul className="wt-nb-list">
            {NAV_ITEMS.map(({ name, page, icon: Icon }) => (
              <li key={page}>
                <button className={`wt-nb-btn ${currentPage === page ? 'active' : ''}`} onClick={() => go(page)}>
                  <Icon size={13} />
                  {name}
                </button>
              </li>
            ))}
          </ul>

          <button className="wt-nb-ham" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </nav>

      <div ref={menuRef} className={`wt-nb-mobile ${menuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map(({ name, page, icon: Icon }) => (
          <button key={page} className={`wt-nb-btn ${currentPage === page ? 'active' : ''}`} onClick={() => go(page)}>
            <Icon size={15} />
            {name}
          </button>
        ))}
      </div>
    </>
  );
};

export default Navbar;