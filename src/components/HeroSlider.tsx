import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AUTOPLAY_MS = 5500;
const TRANSITION_MS = 900;

interface SlideDef {
  image: string;
  titleKey: string;
  subtitleKey: string;
}

const SLIDES: SlideDef[] = [
  {
    image: '/img/hero-university.jpg',
    titleKey: 'landing.hero.title',
    subtitleKey: 'landing.hero.subtitle',
  },
  {
    image: '/img/campus-1.jpg',
    titleKey: 'landing.features.venues',
    subtitleKey: 'landing.features.venues.desc',
  },
  {
    image: '/img/business-students.jpg',
    titleKey: 'landing.features.events',
    subtitleKey: 'landing.features.events.desc',
  },
  {
    image: '/img/campus-2.jpg',
    titleKey: 'landing.features.tracking',
    subtitleKey: 'landing.features.tracking.desc',
  },
];

export default function HeroSlider() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const [locked, setLocked] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const hoverRef = useRef(false);
  const touchXRef = useRef<number | null>(null);
  const parallax = useRef({ x: 0, y: 0 });
  const activeRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goTo = useCallback((index: number, direction: 1 | -1) => {
    if (locked) return;
    const current = activeRef.current;
    const next = ((index % SLIDES.length) + SLIDES.length) % SLIDES.length;
    if (next === current) return;

    setLocked(true);
    setDir(direction);
    setPrev(current);
    setActive(next);
    setAnimKey((k) => k + 1);

    window.setTimeout(() => {
      setPrev(null);
      setLocked(false);
    }, TRANSITION_MS);
  }, [locked]);

  const goNext = useCallback(() => {
    goTo(activeRef.current + 1, 1);
  }, [goTo]);

  const goPrev = useCallback(() => {
    goTo(activeRef.current - 1, -1);
  }, [goTo]);

  /* Autoplay */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!hoverRef.current && !document.hidden) goNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [goNext]);

  /* Smooth mouse parallax via CSS vars */
  useEffect(() => {
    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tick = () => {
      cur.x += (parallax.current.x - cur.x) * 0.08;
      cur.y += (parallax.current.y - cur.y) * 0.08;
      const el = sectionRef.current;
      if (el) {
        el.style.setProperty('--px', cur.x.toFixed(4));
        el.style.setProperty('--py', cur.y.toFixed(4));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    parallax.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    parallax.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchXRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchXRef.current;
    touchXRef.current = null;
    if (Math.abs(delta) < 40) return;
    const forward = isAr ? delta > 0 : delta < 0;
    if (forward) goNext();
    else goPrev();
  };

  const slide = SLIDES[active];
  const cssDir = isAr ? -dir : dir;

  return (
    <section
      ref={sectionRef}
      className="hero-slider relative min-h-[560px] md:min-h-[640px] flex items-center"
      style={
        {
          '--dir': cssDir,
          '--autoplay': `${AUTOPLAY_MS}ms`,
        } as React.CSSProperties
      }
      onMouseMove={onMove}
      onMouseEnter={() => {
        hoverRef.current = true;
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        parallax.current.x = 0;
        parallax.current.y = 0;
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 3D stage */}
      <div className="hero-stage absolute inset-0">
        <div className="hero-slides">
          {SLIDES.map((s, i) => {
            const isActive = i === active;
            const isPrev = i === prev;
            let cls = 'hero-slide';
            if (isActive) cls += ' is-active';
            if (isPrev) cls += ' is-prev';
            return (
              <div
                key={`${s.image}-${isActive ? animKey : i}`}
                className={cls}
                aria-hidden={!isActive}
              >
                <div className="hero-img-wrap">
                  <img src={s.image} alt="" className="hero-img" draggable={false} />
                </div>
                <div className="hero-overlay" />
                <div className="absolute inset-0 hero-pattern opacity-35 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating accents */}
      <div className="hero-float hero-float-1" aria-hidden />
      <div className="hero-float hero-float-2" aria-hidden />
      <div className="hero-float hero-float-3" aria-hidden />

      <div className="absolute top-0 start-0 w-28 h-28 border-s-2 border-t-2 border-secondary/40 pointer-events-none z-10" />
      <div className="absolute bottom-0 end-0 w-28 h-28 border-e-2 border-b-2 border-primary/35 pointer-events-none z-10" />

      {/* Content */}
      <div className="page-shell relative z-20 py-16 md:py-20 w-full hero-tilt">
        <div className="max-w-2xl hero-depth" key={`content-${animKey}`}>
          <div className="hero-anim inline-flex items-center gap-2 mb-5 px-3 py-1.5 border border-white/15 bg-black/25 backdrop-blur-sm" style={{ animationDelay: '0ms' }}>
            <span className="geo-diamond" />
            <span className="text-secondary-300 text-xs font-medium tracking-wide">
              {t('landing.hero.badge')}
            </span>
          </div>

          <h1
            className="hero-anim text-3xl md:text-5xl lg:text-[3.15rem] font-semibold text-white leading-tight mb-5 text-balance"
            style={{ animationDelay: '80ms' }}
          >
            {t(slide.titleKey)}
          </h1>

          <div className="hero-anim flex items-center gap-3 mb-6" style={{ animationDelay: '150ms' }}>
            <div className="h-[3px] w-16 bg-secondary" />
            <div className="h-px flex-1 max-w-[100px] bg-white/20" />
          </div>

          <p
            className="hero-anim text-base md:text-lg text-white/80 leading-8 mb-9 max-w-xl font-naskh"
            style={{ animationDelay: '220ms' }}
          >
            {t(slide.subtitleKey)}
          </p>

          <div className="hero-anim flex flex-col sm:flex-row gap-3 mb-12" style={{ animationDelay: '300ms' }}>
            <Link to="/services" className="btn-primary text-base px-7 py-3 shadow-brand">
              {t('landing.hero.cta.request')}
              <Arrow className="w-5 h-5" />
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-md
                         border border-white/35 text-white font-medium
                         hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <Search className="w-5 h-5" />
              {t('landing.hero.cta.track')}
            </Link>
            <Link
              to="/venues"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md
                         text-white/80 hover:text-white font-medium transition-colors"
            >
              <Building2 className="w-5 h-5" />
              {t('landing.hero.cta.venues')}
            </Link>
          </div>

          <div
            className="hero-anim grid grid-cols-3 gap-px bg-white/15 border border-white/15 max-w-lg backdrop-blur-sm"
            style={{ animationDelay: '380ms' }}
          >
            {[
              { v: '7+', l: t('landing.stats.services') },
              { v: '3', l: t('landing.stats.venues') },
              { v: '24/7', l: t('landing.stats.support') },
            ].map((s) => (
              <div key={s.l} className="bg-ink/55 px-3 py-4 text-center">
                <div className="text-xl md:text-2xl font-semibold text-secondary-300">{s.v}</div>
                <div className="text-[11px] md:text-xs text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <button type="button" onClick={goPrev} aria-label="prev" className="hero-arrow start-3 md:start-5" disabled={locked}>
        <PrevIcon className="w-5 h-5" />
      </button>
      <button type="button" onClick={goNext} aria-label="next" className="hero-arrow end-3 md:end-5" disabled={locked}>
        <NextIcon className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.image}
            type="button"
            onClick={() => goTo(i, i > active ? 1 : -1)}
            className={`hero-dot ${i === active ? 'is-active' : ''}`}
            aria-label={`slide ${i + 1}`}
          >
            <span className="hero-dot-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="hero-dot-bar">
              {i === active && <span key={animKey} className="hero-dot-fill" />}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
