import type { ProactivFeature } from '@/types/proactiv';
import {
  Bolt,
  Bot,
  BrainCircuit,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MousePointer2,
  Music2,
  Network,
  Send,
  Sparkles,
  Twitch,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

export type ProactivFeaturesProps = {
  title: string;
  description: string;
  features: ProactivFeature[];
};

const socialNetworks: Array<{
  Icon: LucideIcon;
  color: string;
  label: string;
}> = [
  { Icon: Instagram, color: '#f06f9e', label: 'Instagram' },
  { Icon: Music2, color: '#e9f5ff', label: 'TikTok' },
  { Icon: Twitch, color: '#ad8cff', label: 'Twitch' },
  { Icon: Facebook, color: '#6ca8ff', label: 'Facebook' },
  { Icon: Network, color: '#78b6ff', label: 'Meta' },
  { Icon: Linkedin, color: '#6bceff', label: 'LinkedIn' },
  { Icon: Send, color: '#71e3c8', label: 'Telegram' },
  { Icon: Youtube, color: '#ff7474', label: 'YouTube' },
];

export function ProactivFeatures({
  title,
  description,
  features,
}: ProactivFeaturesProps) {
  return (
    <section
      aria-labelledby="proactiv-features-title"
      className="proactiv-features relative overflow-hidden bg-[#08090a] py-20 text-white"
    >
      <FeatureAnimationStyles />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-80 blur-3xl"
        style={{
          background:
            'conic-gradient(from 185deg at 50% 4%, transparent 0deg, rgba(0, 128, 196, 0.12) 48deg, rgba(57, 195, 239, 0.34) 105deg, rgba(9, 61, 109, 0.22) 170deg, transparent 242deg, rgba(0, 115, 205, 0.12) 315deg, transparent 360deg)',
          maskImage:
            'radial-gradient(67% 50% at 50% 0%, black 0%, rgba(0, 0, 0, 0.7) 43%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(67% 50% at 50% 0%, black 0%, rgba(0, 0, 0, 0.7) 43%, transparent 78%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-8">
        <FeatureBadge />
        <h2
          id="proactiv-features-title"
          className="pt-4 text-center text-4xl font-medium tracking-[-0.045em] text-white sm:text-5xl"
        >
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-neutral-400">
          {description}
        </p>

        <div className="grid min-w-0 grid-cols-1 gap-2 py-10 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.illustration} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBadge() {
  return (
    <div className="[perspective:400px] [transform-style:preserve-3d]">
      <div
        className="relative mx-auto h-14 w-14 rounded-md bg-gradient-to-b from-neutral-800 to-neutral-950 p-1"
        style={{ transform: 'rotateX(25deg)', transformOrigin: 'center' }}
      >
        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-[5px] bg-[#121416]">
          <Bolt
            aria-hidden="true"
            className="h-6 w-6 fill-[#ff8a5b] text-[#ff8a5b]"
          />
          <span className="absolute bottom-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ff8a5b] to-transparent" />
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-20 mx-auto h-2 w-3/5 bg-[#ff8a5b] opacity-45 blur-md"
        />
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: ProactivFeature }) {
  const featured = feature.featured ?? feature.illustration === 'social';

  return (
    <article
      className={`group min-w-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(40,40,40,0.30)] p-8 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      {featured ? (
        <>
          <FeatureCopy feature={feature} />
          <FeatureVisual illustration={feature.illustration} featured />
        </>
      ) : (
        <>
          <FeatureVisual illustration={feature.illustration} />
          <FeatureCopy feature={feature} />
        </>
      )}
    </article>
  );
}

function FeatureCopy({ feature }: { feature: ProactivFeature }) {
  return (
    <div className="relative z-10">
      <h3 className="py-2 text-lg font-semibold text-white">{feature.title}</h3>
      <p className="max-w-sm text-sm leading-6 text-neutral-400">
        {feature.description}
      </p>
    </div>
  );
}

function FeatureVisual({
  illustration,
  featured = false,
}: {
  illustration: ProactivFeature['illustration'];
  featured?: boolean;
}) {
  const visualClass = `relative mt-5 min-w-0 overflow-hidden rounded-lg ${
    featured ? 'h-52 sm:h-60' : 'h-48'
  }`;

  switch (illustration) {
    case 'social':
      return (
        <div className={visualClass}>
          <SocialVisual />
        </div>
      );
    case 'analytics':
      return (
        <div className={visualClass}>
          <AnalyticsVisual />
        </div>
      );
    case 'ai':
      return (
        <div className={visualClass}>
          <AiVisual />
        </div>
      );
    case 'collaboration':
      return (
        <div className={visualClass}>
          <CollaborationVisual />
        </div>
      );
    case 'audience':
      return (
        <div className={visualClass}>
          <AudienceVisual />
        </div>
      );
  }
}

function SocialVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden px-3 sm:px-8">
      <div aria-hidden="true" className="p-social-route p-social-route-one">
        <span />
      </div>
      <div aria-hidden="true" className="p-social-route p-social-route-two">
        <span />
      </div>
      <div className="relative flex w-full max-w-xl flex-col items-center gap-4">
        <SocialRow start={0} />
        <SocialRow start={4} offset />
      </div>
    </div>
  );
}

function SocialRow({
  start,
  offset = false,
}: {
  start: number;
  offset?: boolean;
}) {
  const networks = Array.from(
    { length: 7 },
    (_, index) => socialNetworks[(start + index) % socialNetworks.length]
  );

  return (
    <ul
      aria-label="Supported social platforms"
      className={`relative z-10 flex max-w-full items-center justify-center gap-2 sm:gap-3 ${
        offset ? 'translate-x-4 sm:translate-x-8' : ''
      }`}
    >
      {networks.map(({ Icon, color, label }, index) => (
        <li key={`${label}-${index}`}>
          <span
            aria-label={label}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] shadow-[0_0_10px_rgba(248,248,248,0.12)_inset] sm:h-10 sm:w-10"
            style={{ color }}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function AnalyticsVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <div aria-hidden="true" className="p-analytics-dots" />
      <div className="p-connections-message absolute top-2 left-2 z-10 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-neutral-200 shadow-[0_0_8px_rgba(248,248,248,0.20)_inset] sm:top-4 sm:left-4">
        +200 connections
      </div>
      <svg
        aria-label="Audience connection growth chart"
        className="relative z-[1] h-auto w-[125%] max-w-none text-neutral-600"
        viewBox="0 0 335 163"
        role="img"
      >
        <defs>
          <linearGradient id="proactiv-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#ff8a5b" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ff8a5b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="proactiv-chart-line" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#ff8a5b" stopOpacity="0" />
            <stop offset="0.42" stopColor="#ff8a5b" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffcc74" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M0 55 C26 55 27 77 53 77 C79 77 81 37 107 37 C133 37 132 68 159 68 C185 68 187 37 212 37 C238 37 239 2 265 2 C290 2 293 34 315 30 C323 28 327 68 335 151 L335 163 L0 163 Z"
          fill="url(#proactiv-chart-fill)"
          opacity="0.7"
        />
        <path
          d="M0 55 C26 55 27 77 53 77 C79 77 81 37 107 37 C133 37 132 68 159 68 C185 68 187 37 212 37 C238 37 239 2 265 2 C290 2 293 34 315 30 C323 28 327 68 335 151"
          fill="none"
          stroke="url(#proactiv-chart-line)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

const aiMarks: Array<{ Icon: LucideIcon; color: string; size: string }> = [
  { Icon: Sparkles, color: '#e1a46e', size: 'h-9 w-9' },
  { Icon: Bot, color: '#b1a1ff', size: 'h-12 w-12' },
  { Icon: BrainCircuit, color: '#ff8a5b', size: 'h-16 w-16' },
  { Icon: Network, color: '#6aabff', size: 'h-12 w-12' },
  { Icon: Sparkles, color: '#e8be78', size: 'h-9 w-9' },
];

function AiVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
        {aiMarks.map(({ Icon, color, size }, index) => (
          <span
            key={`${color}-${index}`}
            className={`p-ai-mark ${size} flex items-center justify-center rounded-full border border-white/10 bg-white/[0.035] shadow-[0_0_8px_rgba(248,248,248,0.25)_inset,0_32px_24px_-16px_rgba(0,0,0,0.40)]`}
            style={{ color, animationDelay: `${index * 0.55}s` }}
          >
            <Icon aria-hidden="true" className="h-[42%] w-[42%]" />
          </span>
        ))}
      </div>
      <span aria-hidden="true" className="p-ai-scan" />
    </div>
  );
}

function CollaborationVisual() {
  const campaigns = [
    { label: 'Twitter post', Icon: Send, className: 'ml-4 sm:ml-6' },
    { label: 'Email Campaign', Icon: Mail, className: 'ml-9 sm:ml-12' },
    { label: 'Newsletter Campaign', Icon: Sparkles, className: 'ml-4 sm:ml-6' },
  ];

  return (
    <div className="relative h-full overflow-hidden px-5 py-3">
      <div aria-hidden="true" className="p-collaboration-timeline" />
      <div className="relative z-10 flex h-full flex-col justify-center gap-3">
        {campaigns.map(({ label, Icon, className }) => (
          <div
            key={label}
            className={`p-campaign-label relative flex w-fit items-center gap-2 rounded-lg border border-neutral-600 bg-white/[0.025] py-2 pr-3 pl-2.5 text-[11px] text-neutral-400 shadow-[0_0_8px_rgba(248,248,248,0.18)_inset] transition duration-200 ${className} ${
              label === 'Email Campaign'
                ? 'group-hover:border-[#ff8a5b]/70 group-hover:text-[#ffc2a8] group-hover:shadow-[0_0_14px_rgba(255,138,91,0.20)_inset]'
                : ''
            }`}
          >
            <Icon
              aria-hidden="true"
              className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-[#ff8a5b]"
            />
            {label}
          </div>
        ))}
      </div>
      <MousePointer2
        aria-hidden="true"
        className="absolute top-[37%] left-[63%] z-20 h-4 w-4 fill-[#08141a] text-[#ff8a5b] transition-all duration-200 group-hover:top-[32%] group-hover:left-[54%]"
      />
      <span className="absolute top-[47%] left-[68%] z-20 text-[10px] whitespace-nowrap text-neutral-500 transition-all duration-200 group-hover:left-[58%] group-hover:text-[#ffc2a8]">
        Manu Arora
      </span>
      <span className="absolute bottom-[15%] left-[15%] z-20 text-[10px] whitespace-nowrap text-neutral-600 transition-all duration-200 group-hover:bottom-[23%] group-hover:left-[32%] group-hover:text-white">
        Tyler Durden
      </span>
    </div>
  );
}

function AudienceVisual() {
  return (
    <div className="relative h-full overflow-hidden">
      <AudienceProfile
        image="/proactiv/avatar.png"
        name="Manu Arora"
        count="69,420"
        className="translate-y-0 group-hover:-translate-y-full"
      />
      <AudienceProfile
        image="/proactiv/avatar.jpeg"
        name="Tyler Durden"
        count="8008"
        className="translate-y-full group-hover:translate-y-0"
      />
    </div>
  );
}

function AudienceProfile({
  image,
  name,
  count,
  className,
}: {
  image: string;
  name: string;
  count: string;
  className: string;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-200 ${className}`}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/[0.025] p-2 shadow-[0_0_8px_rgba(248,248,248,0.25)_inset,0_32px_24px_-16px_rgba(0,0,0,0.40)]">
        <img
          alt=""
          className="h-16 w-16 rounded-md object-cover"
          height={64}
          src={image}
          width={64}
        />
      </span>
      <p className="mt-3 text-sm font-bold text-neutral-300">{name}</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-neutral-300">
        <span>Most engagements</span>
        <span
          aria-hidden="true"
          className="h-1 w-1 rounded-full bg-neutral-400"
        />
        <span>{count}</span>
      </p>
      <span
        aria-hidden="true"
        className="mt-4 h-6 w-[85%] rounded-[100%] border-t border-white/25 opacity-70"
      />
    </div>
  );
}

function FeatureAnimationStyles() {
  return (
    <style>{`
      .proactiv-features .p-social-route {
        position: absolute;
        width: min(31vw, 240px);
        height: 108px;
        border-color: rgba(163, 174, 189, 0.34);
        border-style: solid;
        pointer-events: none;
      }
      .proactiv-features .p-social-route span {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #ff8a5b;
        box-shadow: 0 0 12px 3px rgba(57, 195, 239, 0.7);
      }
      .proactiv-features .p-social-route-one {
        left: 17%;
        top: -3px;
        border-width: 0 0 1px 1px;
        border-radius: 0 0 0 14px;
      }
      .proactiv-features .p-social-route-one span {
        left: -3px;
        top: -3px;
        animation: proactiv-route-one 5s linear infinite;
      }
      .proactiv-features .p-social-route-two {
        right: 15%;
        bottom: -9px;
        border-width: 1px 1px 0 0;
        border-radius: 0 14px 0 0;
      }
      .proactiv-features .p-social-route-two span {
        right: -3px;
        bottom: -3px;
        animation: proactiv-route-two 5.8s linear infinite 1.1s;
      }
      .proactiv-features .p-connections-message {
        transform: scale(0.15);
        transform-origin: center;
        transition: transform 180ms ease-out;
      }
      .proactiv-features .group:hover .p-connections-message {
        transform: scale(1);
      }
      .proactiv-features .p-analytics-dots {
        position: absolute;
        inset: 0;
        left: 50%;
        width: 1px;
        background: repeating-linear-gradient(to bottom, rgba(248, 248, 248, 0.35) 0 2px, transparent 2px 11px);
        opacity: 0.35;
      }
      .proactiv-features .p-ai-mark {
        animation: proactiv-ai-rise 5.75s ease-in-out infinite;
      }
      .proactiv-features .p-ai-scan {
        position: absolute;
        top: 12%;
        bottom: 12%;
        width: 1px;
        background: linear-gradient(to bottom, transparent, #ff8a5b, transparent);
        box-shadow: 0 0 18px 2px rgba(57, 195, 239, 0.55);
        animation: proactiv-ai-scan 5.75s ease-in-out infinite;
      }
      .proactiv-features .p-collaboration-timeline {
        position: absolute;
        top: 8%;
        bottom: 8%;
        left: 50%;
        width: 1px;
        opacity: 0.32;
        background: repeating-linear-gradient(to bottom, rgba(248, 248, 248, 0.62) 0 2px, transparent 2px 12px);
      }
      .proactiv-features .p-campaign-label::before {
        position: absolute;
        top: 50%;
        left: -0.75rem;
        width: 0.45rem;
        height: 0.45rem;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 999px;
        background: #111416;
        box-shadow: 0 0 0 3px rgba(248, 248, 248, 0.03);
        content: '';
        transform: translateY(-50%);
      }
      .proactiv-features .group:hover .p-campaign-label {
        transform: translateX(0.22rem);
      }
      @keyframes proactiv-route-one {
        0%, 8% { transform: translate(0, 0); opacity: 0; }
        12% { opacity: 1; }
        52% { transform: translate(0, 108px); opacity: 1; }
        88% { transform: translate(min(31vw, 240px), 108px); opacity: 1; }
        100% { transform: translate(min(31vw, 240px), 108px); opacity: 0; }
      }
      @keyframes proactiv-route-two {
        0%, 8% { transform: translate(0, 0); opacity: 0; }
        12% { opacity: 1; }
        50% { transform: translate(0, -108px); opacity: 1; }
        88% { transform: translate(calc(-1 * min(31vw, 240px)), -108px); opacity: 1; }
        100% { transform: translate(calc(-1 * min(31vw, 240px)), -108px); opacity: 0; }
      }
      @keyframes proactiv-ai-rise {
        0%, 14%, 100% { transform: translateY(0) scale(1); }
        7% { transform: translateY(-7px) scale(1.08); }
      }
      @keyframes proactiv-ai-scan {
        0%, 100% { transform: translateX(-105px); opacity: 0; }
        14% { opacity: 0.85; }
        55% { transform: translateX(105px); opacity: 0.85; }
        68% { opacity: 0; }
      }
      @media (max-width: 639px) {
        .proactiv-features .p-social-route { width: 58vw; }
        @keyframes proactiv-route-one {
          0%, 8% { transform: translate(0, 0); opacity: 0; }
          12% { opacity: 1; }
          52% { transform: translate(0, 108px); opacity: 1; }
          88% { transform: translate(58vw, 108px); opacity: 1; }
          100% { transform: translate(58vw, 108px); opacity: 0; }
        }
        @keyframes proactiv-route-two {
          0%, 8% { transform: translate(0, 0); opacity: 0; }
          12% { opacity: 1; }
          50% { transform: translate(0, -108px); opacity: 1; }
          88% { transform: translate(-58vw, -108px); opacity: 1; }
          100% { transform: translate(-58vw, -108px); opacity: 0; }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .proactiv-features *, .proactiv-features *::before, .proactiv-features *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
