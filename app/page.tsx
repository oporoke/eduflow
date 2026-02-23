"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Scroll reveal
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(
              () => (entry.target as HTMLElement).classList.add("visible"),
              i * 80
            );
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));

    // Animated counter
    function animateCount(el: HTMLElement, target: number) {
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent =
          Math.round(current) + (el.dataset.suffix || "");
      }, 16);
    }

    const statNums = document.querySelectorAll<HTMLElement>(
      ".stat-num, .stat-block-num"
    );
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const text = el.textContent || "";
            const num = parseInt(text.replace(/\D/g, ""));
            if (!isNaN(num) && num > 0) {
              el.dataset.suffix = text.replace(/[0-9]/g, "").trim();
              animateCount(el, num);
            }
            statObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNums.forEach((el) => statObserver.observe(el));

    // Nav scroll effect
    const handleScroll = () => {
      const nav = document.querySelector<HTMLElement>("nav");
      if (!nav) return;
      if (window.scrollY > 50) {
        nav.style.borderBottomColor = "rgba(232, 160, 32, 0.3)";
      } else {
        nav.style.borderBottomColor = "rgba(232, 160, 32, 0.2)";
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      statObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function activateStep(
    el: HTMLElement,
    emoji: string,
    label: string,
    sub: string
  ) {
    document
      .querySelectorAll(".step")
      .forEach((s) => s.classList.remove("active"));
    el.classList.add("active");
    const howEmoji = document.getElementById("how-emoji");
    const howLabel = document.getElementById("how-label");
    const howSub = document.getElementById("how-sub");
    if (howEmoji) howEmoji.textContent = emoji;
    if (howLabel) howLabel.textContent = label;
    if (howSub) howSub.textContent = sub;
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --forest: #0d3b2e;
          --forest-mid: #1a5c44;
          --forest-light: #2d7a5c;
          --amber: #e8a020;
          --amber-light: #f5c842;
          --cream: #f5f0e8;
          --cream-dark: #ede5d4;
          --red: #c0392b;
          --white: #fafaf7;
          --text: #1a1a1a;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--text);
          overflow-x: hidden;
        }

        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 4rem;
          background: rgba(13, 59, 46, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(232, 160, 32, 0.2);
        }

        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--amber);
          letter-spacing: -0.02em;
        }

        .nav-logo span { color: var(--white); }

        .nav-links {
          display: flex;
          gap: 2.5rem;
          list-style: none;
        }

        .nav-links a {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(245, 240, 232, 0.7);
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-links a:hover { color: var(--amber); }

        .nav-cta {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: var(--amber);
          color: var(--forest);
          padding: 0.6rem 1.5rem;
          border: none;
          cursor: pointer;
          font-weight: 700;
          transition: background 0.2s, transform 0.2s;
          text-decoration: none;
        }

        .nav-cta:hover { background: var(--amber-light); transform: translateY(-1px); }

        .hero {
          min-height: 100vh;
          background: var(--forest);
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
          padding-top: 80px;
        }

        .hero-pattern {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              45deg,
              rgba(232, 160, 32, 0.04) 0px,
              rgba(232, 160, 32, 0.04) 1px,
              transparent 1px,
              transparent 40px
            ),
            repeating-linear-gradient(
              -45deg,
              rgba(232, 160, 32, 0.04) 0px,
              rgba(232, 160, 32, 0.04) 1px,
              transparent 1px,
              transparent 40px
            );
          pointer-events: none;
        }

        .hero-left {
          padding: 6rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--amber);
          border: 1px solid rgba(232, 160, 32, 0.3);
          padding: 0.4rem 1rem;
          margin-bottom: 2.5rem;
          width: fit-content;
          animation: fadeUp 0.8s ease both;
        }

        .hero-tag::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--amber);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 900;
          line-height: 1.0;
          color: var(--white);
          margin-bottom: 1rem;
          animation: fadeUp 0.8s 0.1s ease both;
        }

        .hero-headline .accent {
          color: var(--amber);
          font-style: italic;
          display: block;
        }

        .hero-headline .underline-text {
          position: relative;
          display: inline-block;
        }

        .hero-headline .underline-text::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 0; right: 0;
          height: 4px;
          background: var(--amber);
        }

        .hero-sub {
          font-size: 1.1rem;
          line-height: 1.7;
          color: rgba(245, 240, 232, 0.7);
          max-width: 480px;
          margin-bottom: 3rem;
          font-weight: 300;
          animation: fadeUp 0.8s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          animation: fadeUp 0.8s 0.3s ease both;
        }

        .btn-primary {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: var(--amber);
          color: var(--forest);
          padding: 1rem 2.5rem;
          border: none;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--amber-light);
          transform: translateX(-100%);
          transition: transform 0.3s;
        }

        .btn-primary:hover::after { transform: translateX(0); }
        .btn-primary span { position: relative; z-index: 1; }

        .btn-ghost {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: transparent;
          color: rgba(245, 240, 232, 0.7);
          padding: 1rem 2rem;
          border: 1px solid rgba(245, 240, 232, 0.2);
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .btn-ghost:hover {
          border-color: var(--amber);
          color: var(--amber);
        }

        .hero-stats {
          display: flex;
          gap: 3rem;
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid rgba(245, 240, 232, 0.1);
          animation: fadeUp 0.8s 0.4s ease both;
        }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--amber);
          line-height: 1;
        }

        .stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(245, 240, 232, 0.4);
          margin-top: 0.3rem;
        }

        .hero-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 3rem;
          position: relative;
          z-index: 2;
        }

        .dashboard-preview {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(232, 160, 32, 0.15);
          border-radius: 2px;
          width: 100%;
          max-width: 520px;
          overflow: hidden;
          animation: fadeLeft 1s 0.5s ease both;
          box-shadow: 0 40px 100px rgba(0,0,0,0.4);
        }

        .preview-header {
          background: rgba(255,255,255,0.05);
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .preview-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }

        .preview-body { padding: 1.5rem; }

        .preview-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          margin-bottom: 1rem;
        }

        .preview-kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .preview-kpi {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 1rem;
          border-radius: 2px;
        }

        .preview-kpi-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--amber);
        }

        .preview-kpi-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.35);
          margin-top: 0.2rem;
        }

        .preview-chart {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 1rem;
          border-radius: 2px;
          margin-bottom: 1rem;
        }

        .preview-chart-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.3);
          margin-bottom: 0.75rem;
        }

        .preview-bars {
          display: flex;
          align-items: flex-end;
          gap: 0.4rem;
          height: 60px;
        }

        .preview-bar {
          flex: 1;
          border-radius: 1px 1px 0 0;
          animation: growBar 1s ease both;
        }

        @keyframes growBar {
          from { height: 0 !important; }
        }

        .preview-students {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .preview-student {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: rgba(255,255,255,0.03);
          border-radius: 2px;
        }

        .preview-student-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--forest);
        }

        .preview-student-name {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }

        .preview-badge {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          padding: 0.2rem 0.5rem;
          border-radius: 100px;
        }

        .ticker {
          background: var(--amber);
          padding: 0.6rem 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .ticker-inner {
          display: inline-flex;
          gap: 3rem;
          animation: ticker 20s linear infinite;
        }

        .ticker-item {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--forest);
        }

        .ticker-sep {
          color: rgba(13,59,46,0.4);
        }

        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .features {
          padding: 8rem 4rem;
          background: var(--cream);
        }

        .section-tag {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--forest-light);
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          color: var(--forest);
          margin-bottom: 1.5rem;
        }

        .section-title .italic { font-style: italic; color: var(--forest-light); }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid rgba(13,59,46,0.1);
          margin-top: 4rem;
        }

        .feature-card {
          padding: 2.5rem;
          border-right: 1px solid rgba(13,59,46,0.1);
          border-bottom: 1px solid rgba(13,59,46,0.1);
          transition: background 0.3s;
          position: relative;
          overflow: hidden;
        }

        .feature-card:nth-child(3n) { border-right: none; }
        .feature-card:nth-last-child(-n+3) { border-bottom: none; }

        .feature-card:hover { background: var(--forest); }
        .feature-card:hover .feature-title { color: var(--amber); }
        .feature-card:hover .feature-desc { color: rgba(245,240,232,0.6); }
        .feature-card:hover .feature-icon-wrap { background: rgba(232,160,32,0.15); }

        .feature-icon-wrap {
          width: 48px; height: 48px;
          background: rgba(13,59,46,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
          transition: background 0.3s;
        }

        .feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--forest);
          margin-bottom: 0.75rem;
          transition: color 0.3s;
        }

        .feature-desc {
          font-size: 0.85rem;
          line-height: 1.7;
          color: rgba(26,26,26,0.6);
          transition: color 0.3s;
        }

        .stats-band {
          background: var(--forest);
          padding: 5rem 4rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          position: relative;
          overflow: hidden;
        }

        .stats-band::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            rgba(232,160,32,0.05) 0px,
            rgba(232,160,32,0.05) 1px,
            transparent 1px,
            transparent 80px
          );
          pointer-events: none;
        }

        .stat-block {
          padding: 2rem 3rem;
          border-right: 1px solid rgba(255,255,255,0.08);
          position: relative;
          z-index: 1;
        }

        .stat-block:last-child { border-right: none; }

        .stat-block-num {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 900;
          color: var(--amber);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-block-label {
          font-size: 0.9rem;
          color: rgba(245,240,232,0.5);
          line-height: 1.4;
        }

        .how {
          padding: 8rem 4rem;
          background: var(--cream-dark);
        }

        .how-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
          margin-top: 4rem;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .step {
          display: flex;
          gap: 1.5rem;
          padding: 2rem 0;
          border-bottom: 1px solid rgba(13,59,46,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }

        .step:first-child { border-top: 1px solid rgba(13,59,46,0.1); }
        .step.active { background: transparent; }

        .step-num {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(13,59,46,0.3);
          width: 32px;
          flex-shrink: 0;
          padding-top: 0.2rem;
        }

        .step.active .step-num { color: var(--amber); }

        .step-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: rgba(13,59,46,0.4);
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }

        .step.active .step-title { color: var(--forest); }

        .step-desc {
          font-size: 0.85rem;
          line-height: 1.7;
          color: rgba(13,59,46,0.4);
          display: none;
        }

        .step.active .step-desc {
          display: block;
          color: rgba(26,26,26,0.6);
        }

        .how-visual {
          background: var(--forest);
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .how-visual-content {
          text-align: center;
          z-index: 2;
          padding: 2rem;
        }

        .how-visual-emoji {
          font-size: 4rem;
          display: block;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .how-visual-label {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--amber);
          display: block;
          margin-bottom: 0.5rem;
        }

        .how-visual-sub {
          font-size: 0.8rem;
          color: rgba(245,240,232,0.5);
        }

        .testimonials {
          padding: 8rem 4rem;
          background: var(--cream);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 4rem;
        }

        .testimonial {
          background: var(--white);
          border: 1px solid rgba(13,59,46,0.08);
          padding: 2.5rem;
          position: relative;
        }

        .testimonial::before {
          content: '"';
          font-family: 'Playfair Display', serif;
          font-size: 6rem;
          font-weight: 900;
          color: rgba(13,59,46,0.06);
          position: absolute;
          top: -1rem;
          left: 1.5rem;
          line-height: 1;
        }

        .testimonial-text {
          font-size: 0.9rem;
          line-height: 1.8;
          color: rgba(26,26,26,0.7);
          margin-bottom: 1.5rem;
          font-style: italic;
          position: relative;
          z-index: 1;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .testimonial-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--white);
        }

        .testimonial-name {
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--forest);
        }

        .testimonial-role {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          color: rgba(26,26,26,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pricing {
          padding: 8rem 4rem;
          background: var(--forest);
          position: relative;
          overflow: hidden;
        }

        .pricing::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              rgba(232,160,32,0.04) 0px,
              rgba(232,160,32,0.04) 1px,
              transparent 1px,
              transparent 60px
            );
        }

        .pricing .section-title { color: var(--white); }
        .pricing .section-tag { color: var(--amber); }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 4rem;
          border: 1px solid rgba(255,255,255,0.08);
          position: relative;
          z-index: 1;
        }

        .pricing-card {
          padding: 3rem 2.5rem;
          border-right: 1px solid rgba(255,255,255,0.08);
          transition: background 0.3s;
        }

        .pricing-card:last-child { border-right: none; }

        .pricing-card.featured {
          background: var(--amber);
          position: relative;
        }

        .pricing-card.featured .pricing-price,
        .pricing-card.featured .pricing-name,
        .pricing-card.featured .pricing-desc,
        .pricing-card.featured .pricing-feature { color: var(--forest) !important; }

        .pricing-tag {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: var(--forest);
          color: var(--amber);
          padding: 0.3rem 0.75rem;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .pricing-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 0.5rem;
        }

        .pricing-desc {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .pricing-price {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 900;
          color: var(--amber);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .pricing-period {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.3);
          margin-bottom: 2rem;
        }

        .pricing-card.featured .pricing-period { color: rgba(13,59,46,0.5); }

        .pricing-features {
          list-style: none;
          margin-bottom: 2.5rem;
        }

        .pricing-feature {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.6);
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pricing-card.featured .pricing-feature { border-color: rgba(13,59,46,0.1); }

        .pricing-feature::before {
          content: '✓';
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          color: var(--amber);
          flex-shrink: 0;
        }

        .pricing-card.featured .pricing-feature::before { color: var(--forest); }

        .pricing-btn {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.9rem 2rem;
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--white);
          background: transparent;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s;
          text-decoration: none;
          display: block;
          text-align: center;
        }

        .pricing-btn:hover {
          border-color: var(--amber);
          color: var(--amber);
        }

        .pricing-card.featured .pricing-btn {
          background: var(--forest);
          border-color: var(--forest);
          color: var(--amber);
        }

        .pricing-card.featured .pricing-btn:hover {
          background: var(--forest-mid);
        }

        .cta {
          padding: 8rem 4rem;
          background: var(--amber);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta::before {
          content: 'EduFlow';
          font-family: 'Playfair Display', serif;
          font-size: 20rem;
          font-weight: 900;
          color: rgba(13,59,46,0.06);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          white-space: nowrap;
        }

        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          color: var(--forest);
          line-height: 1.1;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .cta-sub {
          font-size: 1rem;
          color: rgba(13,59,46,0.6);
          max-width: 480px;
          margin: 0 auto 3rem;
          position: relative;
          z-index: 1;
          line-height: 1.7;
        }

        .cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .cta-btn-primary {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: var(--forest);
          color: var(--amber);
          padding: 1rem 2.5rem;
          border: none;
          cursor: pointer;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .cta-btn-primary:hover { background: var(--forest-mid); }

        .cta-btn-ghost {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: transparent;
          color: var(--forest);
          padding: 1rem 2rem;
          border: 2px solid var(--forest);
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .cta-btn-ghost:hover { background: var(--forest); color: var(--amber); }

        footer {
          background: var(--text);
          padding: 4rem;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
        }

        .footer-brand .nav-logo {
          font-size: 1.75rem;
          display: block;
          margin-bottom: 1rem;
        }

        .footer-tagline {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          max-width: 280px;
        }

        .footer-col-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--amber);
          margin-bottom: 1.25rem;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .footer-links a {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover { color: var(--amber); }

        .footer-bottom {
          background: rgba(0,0,0,0.3);
          padding: 1.5rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-copy {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.2);
        }

        .footer-kenya {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          color: rgba(255,255,255,0.2);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: 4rem 1.5rem; }
          .features { padding: 4rem 1.5rem; }
          .features-grid { grid-template-columns: 1fr; }
          .feature-card:nth-child(3n) { border-right: 1px solid rgba(13,59,46,0.1); }
          .stats-band { grid-template-columns: 1fr 1fr; padding: 3rem 1.5rem; }
          .how { padding: 4rem 1.5rem; }
          .how-grid { grid-template-columns: 1fr; }
          .testimonials { padding: 4rem 1.5rem; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .pricing { padding: 4rem 1.5rem; }
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .cta { padding: 4rem 1.5rem; }
          footer { grid-template-columns: 1fr; padding: 3rem 1.5rem; }
          .footer-bottom { padding: 1rem 1.5rem; flex-direction: column; gap: 0.5rem; }
        }
      `}</style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* NAV */}
      <nav>
        <div className="nav-logo">Edu<span>Flow</span></div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="#" className="nav-cta">Get Started</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-pattern"></div>
        <div className="hero-left">
          <div className="hero-tag">🇰🇪 Built for Kenya&apos;s CBC Curriculum</div>
          <h1 className="hero-headline">
            Kenya&apos;s Most
            <span className="accent">Complete</span>
            <span className="underline-text">School OS</span>
          </h1>
          <p className="hero-sub">
            EduFlow brings together learning, assessment, administration, finance and communication — purpose-built for CBC and designed to work from Nairobi to the most remote county in Kenya.
          </p>
          <div className="hero-actions">
            <a href="#" className="btn-primary"><span>Start Free Trial</span></a>
            <a href="#how" className="btn-ghost">See How It Works</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-num">47+</div>
              <div className="stat-label">Counties Supported</div>
            </div>
            <div>
              <div className="stat-num">24</div>
              <div className="stat-label">Core Modules</div>
            </div>
            <div>
              <div className="stat-num">100%</div>
              <div className="stat-label">CBC Aligned</div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dot" style={{ background: "#c0392b" }}></div>
              <div className="preview-dot" style={{ background: "#e8a020" }}></div>
              <div className="preview-dot" style={{ background: "#27ae60" }}></div>
            </div>
            <div className="preview-body">
              <div className="preview-title">Principal Dashboard · Nairobi County</div>
              <div className="preview-kpis">
                <div className="preview-kpi">
                  <div className="preview-kpi-num">1,284</div>
                  <div className="preview-kpi-label">Students</div>
                </div>
                <div className="preview-kpi">
                  <div className="preview-kpi-num">78%</div>
                  <div className="preview-kpi-label">Avg Score</div>
                </div>
                <div className="preview-kpi">
                  <div className="preview-kpi-num">3</div>
                  <div className="preview-kpi-label">At Risk</div>
                </div>
              </div>
              <div className="preview-chart">
                <div className="preview-chart-label">Class Performance</div>
                <div className="preview-bars">
                  <div className="preview-bar" style={{ height: "45%", background: "rgba(232,160,32,0.6)" }}></div>
                  <div className="preview-bar" style={{ height: "70%", background: "rgba(232,160,32,0.7)", animationDelay: "0.1s" }}></div>
                  <div className="preview-bar" style={{ height: "55%", background: "rgba(232,160,32,0.6)", animationDelay: "0.2s" }}></div>
                  <div className="preview-bar" style={{ height: "85%", background: "#e8a020", animationDelay: "0.3s" }}></div>
                  <div className="preview-bar" style={{ height: "60%", background: "rgba(232,160,32,0.65)", animationDelay: "0.4s" }}></div>
                  <div className="preview-bar" style={{ height: "40%", background: "rgba(192,57,43,0.7)", animationDelay: "0.5s" }}></div>
                  <div className="preview-bar" style={{ height: "75%", background: "rgba(232,160,32,0.7)", animationDelay: "0.6s" }}></div>
                  <div className="preview-bar" style={{ height: "90%", background: "#e8a020", animationDelay: "0.7s" }}></div>
                </div>
              </div>
              <div className="preview-students">
                <div className="preview-student">
                  <div className="preview-student-info">
                    <div className="preview-avatar" style={{ background: "#e8a020" }}>A</div>
                    <span className="preview-student-name">Amina Wanjiku</span>
                  </div>
                  <span className="preview-badge" style={{ background: "rgba(39,174,96,0.15)", color: "#27ae60" }}>On Track</span>
                </div>
                <div className="preview-student">
                  <div className="preview-student-info">
                    <div className="preview-avatar" style={{ background: "#2d7a5c" }}>B</div>
                    <span className="preview-student-name">Brian Otieno</span>
                  </div>
                  <span className="preview-badge" style={{ background: "rgba(232,160,32,0.15)", color: "#e8a020" }}>At Risk</span>
                </div>
                <div className="preview-student">
                  <div className="preview-student-info">
                    <div className="preview-avatar" style={{ background: "#1a5c44" }}>C</div>
                    <span className="preview-student-name">Cynthia Chebet</span>
                  </div>
                  <span className="preview-badge" style={{ background: "rgba(39,174,96,0.15)", color: "#27ae60" }}>On Track</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-item">CBC Aligned Curriculum</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">M-Pesa Fee Integration</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">AI Student Tutor — EduBot</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">Kiswahili Support</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">USSD SMS Fallback</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">County Network</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">Predictive Early Warning</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">Adaptive Learning Paths</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">CBC Aligned Curriculum</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">M-Pesa Fee Integration</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">AI Student Tutor — EduBot</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">Kiswahili Support</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">USSD SMS Fallback</span>
          <span className="ticker-sep">◆</span>
          <span className="ticker-item">County Network</span>
          <span className="ticker-sep">◆</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-tag">What EduFlow Does</div>
        <h2 className="section-title">Everything a Kenyan school<br />needs in <span className="italic">one platform</span></h2>
        <div className="features-grid">
          {[
            { icon: "🧠", title: "AI Student Tutor", desc: "EduBot answers student questions 24/7 in English or Kiswahili, tailored to CBC grade levels. No more waiting for the teacher." },
            { icon: "🎯", title: "Early Warning System", desc: "Predicts at-risk students before they fail using quiz scores, lesson completion, streaks and pace votes. Teachers act early." },
            { icon: "🗺️", title: "Adaptive Learning Paths", desc: "After every quiz, EduFlow automatically adjusts each student's learning plan — revisit weak topics, advance through strong ones." },
            { icon: "💚", title: "M-Pesa Fee Payments", desc: "Parents pay school fees directly from their phone. Instant confirmation, digital receipts and real-time payment tracking for admins." },
            { icon: "🎙️", title: "Audio & Voice Lessons", desc: "Teachers record audio lessons directly in the browser. Students listen at 0.5x–2x speed with chapter markers and transcripts." },
            { icon: "📱", title: "USSD SMS Fallback", desc: "Students with basic feature phones dial a code to access today's lesson, take quizzes and check progress — no internet required." },
            { icon: "🇰🇪", title: "Kiswahili Support", desc: "One-click lesson translation to Kiswahili powered by Gemini AI. EduBot automatically responds in Kiswahili when students write in it." },
            { icon: "🏫", title: "County Network", desc: "County Education Directors see performance across all schools — compare, identify struggling schools and share best-performing lessons." },
            { icon: "💰", title: "Full Financial Suite", desc: "Payroll with Kenya PAYE/NHIF/NSSF, budget planning, bursary tracking and fee management — all in one system." },
          ].map((f, i) => (
            <div key={i} className="feature-card reveal">
              <div className="feature-icon-wrap">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="stat-block reveal">
          <div className="stat-block-num">24+</div>
          <div className="stat-block-label">Modules covering every aspect of school management</div>
        </div>
        <div className="stat-block reveal">
          <div className="stat-block-num">47</div>
          <div className="stat-block-label">Kenya counties supported with local context</div>
        </div>
        <div className="stat-block reveal">
          <div className="stat-block-num">2</div>
          <div className="stat-block-label">Languages — English and Kiswahili built in</div>
        </div>
        <div className="stat-block reveal">
          <div className="stat-block-num">0</div>
          <div className="stat-block-label">Competitors with this feature set in Kenya</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="section-tag">How It Works</div>
        <h2 className="section-title">From signup to<br /><span className="italic">fully operational</span><br />in one day</h2>
        <div className="how-grid">
          <div className="steps">
            {[
              { num: "01", emoji: "🏫", label: "Register Your School", desc: "Create your school profile, add your classes and enroll teachers and students. Import from an existing spreadsheet in minutes." },
              { num: "02", emoji: "📚", label: "Build Your Curriculum", desc: "Set up your CBC subjects, topics and subtopics. Teachers add lessons — text, images, video or audio. AI can generate content automatically." },
              { num: "03", emoji: "🎯", label: "Track Every Student", desc: "EduFlow watches each student automatically — quiz scores, lesson completion, streaks and engagement. At-risk alerts go to teachers and parents instantly." },
              { num: "04", emoji: "💚", label: "Collect Fees via M-Pesa", desc: "Set fee structures per class and term. Parents pay directly from their phones. The admin sees real-time payment status — no more chasing receipts." },
              { num: "05", emoji: "🗺️", label: "Scale Across Counties", desc: "Add more schools to your network. County directors get a bird's eye view of all schools — performance, rankings and schools needing support." },
            ].map((s, i) => (
              <div
                key={i}
                className={`step${i === 0 ? " active" : ""}`}
                onClick={(e) => activateStep(e.currentTarget, s.emoji, s.label, s.desc)}
              >
                <div className="step-num">{s.num}</div>
                <div>
                  <div className="step-title">{s.label}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="how-visual" id="how-visual">
            <div className="how-visual-content">
              <span className="how-visual-emoji" id="how-emoji">🏫</span>
              <span className="how-visual-label" id="how-label">Register Your School</span>
              <span className="how-visual-sub" id="how-sub">Create your school profile, add your classes and enroll teachers and students.</span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials" id="testimonials">
        <div className="section-tag">What Schools Say</div>
        <h2 className="section-title">Trusted by schools<br />across <span className="italic">Kenya</span></h2>
        <div className="testimonials-grid">
          {[
            {
              text: "EduFlow transformed how we manage our school. The M-Pesa integration alone saved us hours of manual fee collection every week. The principal dashboard gives me everything I need in one glance.",
              initials: "MK", bg: "#0d3b2e", name: "Mr. Moses Kamau", role: "Principal · Nairobi Primary School",
            },
            {
              text: "The Early Warning System flagged three students who were falling behind before their parents even noticed. We intervened early and all three passed their end-term exams. That's the power of this platform.",
              initials: "JO", bg: "#1a5c44", name: "Ms. Jane Otieno", role: "Head Teacher · Kisumu County School",
            },
            {
              text: "Our students in rural areas now access lessons via USSD on basic phones. EduFlow is the first platform that actually thought about every Kenyan student, not just those with smartphones.",
              initials: "DM", bg: "#e8a020", name: "Dr. David Mutua", role: "County Education Director · Makueni",
            },
          ].map((t, i) => (
            <div key={i} className="testimonial reveal">
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: t.bg }}>{t.initials}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="section-tag">Simple Pricing</div>
        <h2 className="section-title">One price.<br /><span style={{ fontStyle: "italic", color: "rgba(245,240,232,0.6)" }}>Everything included.</span></h2>
        <div className="pricing-grid">
          {/* Starter */}
          <div className="pricing-card">
            <div className="pricing-name">Starter</div>
            <div className="pricing-desc">For small schools getting started with digital learning</div>
            <div className="pricing-price">Free</div>
            <div className="pricing-period">Up to 100 students</div>
            <ul className="pricing-features">
              {["Core LMS — lessons, quizzes, assignments", "Up to 5 teachers", "Basic analytics", "Parent portal", "Mobile PWA"].map((f, i) => (
                <li key={i} className="pricing-feature">{f}</li>
              ))}
            </ul>
            <a href="#" className="pricing-btn">Get Started Free</a>
          </div>
          {/* School */}
          <div className="pricing-card featured">
            <div className="pricing-tag">Most Popular</div>
            <div className="pricing-name">School</div>
            <div className="pricing-desc">Everything a growing school needs to run digitally</div>
            <div className="pricing-price">KES 15k</div>
            <div className="pricing-period">Per month · unlimited students</div>
            <ul className="pricing-features">
              {["Everything in Starter", "AI Student Tutor — EduBot", "Early Warning System", "M-Pesa Fee Integration", "Payroll & Budget Planning", "Audio Lessons & USSD", "Kiswahili Support", "Principal Dashboard"].map((f, i) => (
                <li key={i} className="pricing-feature">{f}</li>
              ))}
            </ul>
            <a href="#" className="pricing-btn">Start 30-Day Trial</a>
          </div>
          {/* County */}
          <div className="pricing-card">
            <div className="pricing-name">County</div>
            <div className="pricing-desc">For County Education offices managing multiple schools</div>
            <div className="pricing-price">Custom</div>
            <div className="pricing-period">Per county · volume pricing</div>
            <ul className="pricing-features">
              {["Everything in School", "Multi-school County Network", "County Director Dashboard", "County-wide announcements", "Cross-school lesson sharing", "Dedicated support", "Custom onboarding"].map((f, i) => (
                <li key={i} className="pricing-feature">{f}</li>
              ))}
            </ul>
            <a href="#" className="pricing-btn">Contact Us</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="contact">
        <h2 className="cta-title">Ready to transform<br />your school?</h2>
        <p className="cta-sub">Join hundreds of Kenyan schools already using EduFlow to deliver better outcomes for every student — from Nairobi to Turkana.</p>
        <div className="cta-actions">
          <a href="#" className="cta-btn-primary">Start Free Trial</a>
          <a href="#" className="cta-btn-ghost">Book a Demo</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <div className="nav-logo">Edu<span>Flow</span></div>
          <p className="footer-tagline">Kenya&apos;s most complete School Operating System. Built for CBC, designed for every Kenyan student — from Nairobi to the most remote county.</p>
        </div>
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            {["Features", "Pricing", "Security", "Changelog"].map((l) => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="footer-col-title">For Schools</div>
          <ul className="footer-links">
            {["Primary Schools", "Secondary Schools", "County Offices", "Case Studies"].map((l) => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            {["About", "Blog", "Careers", "Contact"].map((l) => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <div className="footer-copy">© 2025 EduFlow. All rights reserved.</div>
        <div className="footer-kenya">🇰🇪 Proudly built in Kenya</div>
      </div>
    </>
  );
}