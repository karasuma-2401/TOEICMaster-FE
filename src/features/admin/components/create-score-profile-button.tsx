"use client";

import { useState, type FormEvent } from "react";
import { createScoreProfile, type CreateScoreProfileInput } from "../exam-api";
import type { ScoreProfile } from "../exam-management";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

export function CreateScoreProfileButton({
  onCreated,
}: {
  onCreated: (profile: ScoreProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const conversions: CreateScoreProfileInput["conversions"] = [];
    for (const skill of ["Listening", "Reading"] as const) {
      for (let rawCorrectCount = 0; rawCorrectCount <= 100; rawCorrectCount++) {
        const value = String(
          data.get(`${skill}:${rawCorrectCount}`) ?? "",
        ).trim();
        if (value)
          conversions.push({
            skill,
            rawCorrectCount,
            scaledScore: Number(value),
          });
      }
    }
    setBusy(true);
    setError("");
    try {
      onCreated(
        await createScoreProfile({
          name: String(data.get("name") ?? "").trim(),
          conversions,
        }),
      );
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create score profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setOpen(value);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-10 rounded-lg border border-(--admin-border) bg-white px-4 text-sm font-semibold"
        >
          Create score profile
        </button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogTitle>Create score profile</DialogTitle>
        <DialogDescription>
          Enter scores from 5 to 495 in steps of 5. A complete profile needs all
          101 mappings for each skill. Blank values keep the profile incomplete.
        </DialogDescription>
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="mt-4 space-y-4">
            <label className="block font-semibold">
              Profile name
              <input
                name="name"
                required
                maxLength={150}
                className="mt-2 block w-full rounded-lg border p-2"
              />
            </label>
            <div className="max-h-80 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th scope="col">Correct answers</th>
                    <th scope="col">Listening</th>
                    <th scope="col">Reading</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 101 }, (_, raw) => (
                    <tr key={raw}>
                      <th scope="row">{raw}</th>
                      {(["Listening", "Reading"] as const).map((skill) => (
                        <td className="p-1" key={skill}>
                          <input
                            aria-label={`${skill} ${raw} correct`}
                            name={`${skill}:${raw}`}
                            type="number"
                            min={5}
                            max={495}
                            step={5}
                            className="w-full rounded border p-2"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && (
              <p role="alert" className="text-(--admin-danger)">
                {error}
              </p>
            )}
            <button
              className="admin-primary-action rounded-lg px-4 py-2 font-bold"
              type="submit"
            >
              {busy ? "Saving..." : "Save profile"}
            </button>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
