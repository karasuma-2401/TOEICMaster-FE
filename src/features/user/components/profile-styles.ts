// Class tokens of the profile page cards.

export const profileCard =
  "rounded-[20px] border border-[#ece9e5] bg-white p-6 sm:p-7";

export const profileLabel = "block text-sm font-semibold text-[#3d3935]";

export const profileInput =
  "mt-2 h-12 w-full rounded-xl border border-[#d8d2cc] bg-white px-3.5 text-[15px] text-[#3d3935] outline-none transition placeholder:text-[#b4ada7] focus:border-2 focus:border-[#df5a28] aria-[invalid=true]:border-red-500";

const buttonBase =
  "inline-flex h-12 cursor-pointer items-center justify-center rounded-xl px-6 text-[15px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df5a28] disabled:cursor-not-allowed disabled:opacity-50";

export const profilePrimaryButton = `${buttonBase} bg-gradient-to-r from-[#cc2f20] to-[#e36a22] text-white hover:brightness-105`;

export const profileOutlineButton = `${buttonBase} border border-[#d8d2cc] bg-white text-[#3d3935] hover:bg-[#fdf3ea]`;
