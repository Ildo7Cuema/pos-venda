'use client';

import {
    BarChart3,
    Coins,
    Package,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Wallet,
} from 'lucide-react';

const FLOATING_ICONS = [
    { Icon: TrendingUp, className: 'top-[12%] left-[8%] w-10 h-10 animate-sales-float', delay: '0s' },
    { Icon: ShoppingCart, className: 'top-[22%] right-[10%] w-9 h-9 animate-sales-float-slow', delay: '1.2s' },
    { Icon: Coins, className: 'top-[48%] left-[6%] w-8 h-8 animate-sales-float', delay: '2.4s' },
    { Icon: Receipt, className: 'bottom-[28%] right-[8%] w-9 h-9 animate-sales-float-slow', delay: '0.6s' },
    { Icon: BarChart3, className: 'bottom-[18%] left-[14%] w-10 h-10 animate-sales-float', delay: '1.8s' },
    { Icon: Package, className: 'top-[38%] right-[18%] w-8 h-8 animate-sales-float-slow', delay: '3s' },
    { Icon: Wallet, className: 'bottom-[40%] left-[22%] w-7 h-7 animate-sales-float', delay: '0.9s' },
] as const;

const PARTICLES = [
    { left: '8%', delay: '0s', duration: '14s', size: 4 },
    { left: '18%', delay: '2s', duration: '16s', size: 3 },
    { left: '32%', delay: '4s', duration: '12s', size: 5 },
    { left: '45%', delay: '1s', duration: '18s', size: 3 },
    { left: '58%', delay: '3s', duration: '15s', size: 4 },
    { left: '72%', delay: '5s', duration: '13s', size: 3 },
    { left: '85%', delay: '2.5s', duration: '17s', size: 5 },
    { left: '92%', delay: '0.5s', duration: '14s', size: 4 },
] as const;

export default function SalesBackground() {
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
        >
            {/* Soft light base — gray / off-white with brand accents */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(206,17,38,0.08),transparent_50%),radial-gradient(ellipse_at_85%_10%,rgba(255,205,0,0.12),transparent_45%),radial-gradient(ellipse_at_70%_85%,rgba(206,17,38,0.06),transparent_50%),linear-gradient(160deg,#f8f9fb_0%,#eef1f5_45%,#f5f6f8_100%)]" />

            {/* Soft moving light wash */}
            <div className="absolute -inset-[20%] animate-sales-aurora opacity-50 bg-[conic-gradient(from_120deg_at_50%_50%,transparent_0deg,rgba(206,17,38,0.08)_60deg,transparent_120deg,rgba(255,205,0,0.1)_200deg,transparent_280deg)]" />

            {/* Grid suggesting commerce / data */}
            <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
                }}
            />

            {/* Animated growth chart */}
            <svg
                className="absolute bottom-0 left-0 w-full h-[55%] opacity-50"
                viewBox="0 0 1200 400"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="salesChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#CE1126" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#CE1126" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="salesChartStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#CE1126" stopOpacity="0.25" />
                        <stop offset="50%" stopColor="#CE1126" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#b45309" stopOpacity="0.55" />
                    </linearGradient>
                </defs>

                <path
                    className="animate-sales-chart-draw"
                    d="M0,340 C80,320 120,280 200,260 C280,240 320,200 400,190 C480,180 520,220 600,160 C680,100 720,90 800,120 C880,150 920,80 1000,60 C1080,40 1140,90 1200,50 L1200,400 L0,400 Z"
                    fill="url(#salesChartFill)"
                />
                <path
                    className="animate-sales-chart-draw"
                    d="M0,340 C80,320 120,280 200,260 C280,240 320,200 400,190 C480,180 520,220 600,160 C680,100 720,90 800,120 C880,150 920,80 1000,60 C1080,40 1140,90 1200,50"
                    fill="none"
                    stroke="url(#salesChartStroke)"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* Rising bars */}
                {[
                    { x: 140, h: 90, delay: '0s' },
                    { x: 260, h: 130, delay: '0.2s' },
                    { x: 380, h: 110, delay: '0.4s' },
                    { x: 500, h: 170, delay: '0.15s' },
                    { x: 620, h: 200, delay: '0.35s' },
                    { x: 740, h: 150, delay: '0.5s' },
                    { x: 860, h: 230, delay: '0.25s' },
                    { x: 980, h: 190, delay: '0.45s' },
                ].map((bar) => (
                    <rect
                        key={bar.x}
                        className="animate-sales-bar origin-bottom"
                        x={bar.x}
                        y={360 - bar.h}
                        width="28"
                        height={bar.h}
                        rx="4"
                        fill="#CE1126"
                        fillOpacity="0.12"
                        style={{ animationDelay: bar.delay }}
                    />
                ))}
            </svg>

            {/* Floating business icons */}
            {FLOATING_ICONS.map(({ Icon, className, delay }, i) => (
                <div
                    key={i}
                    className={`absolute text-[var(--primary)]/20 ${className}`}
                    style={{ animationDelay: delay }}
                >
                    <Icon className="w-full h-full" strokeWidth={1.5} />
                </div>
            ))}

            {/* Rising particles (sales momentum) */}
            {PARTICLES.map((p, i) => (
                <span
                    key={i}
                    className="absolute bottom-0 rounded-full bg-[var(--primary)]/35 animate-sales-rise"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                />
            ))}

            {/* Soft edge vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(226,232,240,0.55)_100%)]" />
        </div>
    );
}
