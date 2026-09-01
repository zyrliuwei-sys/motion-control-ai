import { Card, CardContent } from '@/components/ui/card';

export type FeatureItem = {
  description: string;
  title: string;
};

export function Features({
  items,
  title,
}: {
  items: readonly FeatureItem[];
  title: string;
}) {
  return (
    <section className="mt-14" aria-label={title}>
      <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.title}
            className="min-h-40 gap-0 rounded-[22px] border-zinc-200 bg-white py-0 shadow-none transition-colors duration-200 hover:border-zinc-300"
          >
            <CardContent className="flex h-full flex-col justify-start px-6 py-6 sm:px-7 sm:py-7">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#18181b]">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#52525b]">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
