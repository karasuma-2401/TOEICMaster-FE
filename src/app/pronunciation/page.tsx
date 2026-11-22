import type { Metadata } from "next";
import { PronunciationHeader } from "@/features/pronunciation/components/pronunciation-header";
import { PronunciationWorkspace } from "@/features/pronunciation/components/pronunciation-workspace";
import { isIpaGroup } from "@/features/pronunciation/ipa-sounds";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { wideContainer } from "@/shared/components/practice/styles";

export const metadata: Metadata = {
  title: "Luyện phát âm IPA | TOEICMaster",
  description:
    "Bảng phiên âm quốc tế IPA đủ 44 âm: nghe mẫu, xem cách phát âm và ghi âm để được chấm điểm.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Same frame as the shared exam library (Listening & Reading, Writing):
// white page, `sp-theme` tokens, wide container.
export default async function PronunciationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sound = first(params.sound) ?? null;
  const group = first(params.group);

  return (
    <div className="sp-theme min-h-dvh bg-white">
      <PronunciationHeader />
      <main
        className={`${wideContainer} pb-12 pt-6`}
        id="main-content"
        tabIndex={-1}
      >
        <Breadcrumbs
          items={[{ label: "Trang chủ", href: "/" }, { label: "Phát âm" }]}
        />
        <PronunciationWorkspace
          initialGroup={isIpaGroup(group) ? group : null}
          initialSlug={sound}
        />
      </main>
    </div>
  );
}
