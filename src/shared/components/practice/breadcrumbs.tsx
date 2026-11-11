import Link from "next/link";
import { Fragment } from "react";
import { focusRing } from "./styles";

/** Path of the current page; the last item carries no link. */
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Đường dẫn" className="text-[13px] text-[#6b655f]">
      <ol className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <li aria-hidden="true">/</li>}
            <li aria-current={item.href ? undefined : "page"}>
              {item.href ? (
                <Link
                  className={`hover:underline ${focusRing}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
