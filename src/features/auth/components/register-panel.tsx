"use client";

import { useState } from "react";
import { AuthTabs } from "./auth-layout";
import { RegisterForm } from "./register-form";
import { VerificationPanel } from "./verification-panel";

export function RegisterPanel({
  googleClientId,
  returnTo = "/",
}: {
  googleClientId?: string;
  returnTo?: string;
}) {
  const [verificationEmail, setVerificationEmail] = useState<string>();

  if (verificationEmail) {
    return (
      <VerificationPanel
        email={verificationEmail}
        onChangeEmail={() => setVerificationEmail(undefined)}
        purpose="registration"
        returnTo={returnTo}
      />
    );
  }

  return (
    <>
      <p className="flex items-center justify-center gap-3 text-center text-[10px] font-bold tracking-[0.18em] text-[#ed361c] before:h-px before:w-6 before:bg-[#ed361c]">
        WELCOME TO TOEICMASTER
      </p>
      <h1 className="mt-5 text-center text-[2.2rem] font-medium leading-tight tracking-[-0.055em] text-[#342d2a]">
        Start a new journey
      </h1>
      <p className="mt-3 text-center text-[13px] text-[#a89f9b]">
        Create a free account and start mastering TOEIC today.
      </p>
      <AuthTabs current="register" returnTo={returnTo} />
      <div className="mt-6">
        <RegisterForm
          googleClientId={googleClientId}
          onRegistrationAccepted={setVerificationEmail}
          returnTo={returnTo}
        />
      </div>
    </>
  );
}
