import type { DescribePictureContent } from "@/features/speaking/types";

export function DescribePicturePrompt({
  content,
}: {
  content: DescribePictureContent;
}) {
  return (
    <figure>
      {content.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- content media is served by the application.
        <img
          alt={content.imageAlt}
          className="h-72 w-full rounded-2xl object-cover ring-1 ring-slate-200"
          src={content.imageUrl}
        />
      ) : (
        <div
          aria-label={content.imageAlt}
          className="grid h-72 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-sky-100 p-8 text-center ring-1 ring-orange-100"
        >
          <div className="max-w-md">
            <span className="block text-xs font-bold tracking-[0.12em] text-orange-600">
              HÌNH ẢNH ĐỀ BÀI
            </span>
            <span className="mt-3 block text-sm font-semibold leading-6 text-orange-950">
              {content.imageAlt}
            </span>
          </div>
        </div>
      )}
      <figcaption className="mt-4 text-sm text-slate-600">
        Mô tả bối cảnh, con người, hành động và các chi tiết nổi bật trong ảnh.
      </figcaption>
    </figure>
  );
}
