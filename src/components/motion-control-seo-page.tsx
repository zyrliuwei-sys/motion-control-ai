import { MOTION_CONTROL_SITE_URL } from '@/lib/motion-control-seo';

type PageKind = 'home' | 'aiMotionControl';

type Faq = {
  question: string;
  answer: string;
};

type GalleryItem = {
  src: string;
  alt: string;
  label: string;
  detail: string;
};

type TableRow = {
  label: string;
  left: string;
  right: string;
};

type PageContent = {
  kind: PageKind;
  eyebrow: string;
  h1: string;
  lead: string;
  demoLabel: string;
  demoCaption: string;
  howTitle: string;
  steps: Array<{ number: string; title: string; copy: string }>;
  featuresTitle: string;
  features: Array<{ title: string; copy: string; icon: string }>;
  focusTitle: string;
  focusCopy: string[];
  galleryTitle: string;
  gallery: GalleryItem[];
  tableTitle: string;
  tableHeadings: [string, string, string];
  tableRows: TableRow[];
  faqTitle: string;
  faqs: Faq[];
};

const commonGallery: GalleryItem[] = [
  {
    src: '/proactiv/showcase-videos/neon-dancer.jpg',
    alt: 'AI motion control dancer animation with a neon background',
    label: 'Reference performance',
    detail: 'Retain the character while following a dance reference.',
  },
  {
    src: '/proactiv/showcase-videos/skincare-creator.jpg',
    alt: 'AI motion control creator video showing a person in a studio',
    label: 'Creator movement',
    detail: 'Transfer natural gestures from a single performance clip.',
  },
  {
    src: '/proactiv/showcase-videos/product-studio.jpg',
    alt: 'uncensored ai product character animation example',
    label: 'Product character',
    detail: 'Bring a styled character into a directed video moment.',
  },
  {
    src: '/proactiv/showcase-videos/retro-dance.jpg',
    alt: 'AI motion control retro dance animation example',
    label: 'Full-body motion',
    detail: 'Use a clear, steady motion reference for expressive results.',
  },
];

const pages: Record<PageKind, PageContent> = {
  home: {
    kind: 'home',
    eyebrow: 'IMAGE + VIDEO → MOTION',
    h1: 'uncensored ai',
    lead: 'Give a character image the movement of a reference video. Build a clean motion-transfer clip in your browser, with no credit card required to get started.',
    demoLabel: 'Motion transfer demo',
    demoCaption:
      'A reference performance becomes character animation through a Kling-class motion transfer workflow.',
    howTitle: 'How It Works',
    steps: [
      {
        number: '01',
        title: 'Upload a character image',
        copy: 'Choose a clear image of the character you want to animate.',
      },
      {
        number: '02',
        title: 'Add a motion video',
        copy: 'Provide a steady reference video with the movement you want to transfer.',
      },
      {
        number: '03',
        title: 'Generate and download',
        copy: 'Review the finished motion-transfer result and save the video when it is ready.',
      },
    ],
    featuresTitle: 'Features',
    features: [
      {
        icon: '↗',
        title: 'Character-first motion transfer',
        copy: 'Keep the character from your image while the performance drives the movement.',
      },
      {
        icon: '◌',
        title: 'Video-guided control',
        copy: 'Use an existing performance video instead of trying to describe every pose in text.',
      },
      {
        icon: '✦',
        title: 'Kling-class generation',
        copy: 'Create with a motion-transfer workflow powered by Kling/可灵-class video technology.',
      },
      {
        icon: '↓',
        title: 'Straightforward export',
        copy: 'Open the completed video, preview it in the browser, and download it from the result card.',
      },
    ],
    focusTitle: 'Free AI Motion Control Video Generator',
    focusCopy: [
      'This free ai motion control video generator turns two visual references into a directed character clip: one image establishes the character and one video supplies the movement. It is a practical way to test dance, gestures, presentation shots, and short performance ideas without a complex animation timeline.',
      'For the best transfer, use a character image with a clear upper body or full body, then pair it with a single-person video that has steady motion. The resulting video is ready to preview and save after generation finishes.',
    ],
    galleryTitle: 'Motion Transfer Before-and-After Examples',
    gallery: commonGallery,
    tableTitle: 'Free vs Paid',
    tableHeadings: ['Workflow', 'Free access', 'Paid options'],
    tableRows: [
      {
        label: 'Getting started',
        left: 'No credit card is required to begin the free motion-transfer workflow.',
        right: 'Review the Pricing page for currently available options.',
      },
      {
        label: 'Required references',
        left: 'One character image and one motion reference video.',
        right:
          'Use the same clear image-and-video inputs for a directed result.',
      },
      {
        label: 'Completed result',
        left: 'Preview the generated video in your workspace.',
        right:
          'Open Pricing to choose the option that fits your production needs.',
      },
    ],
    faqTitle: 'FAQ',
    faqs: [
      {
        question: 'What does uncensored ai do?',
        answer:
          'uncensored ai transfers the movement from a reference video onto the character in a reference image to create a new animated video.',
      },
      {
        question: 'What files do I need before generating?',
        answer:
          'You need one reference image for the character and one reference video for the motion you want to transfer.',
      },
      {
        question: 'Do I need a credit card to start?',
        answer:
          'No. A credit card is not required to start the free motion-transfer workflow.',
      },
      {
        question: 'What technology powers the motion transfer?',
        answer:
          'The workflow is powered by a Kling/可灵-class motion transfer API designed to carry human motion from video to a character image.',
      },
      {
        question: 'How do I save the generated video?',
        answer:
          'When processing is complete, open the result card to preview the video and use its download action to save a copy.',
      },
    ],
  },
  aiMotionControl: {
    kind: 'aiMotionControl',
    eyebrow: 'CONTROL MOVEMENT WITH REAL PERFORMANCE',
    h1: 'AI Motion Control for Natural Character Animation',
    lead: 'Turn a real performance into directed character movement. AI Motion Control uses a reference video to steer pose, timing, and expression in a new video generation.',
    demoLabel: 'AI Motion Control demonstration',
    demoCaption:
      'Use visual references to preserve character identity while directing movement with a real performance.',
    howTitle: 'How AI Motion Control Works',
    steps: [
      {
        number: '01',
        title: 'Set the character',
        copy: 'Start with an image that clearly shows the subject you want to animate.',
      },
      {
        number: '02',
        title: 'Direct with movement',
        copy: 'Choose a single-person reference video with readable, continuous motion.',
      },
      {
        number: '03',
        title: 'Create the animation',
        copy: 'Generate a new video that applies the reference performance to the selected character.',
      },
    ],
    featuresTitle: 'AI Motion Control Features',
    features: [
      {
        icon: '◒',
        title: 'Performance-led animation',
        copy: 'Direct body language and timing from a real reference instead of relying on text alone.',
      },
      {
        icon: '◎',
        title: 'Consistent character focus',
        copy: 'Pair a clear character image with a compatible performance for a focused transfer.',
      },
      {
        icon: '⌁',
        title: 'Creative motion workflows',
        copy: 'Explore dance, creator content, product scenes, and stylized character moments.',
      },
      {
        icon: '◫',
        title: 'Browser-based review',
        copy: 'Keep the input, generation status, preview, and export actions in one workspace.',
      },
    ],
    focusTitle: 'AI Motion Control for Character Animation',
    focusCopy: [
      'AI motion control is useful when movement matters as much as the visual style. Instead of approximating a performance with a prompt, you can give the model a visual record of the pacing, gestures, and poses you want the character to follow.',
      'A strong reference pair makes the workflow easier to direct: choose a character image with a clearly visible person, and a reference video with a consistent subject and minimal camera cuts. Add a short prompt only when you want to guide visual details or camera treatment.',
    ],
    galleryTitle: 'AI Motion Control Video Examples',
    gallery: commonGallery.map((item) => ({
      ...item,
      alt: item.alt.replace('uncensored ai', 'AI motion control'),
    })),
    tableTitle: 'Motion Transfer Input and Output Options',
    tableHeadings: ['Stage', 'What you provide', 'What you receive'],
    tableRows: [
      {
        label: 'Character reference',
        left: 'A clear image of the person or character to animate.',
        right:
          'A character-led video generation that retains the chosen visual subject.',
      },
      {
        label: 'Motion reference',
        left: 'A steady reference video with the performance to transfer.',
        right:
          'Movement guided by the timing, pose, and action in that reference.',
      },
      {
        label: 'Finished generation',
        left: 'Optional creative direction for visual details or camera treatment.',
        right:
          'An in-browser preview and a direct download action when the video is complete.',
      },
    ],
    faqTitle: 'AI Motion Control FAQ',
    faqs: [
      {
        question: 'What is AI Motion Control?',
        answer:
          'AI Motion Control is a video-generation workflow that transfers the movement in a reference video to the character shown in a separate reference image.',
      },
      {
        question: 'Why do I need both an image and a video?',
        answer:
          'The image identifies the character to animate, while the video supplies the movement, timing, and body language for the generated clip.',
      },
      {
        question: 'What makes a good motion reference video?',
        answer:
          'Use a clear, steady video with one visible person, continuous movement, and few fast cuts or scene changes.',
      },
      {
        question: 'Can I add a text prompt to AI Motion Control?',
        answer:
          'Yes. A prompt can add visual details such as clothing, scene elements, or camera treatment alongside the image and motion references.',
      },
      {
        question: 'Where can I find the finished video?',
        answer:
          'After the generation completes, the result appears in your workspace with a video preview and a download action.',
      },
    ],
  },
};

function SparkMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-lime-300"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2.5 14.2 9.8 21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2L12 2.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function JsonLd({ content }: { content: PageContent }) {
  const canonicalUrl = `${MOTION_CONTROL_SITE_URL}${content.kind === 'home' ? '' : '/ai-motion-control'}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'uncensored ai',
      url: canonicalUrl,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function MotionControlSeoPage({ kind }: { kind: PageKind }) {
  const content = pages[kind];
  const isHome = kind === 'home';

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b0d] text-stone-100 selection:bg-lime-300 selection:text-black">
      <header className="relative z-20 border-b border-white/10 bg-[#080b0d]/90 backdrop-blur-xl">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"
        >
          <a
            href="/"
            className="group inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border border-lime-200/30 bg-lime-300/10 transition group-hover:border-lime-200/60">
              <SparkMark />
            </span>
            <span>uncensored ai</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-stone-300 md:flex">
            <a className="transition hover:text-lime-200" href="/">
              Home
            </a>
            <a
              className="transition hover:text-lime-200"
              href="/ai-motion-control"
            >
              AI Motion Control
            </a>
            <a className="transition hover:text-lime-200" href="/pricing">
              Pricing
            </a>
            <a
              className="transition hover:text-lime-200"
              href={isHome ? '#faq' : '/ai-motion-control#faq'}
            >
              FAQ
            </a>
          </div>
          <a
            href="/text-to-image"
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-lime-200 focus:ring-2 focus:ring-lime-200 focus:ring-offset-2 focus:ring-offset-[#080b0d] focus:outline-none"
          >
            Try Free Now <ArrowIcon />
          </a>
        </nav>
      </header>

      <main>
        <section className="relative isolate border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(193,255,73,0.17),transparent_31%),radial-gradient(circle_at_88%_28%,rgba(71,95,255,0.16),transparent_24%)]" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-16 pb-18 sm:px-8 sm:pt-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.95fr)] lg:items-center lg:gap-16 lg:px-10 lg:pb-28">
            <div className="max-w-2xl">
              <p className="mb-6 flex items-center gap-3 text-[11px] font-bold tracking-[0.24em] text-lime-200">
                <span className="h-px w-9 bg-lime-300" />
                {content.eyebrow}
              </p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                {content.h1}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-stone-300 sm:text-xl">
                {content.lead}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/text-to-image"
                  className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-lime-200 focus:ring-2 focus:ring-lime-200 focus:ring-offset-2 focus:ring-offset-[#080b0d] focus:outline-none"
                >
                  Try Free Now <ArrowIcon />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-sm font-medium text-stone-100 transition hover:border-white/35 hover:bg-white/5"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-7 text-xs leading-5 text-stone-500">
                One character image + one motion video. Built for visual motion
                transfer.
              </p>
            </div>

            <figure className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-lime-300/8 blur-3xl" />
              <div className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#12171a] p-3 shadow-2xl shadow-black/40 sm:p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#151d1f]">
                  <video
                    aria-label={content.demoLabel}
                    autoPlay
                    className="h-full w-full object-cover opacity-80"
                    loop
                    muted
                    playsInline
                    poster="/proactiv/showcase-videos/neon-dancer.jpg"
                    preload="metadata"
                  >
                    <source
                      src="/proactiv/showcase-videos/neon-dancer.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,11,13,0.6),transparent_52%,rgba(8,11,13,0.2))]" />
                  <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white backdrop-blur-md">
                    LIVE DEMO
                  </div>
                  <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between rounded-xl border border-white/15 bg-[#0a0e10]/75 p-3.5 backdrop-blur-md">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.15em] text-lime-200">
                        MOTION TRANSFER
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        Reference performance → character
                      </p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300 text-lg text-black">
                      ↗
                    </span>
                  </div>
                </div>
                <figcaption className="px-1 pt-4 text-sm leading-6 text-stone-400">
                  {content.demoCaption}
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
              THE WORKFLOW
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {content.howTitle}
            </h2>
          </div>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {content.steps.map((step) => (
              <li key={step.number} className="bg-[#0d1214] p-6 sm:p-7">
                <span className="text-xs font-bold tracking-[0.2em] text-lime-200">
                  {step.number}
                </span>
                <h3 className="mt-12 text-xl font-semibold tracking-[-0.025em] text-white">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-stone-400">
                  {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="features"
          className="border-y border-white/10 bg-[#0d1214]"
        >
          <div className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
                  BUILT FOR DIRECTION
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  {content.featuresTitle}
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-stone-400">
                A concise visual workflow from references to a downloadable
                motion-transfer result.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-[#101618] p-6 transition hover:-translate-y-1 hover:border-lime-200/30"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-lime-300/10 text-xl text-lime-200">
                    {feature.icon}
                  </span>
                  <h3 className="mt-10 text-lg font-semibold tracking-[-0.02em] text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-400">
                    {feature.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(193,255,73,0.12),transparent_62%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-10 lg:py-24">
            <div className="lg:sticky lg:top-10">
              <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
                FROM REFERENCES TO VIDEO
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {content.focusTitle}
              </h2>
            </div>
            <div className="max-w-2xl space-y-5 text-base leading-8 text-stone-300 sm:text-lg">
              {content.focusCopy.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="gallery" className="border-y border-white/10 bg-[#0d1214]">
          <div className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
                EXAMPLE DIRECTIONS
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {content.galleryTitle}
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.gallery.map((item) => (
                <figure
                  key={item.src}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101618]"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      alt={item.alt}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      decoding="async"
                      height="1000"
                      loading="lazy"
                      src={item.src}
                      width="800"
                    />
                  </div>
                  <figcaption className="p-4">
                    <h3 className="font-semibold text-white">{item.label}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-stone-400">
                      {item.detail}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
              CLEAR EXPECTATIONS
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {content.tableTitle}
            </h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-[#141b1d] text-xs font-bold tracking-[0.14em] text-stone-400 uppercase">
                <tr>
                  {content.tableHeadings.map((heading) => (
                    <th key={heading} className="px-5 py-4 font-bold sm:px-6">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#0d1214] text-stone-300">
                {content.tableRows.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="px-5 py-5 font-semibold text-white sm:px-6"
                    >
                      {row.label}
                    </th>
                    <td className="px-5 py-5 leading-6 text-stone-400 sm:px-6">
                      {row.left}
                    </td>
                    <td className="px-5 py-5 leading-6 text-stone-400 sm:px-6">
                      {row.right}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="faq" className="border-t border-white/10 bg-[#0d1214]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-24">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-lime-200">
                HELPFUL ANSWERS
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {content.faqTitle}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">
                Everything you need to prepare a focused motion-transfer
                generation.
              </p>
            </div>
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#101618] px-5 sm:px-6">
              {content.faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  className="group py-5"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-white marker:hidden">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="text-lime-200 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pt-3 pr-8 text-sm leading-6 text-stone-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#080b0d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>
            © 2026 uncensored ai. Image-to-motion video generation in the
            browser.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {isHome ? (
              <a
                href="/ai-motion-control"
                className="transition hover:text-lime-200"
              >
                AI Motion Control
              </a>
            ) : (
              <a href="/" className="transition hover:text-lime-200">
                uncensored ai
              </a>
            )}
            <a href="/pricing" className="transition hover:text-lime-200">
              Pricing
            </a>
            <a
              href="/privacy-policy"
              className="transition hover:text-lime-200"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
      <JsonLd content={content} />
    </div>
  );
}
