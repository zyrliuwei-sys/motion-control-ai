import { Link } from '@/core/i18n/navigation';
import { AiVideoGeneratorFaq } from '@/components/ai-video-generator-faq';

const sectionHeadingClass =
  'text-2xl font-semibold tracking-[-0.04em] text-[#354144] sm:text-3xl';
const subheadingClass = 'text-lg font-semibold text-[#354144]';
const paragraphClass = 'text-sm leading-7 text-[#718083] sm:text-base';

export function AiVideoGeneratorSeoContent() {
  return (
    <article className="mt-16 border-t border-[#e5ebeb] pt-14 sm:mt-24 sm:pt-20">
      <section className="space-y-7">
        <div>
          <h2 className={sectionHeadingClass}>
            How to Generate a Video With No Filter in 3 Steps
          </h2>
        </div>

        <div className="space-y-3">
          <h3 className={subheadingClass}>
            1. Start from a prompt or an image
          </h3>
          <p className={paragraphClass}>
            Type what you want to see, or upload a photo you already made in the{' '}
            <Link
              href="/text-to-image"
              className="font-medium text-[#0aa8a7] underline underline-offset-4"
            >
              AI image editor
            </Link>
            . Both routes land in the same generation panel — the difference is
            only whether the model starts from text or from a frame you already
            approved.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className={subheadingClass}>
            2. Write the motion the way you want it
          </h3>
          <p className={paragraphClass}>
            Describe movement in plain language: “slow camera push-in, coat
            moving in the wind”, “the figure turns and walks out of frame”.
            Nothing is filtered on the way in, and you can pick a preset if you
            would rather not write anything — camera moves, subject motion and
            pace are all adjustable before you generate.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className={subheadingClass}>3. Generate, preview, download</h3>
          <p className={paragraphClass}>
            The credit cost appears on the button before the task starts, so
            there is no surprise on your balance. Preview the clip, change the
            prompt or the motion strength and regenerate, then download the take
            you want to keep.
          </p>
        </div>
      </section>

      <section className="mt-14 space-y-7 sm:mt-20">
        <h2 className={sectionHeadingClass}>
          Two Modes, One Studio: Text to Video and Image to Video
        </h2>

        <div className="space-y-3">
          <h3 className={subheadingClass}>Text to video</h3>
          <p className={paragraphClass}>
            Start with a sentence. Useful when you have an idea but no visual
            yet — describe the scene, the subject and the movement, and the
            model builds the frame and the motion together.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className={subheadingClass}>Image to video</h3>
          <p className={paragraphClass}>
            Start with an image you already like. Because the composition and
            the face come from your own upload, the result stays consistent with
            the still — this is the mode that gets used most here, and it pairs
            directly with the image studio, so you can make a frame and animate
            it without switching tools.
          </p>
        </div>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>
          Prompts That Other Generators Refuse
        </h2>
        <p className={paragraphClass}>
          Most video tools decide in advance what a prompt is allowed to say.
          Some block adult themes outright; others silently rewrite your wording
          until the clip no longer matches what you asked for. This studio does
          not do that:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-[#718083] sm:text-base">
          <li>
            adult, sensual and mature themes, handled as adults rather than as
            errors
          </li>
          <li>dark, horror and violent scenes described in fictional terms</li>
          <li>
            real-world posing, lighting and camera language that filtered tools
            often flag
          </li>
          <li>
            anything you already approved in the image editor — the tool
            animates your frame, it does not judge it
          </li>
        </ul>
        <p className={paragraphClass}>
          You must be 18 or older to generate adult content, and you are
          responsible for what you upload and where you publish it.
        </p>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>Motion and Camera Controls</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-[#718083] sm:text-base">
          <li>
            <strong>Camera moves</strong> — push-in, pull-out, pan, orbit,
            handheld
          </li>
          <li>
            <strong>Subject motion</strong> — what moves inside the frame: hair,
            fabric, water, fur
          </li>
          <li>
            <strong>Pace</strong> — slow and cinematic, or quick and snappy
          </li>
          <li>
            <strong>Aspect ratio</strong> — 9:16 for Reels, Shorts and TikTok,
            1:1 for feeds, 16:9 for YouTube. Pick it before generating instead
            of cropping afterwards
          </li>
          <li>
            <strong>Clip length and resolution</strong> —{' '}
            {
              '{{时长与分辨率选项，如 clip length options and 720p / 1080p output}}'
            }
          </li>
          <li>
            <strong>Regenerate</strong> — keep the image, change only the
            motion, compare takes side by side
          </li>
        </ul>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>
          AI Video Generator With No Filter vs. Filtered Generators
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#e5ebeb] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm text-[#718083]">
            <thead className="bg-[#f4f4f5] text-[#354144]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold" />
                <th scope="col" className="px-4 py-3 font-semibold">
                  Uncensored AI
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Typical filtered video generator
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ebeb]">
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">
                  Motion prompt
                </td>
                <td className="px-4 py-3">Used as written</td>
                <td className="px-4 py-3">Rewritten, softened or refused</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">
                  Adult and mature themes
                </td>
                <td className="px-4 py-3">Allowed, 18+ only</td>
                <td className="px-4 py-3">Blocked or silently downgraded</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">
                  Starting point
                </td>
                <td className="px-4 py-3">A prompt, or a frame you approved</td>
                <td className="px-4 py-3">
                  Text only, new composition every run
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">
                  Face and composition consistency
                </td>
                <td className="px-4 py-3">Kept from your input image</td>
                <td className="px-4 py-3">Drifts between generations</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">
                  Cost transparency
                </td>
                <td className="px-4 py-3">
                  Credit cost shown before every task
                </td>
                <td className="px-4 py-3">Vague subscription tiers</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#354144]">Output</td>
                <td className="px-4 py-3">
                  {'{{水印与商用政策，如 no watermark on paid plans}}'}
                </td>
                <td className="px-4 py-3">Watermark outside the top plan</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={paragraphClass}>
          If a generator blocks the words “uncensored”, “sensual” or anything it
          considers adult, it cannot animate the images people actually bring to
          a studio like this. That is the whole difference.
        </p>
      </section>

      <section className="mt-14 space-y-5 sm:mt-20">
        <h2 className={sectionHeadingClass}>
          Free Credits, Pricing and Watermarks
        </h2>
        <p className={paragraphClass}>
          You can test generation without paying:{' '}
          {
            '{{免费额度，如 every new account starts with N free credits, and one short clip costs M credits at 1K / K credits at 2K}}'
          }
          . Paid plans unlock longer clips, higher resolution, priority
          generation and no queue.{' '}
          {
            '{{水印政策：如 paid-plan downloads carry no watermark; free-tier output may carry a small mark.}}'
          }{' '}
          This is a no-filter AI video generator, and the credit cost per task
          is shown on screen before you press generate — not buried in a
          checkout page. See{' '}
          <Link
            href="/pricing"
            className="font-medium text-[#0aa8a7] underline underline-offset-4"
          >
            pricing
          </Link>{' '}
          for the exact numbers.
        </p>
      </section>

      <AiVideoGeneratorFaq />
    </article>
  );
}
