import Link from "next/link";
import type { ReactNode } from "react";
import { authUrl } from "@/features/auth/protected-routes";

type AuthMode = "login" | "register";

function BrandMark() {
  return (
    <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 38 38">
      <path d="m3 12 27-8-6.8 28.3-8.2-13L3 12Z" fill="#ff9f25" />
      <path d="m3 12 12.2 7.3L30 4 3 12Z" fill="#ffbd44" />
      <path d="m15.2 19.3 8 12.7 3.1-13.2-11.1.5Z" fill="#b31322" />
    </svg>
  );
}

function RobotArtwork() {
  return (
    <div aria-hidden="true" className="auth-artwork">
      <div className="auth-speech auth-speech-left">
        <strong>Hello!</strong>
        <span>Xin chào</span>
      </div>
      <div className="auth-speech auth-speech-right">
        <strong>Great!</strong>
        <span>Rất tốt</span>
      </div>
      <div className="auth-robot-orbit">
        <span className="auth-orbit-dot" />
        <div className="auth-robot">
          <div className="auth-robot-head">
            <div className="auth-robot-screen">
              <span />
              <span />
            </div>
          </div>
          <div className="auth-robot-body">AI</div>
        </div>
      </div>
      <div className="auth-progress">
        <span>↗</span>
        <p>
          Tiến bộ tuần này
          <br />
          <strong>+24%</strong>
        </p>
      </div>
    </div>
  );
}

function AuthHero() {
  return (
    <section
      aria-label="Giới thiệu TOEICMaster"
      className="auth-hero relative hidden overflow-hidden text-white lg:block"
    >
      <div className="auth-hero-sun" />
      <div className="auth-hero-ring" />
      <div className="auth-hero-wave" />
      <div className="relative z-10 flex h-full flex-col px-11 py-11 lg:px-12 lg:py-12">
        <span className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.05em]">
          <BrandMark />
          TOEICMaster
        </span>
        <div className="mt-16 max-w-[26rem] lg:mt-[4.6rem]">
          <p className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-[#fff4e9] before:h-px before:w-6 before:bg-white">
            HỌC THEO MỤC TIÊU CỦA BẠN
          </p>
          <h1 className="mt-5 text-[3.1rem] font-medium leading-[1.14] tracking-[-0.055em] sm:text-[3.45rem]">
            Mỗi cuộc trò chuyện, một bước{" "}
            <em className="not-italic text-[#ffd361]">tiến bộ.</em>
          </h1>
          <p className="mt-6 max-w-[23rem] text-[15px] leading-6 text-[#fff6ef]">
            Luyện tập mỗi ngày, học cùng AI và tự tin sử dụng tiếng Anh trong
            mọi tình huống.
          </p>
        </div>
        <RobotArtwork />
        <div className="mt-auto flex items-center gap-3 pt-8 text-[10px] text-[#fff0e9]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#ffd49e] bg-[#f17939] font-bold text-white">
            MT
          </span>
          <span className="leading-5">
            <b className="block tracking-[0.18em] text-[#ffd361]">★★★★★</b>
            “Mình đã tự tin giao tiếp chỉ sau 8 tuần!”
          </span>
        </div>
      </div>
    </section>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page min-h-dvh">
      <div className="auth-card grid min-h-dvh w-full overflow-hidden bg-white lg:min-h-screen lg:grid-cols-[47.5%_52.5%]">
        <AuthHero />
        <section className="flex min-h-dvh items-center justify-center bg-[#fffdfc] px-7 py-12 sm:px-14 lg:min-h-0 lg:px-[6rem] lg:py-12">
          <div className="w-full max-w-[426px]">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function AuthTabs({
  current,
  returnTo = "/",
}: {
  current: AuthMode;
  returnTo?: string;
}) {
  return (
    <nav
      aria-label="Tài khoản"
      className="mt-7 grid grid-cols-2 rounded-xl bg-[#f5f1ef] p-1 text-sm font-bold"
    >
      <Link
        aria-current={current === "login" ? "page" : undefined}
        className={`flex h-10 cursor-pointer items-center justify-center rounded-[0.6rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c] ${
          current === "login"
            ? "bg-white text-[#ed361c] shadow-[0_3px_8px_rgba(67,47,38,0.12)]"
            : "text-[#b7aeaa] hover:text-[#736a66]"
        }`}
        href={authUrl("/login", returnTo)}
      >
        Đăng nhập
      </Link>
      <Link
        aria-current={current === "register" ? "page" : undefined}
        className={`flex h-10 cursor-pointer items-center justify-center rounded-[0.6rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed361c] ${
          current === "register"
            ? "bg-white text-[#ed361c] shadow-[0_3px_8px_rgba(67,47,38,0.12)]"
            : "text-[#b7aeaa] hover:text-[#736a66]"
        }`}
        href={authUrl("/register", returnTo)}
      >
        Đăng ký
      </Link>
    </nav>
  );
}
