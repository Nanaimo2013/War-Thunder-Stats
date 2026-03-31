/**
 * loading.js
 *
 * Loading utilities for the War Thunder Stats app.
 * Provides:
 *   - useIntersectionObserver   (lazy-load trigger)
 *   - usePagination             (load-more pattern)
 *   - useImagePreloader         (preload icon arrays)
 *   - WTSpinner                 (animated spinner)
 *   - WTSkeletonCard            (placeholder card)
 *   - WTLoadMoreTrigger         (invisible scroll sentinel)
 *   - LazySection               (auto-reveal on scroll)
 */

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns [ref, isVisible] using IntersectionObserver.
 * Once visible, stays visible (one-shot by default).
 */
export function useIntersectionObserver(opts = {}) {
  const {
    threshold  = 0.05,
    rootMargin = '80px',
    once       = true,
  } = opts;

  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible && once) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once, visible]);

  return [ref, visible];
}

/**
 * Manages a paginated list with a "load more" trigger.
 *
 * @param {Array}  items        Full data array
 * @param {number} pageSize     How many items per page (default 20)
 * @returns {{
 *   visible: Array,           Items currently shown
 *   hasMore: boolean,
 *   loadMore: () => void,
 *   reset: () => void,
 *   total: number,
 * }}
 */
export function usePagination(items = [], pageSize = 20) {
  const [page, setPage] = useState(1);

  // Reset when items array identity changes (e.g. filter applied)
  useEffect(() => {
    setPage(1);
  }, [items]);

  const count   = page * pageSize;
  const visible = items.slice(0, count);
  const hasMore = count < items.length;

  const loadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return { visible, hasMore, loadMore, reset, total: items.length };
}

/**
 * Preloads an array of image URLs into the browser cache.
 * Returns { loaded, total, done } progress info.
 */
export function useImagePreloader(urls = []) {
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (!urls.length) return;
    let count = 0;
    setLoaded(0);

    const unique = [...new Set(urls.filter(Boolean))];
    unique.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        count++;
        setLoaded(count);
      };
      img.src = src;
    });
  }, [urls.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { loaded, total: urls.length, done: loaded >= urls.length };
}

// ─── Components ───────────────────────────────────────────────────────────────

/** Amber rotating spinner */
export function WTSpinner({ size = 22, color = 'var(--wt-amber, #f59e0b)', label = '' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size,
        height: size,
        border: `2px solid rgba(245,158,11,0.18)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'wt-spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
      {label && (
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: 13,
          color: 'var(--wt-text-muted, #64748b)',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/** Full-page loading screen */
export function WTPageLoader({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 20,
      color: 'var(--wt-text-muted, #64748b)',
    }}>
      <WTSpinner size={36} />
      <p style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 14,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--wt-amber, #f59e0b)',
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  );
}

/** Skeleton loader placeholder for a card */
export function WTSkeletonCard({ lines = 3, height = 80, style: extStyle }) {
  return (
    <div style={{
      background: 'var(--wt-bg-raised, #161e28)',
      border: '1px solid rgba(245,158,11,0.06)',
      borderRadius: 10,
      padding: '14px 18px',
      ...extStyle,
    }}>
      <div style={{
        background: 'linear-gradient(90deg, #161e28 25%, #1f2a3d 50%, #161e28 75%)',
        backgroundSize: '200% 100%',
        animation: 'wt-skeleton 1.4s ease infinite',
        borderRadius: 4,
        height: 16,
        width: '60%',
        marginBottom: 12,
      }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          background: 'linear-gradient(90deg, #161e28 25%, #1f2a3d 50%, #161e28 75%)',
          backgroundSize: '200% 100%',
          animation: 'wt-skeleton 1.4s ease infinite',
          borderRadius: 4,
          height: 12,
          width: `${70 + Math.sin(i) * 20}%`,
          marginBottom: i < lines - 1 ? 8 : 0,
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

/** Skeleton list of cards */
export function WTSkeletonList({ count = 5, cardHeight = 80 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <WTSkeletonCard key={i} height={cardHeight} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

/**
 * Invisible scroll sentinel — call onVisible when it enters viewport.
 * Used to implement infinite scroll / load-more.
 */
export function WTLoadMoreTrigger({ onLoadMore, hasMore, loading, loadingLabel = 'Loading more...' }) {
  const [sentinelRef, isVisible] = useIntersectionObserver({ rootMargin: '200px', once: false });

  useEffect(() => {
    if (isVisible && hasMore && !loading) {
      onLoadMore();
    }
  }, [isVisible, hasMore, loading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
      {loading && <WTSpinner label={loadingLabel} />}
    </div>
  );
}

/**
 * Manual "Load More" button (alternative to auto-trigger).
 */
export function WTLoadMoreButton({ onLoadMore, hasMore, loading, visibleCount, totalCount }) {
  if (!hasMore) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '16px 0',
        color: 'var(--wt-text-muted, #64748b)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 12,
        letterSpacing: '0.08em',
      }}>
        ── ALL {totalCount} BATTLES LOADED ──
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <button
        onClick={onLoadMore}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 28px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          color: 'var(--wt-amber, #f59e0b)',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(245,158,11,0.15)'; }}
        onMouseLeave={e => { e.target.style.background = 'rgba(245,158,11,0.08)'; }}
      >
        {loading ? <WTSpinner size={14} /> : null}
        {loading ? 'Loading…' : `Load More (${visibleCount} / ${totalCount})`}
      </button>
    </div>
  );
}

/**
 * Wraps children, revealing them with a fade+slide animation when they scroll into view.
 */
export function LazySection({ children, delay = 0, style: extStyle, className = '' }) {
  const [ref, visible] = useIntersectionObserver({ threshold: 0.04, once: true });

  return (
    <div
      ref={ref}
      className={`wt-lazy-section ${visible ? 'wt-visible' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}s`,
        ...extStyle,
      }}
    >
      {children}
    </div>
  );
}

/**
 * React.lazy wrapper with a fallback spinner.
 * Usage:
 *   const MyPage = lazyWithFallback(() => import('./MyPage'));
 */
export function lazyWithFallback(importFn) {
  const Component = React.lazy(importFn);
  return function LazyWrapped(props) {
    return (
      <Suspense fallback={<WTPageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export default {
  useIntersectionObserver,
  usePagination,
  useImagePreloader,
  WTSpinner,
  WTPageLoader,
  WTSkeletonCard,
  WTSkeletonList,
  WTLoadMoreTrigger,
  WTLoadMoreButton,
  LazySection,
  lazyWithFallback,
};