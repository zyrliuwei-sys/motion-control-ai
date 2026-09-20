import { Link } from '@/core/i18n/navigation';
import { getLocale } from '@/paraglide/runtime.js';
import { AiVideoGeneratorFaq } from '@/components/ai-video-generator-faq';

const sectionHeadingClass =
  'text-2xl font-semibold tracking-[-0.04em] text-[#354144] sm:text-3xl';
const subheadingClass = 'text-lg font-semibold text-[#354144]';
const paragraphClass = 'text-sm leading-7 text-[#718083] sm:text-base';

type SeoCopy = {
  stepsTitle: string;
  steps: Array<{ title: string; body: string }>;
  imageEditorBefore: string;
  imageEditorLabel: string;
  imageEditorAfter: string;
  promptsTitle: string;
  promptsIntro: string;
  prompts: string[];
  ageNotice: string;
  controlsTitle: string;
  controls: Array<{ label: string; body: string }>;
  comparisonTitle: string;
  comparisonLeft: string;
  comparisonRight: string;
  comparisonRows: Array<[string, string, string]>;
  comparisonClosing: string;
  pricingTitle: string;
  pricingBeforeLink: string;
  pricingLinkLabel: string;
  pricingAfterLink: string;
};

const englishCopy: SeoCopy = {
  stepsTitle: 'How to Generate a Video With No Filter in 3 Steps',
  steps: [
    {
      title: '1. Start from a prompt or an image',
      body: 'Choose Text to Video for a new scene, Image to Video to animate a still, or Reference to Video when a visual direction matters.',
    },
    {
      title: '2. Write the motion the way you want it',
      body: 'Describe movement in plain language: slow camera push-in, coat moving in the wind, or a figure turning and walking out of frame. Camera moves, subject motion, pace, and output settings are adjustable before you generate.',
    },
    {
      title: '3. Generate, preview, download',
      body: 'The exact credit cost appears on the button before the task starts. Preview the clip, refine the prompt or settings, and download the take you want to keep.',
    },
  ],
  imageEditorBefore: 'You can also make a starting frame in the',
  imageEditorLabel: 'AI image editor',
  imageEditorAfter:
    '. Both tools use the same account and credit system, so you can move from a still image to an animated clip without changing workflows.',
  promptsTitle: 'Prompts That Other Generators Refuse',
  promptsIntro:
    'Many video tools rewrite or block prompts before they reach a model. This studio sends your motion direction as written, subject to applicable law and the rights you have to your inputs:',
  prompts: [
    'adult, sensual, and mature themes handled as adult material rather than as an unexplained error',
    'dark, horror, and fictional violent scenes',
    'real-world posing, lighting, and camera language that filtered tools often flag',
    'a frame you already approved in the image editor, animated instead of judged',
  ],
  ageNotice:
    'You must be 18 or older to generate adult content, and you are responsible for what you upload and where you publish it.',
  controlsTitle: 'Motion and Camera Controls',
  controls: [
    {
      label: 'Camera moves',
      body: 'push-in, pull-out, pan, orbit, and handheld',
    },
    {
      label: 'Subject motion',
      body: 'hair, fabric, water, fur, and other movement inside the frame',
    },
    { label: 'Pace', body: 'slow and cinematic, or quick and snappy' },
    {
      label: 'Aspect ratio',
      body: '9:16 for Reels, Shorts, and TikTok; 1:1 for feeds; 16:9 for YouTube',
    },
    {
      label: 'Clip length and resolution',
      body: 'Seedance 2.5 supports 4–30 seconds at 480p, 720p, or 1080p. MiniMax H3 Max supports 5–15 seconds at 480p or 768p.',
    },
    {
      label: 'Regenerate',
      body: 'keep the image, change the motion, and compare takes side by side',
    },
  ],
  comparisonTitle: 'AI Video Generator With No Filter vs. Filtered Generators',
  comparisonLeft: 'Uncensored AI',
  comparisonRight: 'Typical filtered video generator',
  comparisonRows: [
    ['Motion prompt', 'Used as written', 'Rewritten, softened, or refused'],
    [
      'Adult and mature themes',
      'Allowed for adults 18+',
      'Blocked or silently downgraded',
    ],
    [
      'Starting point',
      'A prompt, an image, or a visual reference',
      'Often text only',
    ],
    [
      'Consistency',
      'Your input image can guide the face and composition',
      'Composition may drift between generations',
    ],
    [
      'Cost transparency',
      'Whole-credit cost shown before every task',
      'Subscription tiers may hide per-task cost',
    ],
    [
      'Output policy',
      'No product watermark is added by this flow; provider and plan terms may apply',
      'Watermark rules vary by provider and plan',
    ],
  ],
  comparisonClosing:
    'The difference is control: you can bring your own visual direction, see the cost before submission, and decide how to refine the result.',
  pricingTitle: 'Credits, Pricing, Watermarks, and Commercial Use',
  pricingBeforeLink:
    'Video generation currently requires sign-in and a paid credit grant. Seedance 2.5 supports 4–30 seconds at 480p, 720p, or 1080p; MiniMax H3 Max supports 5–15 seconds at 480p or 768p. Retail pricing is calculated at 7× the EvoLink rate and rounded up to whole credits, with the exact amount shown before generation. Generation is asynchronous, so completion time depends on the provider queue. The current flow does not add a product watermark, but provider output rules and your plan terms may apply. Commercial use is your responsibility: confirm that you own the rights to uploaded material and review the current',
  pricingLinkLabel: 'pricing',
  pricingAfterLink: 'and service terms before publishing.',
};

const chineseCopy: SeoCopy = {
  stepsTitle: '无过滤 AI 视频生成器：3 步生成视频',
  steps: [
    {
      title: '1. 从提示词或图片开始',
      body: '生成新场景时选择文字生视频，让静态图片动起来时选择图片生视频，需要保持视觉方向时选择参考生视频。',
    },
    {
      title: '2. 按你的想法描述运动',
      body: '用自然语言描述动作，例如缓慢推进镜头、风吹动外套，或人物转身走出画面。生成前可以调整镜头运动、主体动作、节奏和输出设置。',
    },
    {
      title: '3. 生成、预览并下载',
      body: '任务开始前，按钮会显示准确的积分消耗。生成后先预览视频，再调整提示词或设置，最后下载满意的版本。',
    },
  ],
  imageEditorBefore: '你也可以先在',
  imageEditorLabel: 'AI 图片编辑器',
  imageEditorAfter:
    '中制作首帧。两个工具使用同一账户和积分系统，可以不切换工作流地把静态图片变成动态视频。',
  promptsTitle: '让其他生成器拒绝的提示词也能保持原意',
  promptsIntro:
    '许多视频工具会在提示词送达模型前重写或拦截内容。本工作区会按原意传递动作方向，但你仍需遵守适用法律，并确认拥有输入素材的使用权：',
  prompts: [
    '面向成年人的成人、性感和成熟主题，不会被模糊地当成普通错误',
    '以虚构方式描述的黑暗、恐怖和暴力场景',
    '常被过滤工具误判的真实姿势、灯光和镜头语言',
    '已经在图片编辑器中确认的画面，可以直接用于生成动作',
  ],
  ageNotice: '生成成人内容必须年满 18 岁；你需要对上传内容和发布渠道负责。',
  controlsTitle: '动作与镜头控制',
  controls: [
    { label: '镜头运动', body: '推进、拉远、平移、环绕和手持镜头' },
    { label: '主体动作', body: '画面中的头发、衣物、水、毛发等运动' },
    { label: '节奏', body: '慢速电影感，或快速利落的节奏' },
    {
      label: '画幅比例',
      body: '9:16 适合 Reels、Shorts 和 TikTok；1:1 适合信息流；16:9 适合 YouTube',
    },
    {
      label: '视频时长与分辨率',
      body: 'Seedance 2.5 支持 4–30 秒和 480p、720p、1080p；MiniMax H3 Max 支持 5–15 秒和 480p、768p。',
    },
    { label: '重新生成', body: '保留图片，只改变动作，并排比较不同版本' },
  ],
  comparisonTitle: '无过滤 AI 视频生成器与传统过滤工具的区别',
  comparisonLeft: 'Uncensored AI',
  comparisonRight: '常见的过滤型视频生成器',
  comparisonRows: [
    ['动作提示词', '按原意传递', '重写、弱化或拒绝'],
    ['成人与成熟主题', '仅限 18 岁以上用户', '拦截或静默降级'],
    ['起始方式', '提示词、图片或视觉参考均可', '通常只支持文字'],
    ['一致性', '可以用输入图片控制脸部和构图', '不同次生成的构图可能漂移'],
    [
      '价格透明度',
      '每次任务提交前显示整条视频积分',
      '订阅层级可能隐藏单条成本',
    ],
    [
      '输出政策',
      '当前流程不会额外添加产品水印；服务商和套餐条款可能适用',
      '水印规则取决于服务商和套餐',
    ],
  ],
  comparisonClosing:
    '核心区别是控制权：你可以带入自己的视觉方向，在提交前看到费用，并决定如何继续调整结果。',
  pricingTitle: '积分、价格、水印与商用说明',
  pricingBeforeLink:
    '当前视频生成需要登录，并且账户需要先有付费积分。Seedance 2.5 支持 4–30 秒和 480p、720p、1080p；MiniMax H3 Max 支持 5–15 秒和 480p、768p。用户价格按 EvoLink 官方费率的 7 倍计算，并向上取整为整数积分，提交前会显示准确消耗。生成任务是异步的，完成时间取决于服务商队列。当前流程不会额外添加产品水印，但服务商输出规则和套餐条款可能适用。商用前请确认你拥有上传素材的合法权利，并查看最新的',
  pricingLinkLabel: '价格页面',
  pricingAfterLink: '和服务条款。',
};

export function AiVideoGeneratorSeoContent() {
  const copy = getLocale() === 'zh' ? chineseCopy : englishCopy;

  return (
    <article className="mt-16 border-t border-[#e5ebeb] pt-14 sm:mt-24 sm:pt-20">
      <section className="space-y-7">
        <h2 className={sectionHeadingClass}>{copy.stepsTitle}</h2>
        {copy.steps.map((step) => (
          <div key={step.title} className="space-y-3">
            <h3 className={subheadingClass}>{step.title}</h3>
            <p className={paragraphClass}>{step.body}</p>
          </div>
        ))}
        <p className={paragraphClass}>
          {copy.imageEditorBefore}{' '}
          <Link
            href="/text-to-image"
            className="font-medium text-[#0aa8a7] underline underline-offset-4"
          >
            {copy.imageEditorLabel}
          </Link>
          {copy.imageEditorAfter}
        </p>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>{copy.promptsTitle}</h2>
        <p className={paragraphClass}>{copy.promptsIntro}</p>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-[#718083] sm:text-base">
          {copy.prompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
        <p className={paragraphClass}>{copy.ageNotice}</p>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>{copy.controlsTitle}</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-[#718083] sm:text-base">
          {copy.controls.map((control) => (
            <li key={control.label}>
              <strong>{control.label}</strong> — {control.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>{copy.comparisonTitle}</h2>
        <div className="overflow-x-auto rounded-2xl border border-[#e5ebeb] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm text-[#718083]">
            <thead className="bg-[#f4f4f5] text-[#354144]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold" />
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.comparisonLeft}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.comparisonRight}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ebeb]">
              {copy.comparisonRows.map(([label, left, right]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-[#354144]">
                    {label}
                  </td>
                  <td className="px-4 py-3">{left}</td>
                  <td className="px-4 py-3">{right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={paragraphClass}>{copy.comparisonClosing}</p>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>{copy.pricingTitle}</h2>
        <p className={paragraphClass}>
          {copy.pricingBeforeLink}{' '}
          <Link
            href="/pricing"
            className="font-medium text-[#0aa8a7] underline underline-offset-4"
          >
            {copy.pricingLinkLabel}
          </Link>{' '}
          {copy.pricingAfterLink}
        </p>
      </section>

      <AiVideoGeneratorFaq />
    </article>
  );
}
