import type { DescribePictureContent } from "@/features/speaking/types";
import { Chip } from "../ui/primitives";

export function DescribePicturePrompt({
  content,
}: {
  content: DescribePictureContent;
}) {
  return (
    <figure>
      <Chip tone="orange">MIÊU TẢ BỨC TRANH</Chip>
      {content.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- content media is served by the application.
        <img
          alt={content.imageAlt}
          className="mx-auto mt-4 aspect-[4/3] w-full max-w-[680px] rounded-2xl object-cover"
          src={content.imageUrl}
        />
      ) : (
        <div className="mx-auto mt-4 grid aspect-[4/3] w-full max-w-[680px] place-items-center rounded-2xl bg-(--sp-subtle) p-8 text-center text-sm text-(--sp-ink-2)">
          {content.imageAlt}
        </div>
      )}
      <figcaption className="mt-4 text-center text-sm text-(--sp-ink-2)">
        Miêu tả bức tranh trên. Hãy nói rõ chủ đề, các đối tượng chính và chi
        tiết nổi bật.
      </figcaption>
    </figure>
  );
}
