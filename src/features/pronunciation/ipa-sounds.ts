// The 44 sounds of the British (RP) IPA chart taught in TOEIC courses.
// Static data: the chart never changes and learners have no admin page for it.

export type IpaGroup = "monophthong" | "diphthong" | "consonant";

export type IpaSubgroup =
  "short" | "long" | "centring" | "closing" | "voiceless" | "voiced";

export interface IpaExample {
  word: string;
  ipa: string;
  /** Start and end (exclusive) of the target sound inside `ipa`. */
  highlight: readonly [start: number, end: number];
}

export interface IpaSound {
  slug: string;
  symbol: string;
  group: IpaGroup;
  subgroup: IpaSubgroup;
  /** Voiceless/voiced partner, e.g. "th-voiceless" ↔ "th-voiced". */
  pairSlug?: string;
  audioSrc: string;
  articulation: readonly string[];
  commonMistake: string;
  examples: readonly [IpaExample, IpaExample, IpaExample];
  /**
   * Ways the assessor may write this sound (en-US IPA phoneme set). Each entry
   * is one alternative; an entry with several symbols is a sequence, e.g. /ɪə/
   * scored as "ɪ ɹ".
   */
  azurePhonemes: readonly (readonly string[])[];
  /** Assessor phoneme the learner often says instead → how to fix it. */
  confusions?: Readonly<Record<string, string>>;
  /** Shown when the en-US assessor cannot score the British sound exactly. */
  scoringNote?: string;
}

export const groupLabels: Record<IpaGroup, string> = {
  monophthong: "Monophthongs",
  diphthong: "Diphthongs",
  consonant: "Consonants",
};

export const subgroupLabels: Record<IpaSubgroup, string> = {
  short: "short",
  long: "long",
  centring: "ending in /ə/",
  closing: "ending in /ɪ/ or /ʊ/",
  voiceless: "voiceless",
  voiced: "voiced",
};

export const groupOrder: readonly IpaGroup[] = [
  "monophthong",
  "diphthong",
  "consonant",
];

/** Builds an example from a transcription that marks the target as `[…]`. */
function ex(word: string, marked: string): IpaExample {
  const start = marked.indexOf("[");
  const end = marked.indexOf("]");
  if (start < 0 || end < start)
    throw new Error(`Missing [target] in "${marked}"`);
  return {
    word,
    ipa: marked.replace("[", "").replace("]", ""),
    highlight: [start, end - 1],
  };
}

type SoundInput = Omit<IpaSound, "audioSrc">;

function sound(input: SoundInput): IpaSound {
  return { ...input, audioSrc: `/audio/ipa/${input.slug}.mp3` };
}

const americanNote =
  "The scoring engine uses American English, so this sound is compared against the closest American pronunciation.";

export const ipaSounds: readonly IpaSound[] = [
  // Monophthongs
  sound({
    slug: "i-long",
    symbol: "iː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Stretch the corners of your mouth sideways as if smiling.",
      "Raise the front of your tongue high, with the tip lightly touching behind the lower front teeth.",
      "Hold the sound longer than /ɪ/.",
    ],
    commonMistake:
      "Pronouncing it short like /ɪ/, making “sheep” sound like “ship”.",
    examples: [
      ex("sheep", "ʃ[iː]p"),
      ex("see", "s[iː]"),
      ex("teacher", "t[iː]tʃə"),
    ],
    azurePhonemes: [["i"]],
    confusions: { ɪ: "Pull your lips wider and hold the vowel longer." },
  }),
  sound({
    slug: "i-short",
    symbol: "ɪ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Keep your lips slightly open and relaxed, without stretching them sideways.",
      "Raise your tongue high, but slightly lower and further back than for /iː/.",
      "Keep the sound short and crisp.",
    ],
    commonMistake: "Stretching it out into a long /iː/ sound.",
    examples: [
      ex("ship", "ʃ[ɪ]p"),
      ex("sit", "s[ɪ]t"),
      ex("business", "b[ɪ]znəs"),
    ],
    azurePhonemes: [["ɪ"]],
    confusions: {
      i: "Relax your lips and make the sound shorter; do not draw it out.",
    },
  }),
  sound({
    slug: "u-short",
    symbol: "ʊ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Round your lips slightly and push them forward gently, without pouting strongly.",
      "Raise the back of your tongue.",
      "Keep the sound short.",
    ],
    commonMistake:
      "Rounding your lips too tightly and drawing it out into /uː/.",
    examples: [ex("good", "g[ʊ]d"), ex("book", "b[ʊ]k"), ex("put", "p[ʊ]t")],
    azurePhonemes: [["ʊ"]],
    confusions: { u: "Relax your lips more and keep the sound short." },
  }),
  sound({
    slug: "u-long",
    symbol: "uː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Round your lips into a tight circle and push them forward.",
      "Raise the back of your tongue high.",
      "Hold the sound long.",
    ],
    commonMistake: "Saying it too short, making “food” sound close to “foot”.",
    examples: [
      ex("shoot", "ʃ[uː]t"),
      ex("food", "f[uː]d"),
      ex("blue", "bl[uː]"),
    ],
    azurePhonemes: [["u"]],
    confusions: {
      ʊ: "Round your lips more tightly and hold the sound longer.",
    },
  }),
  sound({
    slug: "e",
    symbol: "e",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Open your mouth moderately, with your lips slightly stretched sideways.",
      "Keep your tongue at mid-height toward the front.",
    ],
    commonMistake: "Opening your mouth too wide so it sounds like /æ/.",
    examples: [ex("bed", "b[e]d"), ex("many", "m[e]ni"), ex("said", "s[e]d")],
    azurePhonemes: [["ɛ"]],
    confusions: {
      æ: "Close your mouth a bit more and do not drop your lower jaw as low as for /æ/.",
    },
  }),
  sound({
    slug: "schwa",
    symbol: "ə",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Completely relax your lips, tongue, and jaw.",
      "Part your lips slightly and produce a very short, weak “uh” sound.",
      "Only appears in unstressed syllables.",
    ],
    commonMistake:
      "Pronouncing the full vowel based on spelling (a, o, e) instead of a quick, unstressed “uh”.",
    examples: [
      ex("teacher", "tiːtʃ[ə]"),
      ex("about", "[ə]baʊt"),
      ex("banana", "b[ə]nɑːnə"),
    ],
    azurePhonemes: [["ə"], ["ɚ"]],
  }),
  sound({
    slug: "er-long",
    symbol: "ɜː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Keep your lips relaxed and slightly open, not rounded.",
      "Hold your tongue steady in the middle of your mouth.",
      "Draw out the sound like a long “er”.",
    ],
    commonMistake:
      "Saying it too short or rounding your lips into an “oh” sound.",
    examples: [
      ex("bird", "b[ɜː]d"),
      ex("work", "w[ɜː]k"),
      ex("learn", "l[ɜː]n"),
    ],
    azurePhonemes: [["ɝ"], ["ɚ"]],
    scoringNote: americanNote,
  }),
  sound({
    slug: "o-long",
    symbol: "ɔː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Round your lips and push them forward.",
      "Raise the back of your tongue moderately.",
      "Hold the sound long like an extended “aw”.",
    ],
    commonMistake:
      "Saying it too short like /ɒ/ or closing your lips into an “oh” sound.",
    examples: [ex("door", "d[ɔː]"), ex("law", "l[ɔː]"), ex("walk", "w[ɔː]k")],
    azurePhonemes: [["ɔ"]],
  }),
  sound({
    slug: "ae",
    symbol: "æ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Drop your lower jaw and open your mouth wide.",
      "Pull your lips sideways, keeping your tongue low and forward.",
      "The sound sits between “a” and “e”.",
    ],
    commonMistake: "Pronouncing it like /e/, making “bad” sound like “bed”.",
    examples: [
      ex("cat", "k[æ]t"),
      ex("bank", "b[æ]ŋk"),
      ex("manager", "m[æ]nɪdʒə"),
    ],
    azurePhonemes: [["æ"]],
    confusions: {
      ɛ: "Drop your lower jaw more and open your mouth wide as if about to say “ah”.",
    },
  }),
  sound({
    slug: "uh",
    symbol: "ʌ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Open your mouth moderately with relaxed lips.",
      "Pull your tongue slightly back at mid-height.",
      "Keep the sound short like a quick “uh”.",
    ],
    commonMistake: "Drawing it out into a long “ah” /ɑː/.",
    examples: [ex("up", "[ʌ]p"), ex("cup", "k[ʌ]p"), ex("money", "m[ʌ]ni")],
    azurePhonemes: [["ʌ"]],
    confusions: { ɑ: "Keep it shorter and close your mouth slightly more." },
  }),
  sound({
    slug: "a-long",
    symbol: "ɑː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Open your mouth wide and drop your lower jaw.",
      "Keep your tongue low and pulled back.",
      "Hold the sound long like an extended “ah”.",
    ],
    commonMistake: "Saying it too short like /ʌ/.",
    examples: [ex("far", "f[ɑː]"), ex("car", "k[ɑː]"), ex("start", "st[ɑː]t")],
    azurePhonemes: [["ɑ"]],
    confusions: { ʌ: "Open your mouth wider and hold the sound longer." },
  }),
  sound({
    slug: "o-short",
    symbol: "ɒ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Open your mouth wide with slightly rounded lips.",
      "Keep your tongue low and pulled back.",
      "Keep the sound short like a crisp “o”.",
    ],
    commonMistake: "Rounding and closing your lips into an “oh” sound.",
    examples: [ex("on", "[ɒ]n"), ex("hot", "h[ɒ]t"), ex("job", "dʒ[ɒ]b")],
    azurePhonemes: [["ɑ"], ["ɔ"]],
    scoringNote:
      "American English does not have /ɒ/; the engine scores it against American /ɑ/.",
  }),

  // Diphthongs
  sound({
    slug: "ie",
    symbol: "ɪə",
    group: "diphthong",
    subgroup: "centring",
    articulation: [
      "Start on /ɪ/ with relaxed lips.",
      "Glide gently into /ə/ as your mouth opens slightly.",
    ],
    commonMistake: "Saying only /ɪ/ without gliding into /ə/.",
    examples: [ex("here", "h[ɪə]"), ex("near", "n[ɪə]"), ex("idea", "aɪd[ɪə]")],
    azurePhonemes: [
      ["ɪ", "ɹ"],
      ["ɪ", "ə"],
      ["i", "ə"],
    ],
    scoringNote: americanNote,
  }),
  sound({
    slug: "ei",
    symbol: "eɪ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Start on /e/ with your mouth moderately open.",
      "Glide up into /ɪ/ as your jaw gradually closes.",
    ],
    commonMistake: "Pronouncing a flat single vowel without gliding up to /ɪ/.",
    examples: [
      ex("wait", "w[eɪ]t"),
      ex("day", "d[eɪ]"),
      ex("table", "t[eɪ]bl"),
    ],
    azurePhonemes: [["eɪ"]],
  }),
  sound({
    slug: "ue",
    symbol: "ʊə",
    group: "diphthong",
    subgroup: "centring",
    articulation: [
      "Start on /ʊ/ with slightly rounded lips.",
      "Glide into /ə/ as your lips relax.",
    ],
    commonMistake: "Over-pronouncing the ending as a strong “ah”.",
    examples: [
      ex("tourist", "t[ʊə]rɪst"),
      ex("pure", "pj[ʊə]"),
      ex("sure", "ʃ[ʊə]"),
    ],
    azurePhonemes: [
      ["ʊ", "ɹ"],
      ["ʊ", "ə"],
      ["ɔ", "ɹ"],
    ],
    scoringNote: americanNote,
  }),
  sound({
    slug: "oi",
    symbol: "ɔɪ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Start on /ɔː/ with rounded lips.",
      "Glide up to /ɪ/ while pulling your lips sideways.",
    ],
    commonMistake: "Saying it too abruptly without a smooth glide.",
    examples: [
      ex("boy", "b[ɔɪ]"),
      ex("join", "dʒ[ɔɪ]n"),
      ex("employ", "ɪmpl[ɔɪ]"),
    ],
    azurePhonemes: [["ɔɪ"]],
  }),
  sound({
    slug: "ou",
    symbol: "əʊ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Start on /ə/ with relaxed lips.",
      "Glide into /ʊ/ as your lips gradually round.",
    ],
    commonMistake: "Pronouncing a single flat “oh” without lip movement.",
    examples: [ex("show", "ʃ[əʊ]"), ex("go", "g[əʊ]"), ex("phone", "f[əʊ]n")],
    azurePhonemes: [["oʊ"]],
    scoringNote: americanNote,
  }),
  sound({
    slug: "ea",
    symbol: "eə",
    group: "diphthong",
    subgroup: "centring",
    articulation: [
      "Start on /e/ with your mouth moderately open.",
      "Glide into /ə/ as your mouth relaxes.",
    ],
    commonMistake: "Pronouncing it as a flat “e” or drifting toward “ear”.",
    examples: [ex("wear", "w[eə]"), ex("hair", "h[eə]"), ex("care", "k[eə]")],
    azurePhonemes: [
      ["ɛ", "ɹ"],
      ["ɛ", "ə"],
    ],
    scoringNote: americanNote,
  }),
  sound({
    slug: "ai",
    symbol: "aɪ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Start with your mouth open wide as for “ah”.",
      "Glide up into /ɪ/ as your jaw closes.",
    ],
    commonMistake: "Saying it too short or dropping the final /ɪ/.",
    examples: [ex("my", "m[aɪ]"), ex("time", "t[aɪ]m"), ex("price", "pr[aɪ]s")],
    azurePhonemes: [["aɪ"]],
  }),
  sound({
    slug: "au",
    symbol: "aʊ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Start with your mouth open wide as for “ah”.",
      "Glide into /ʊ/ as your lips round.",
    ],
    commonMistake: "Ending on an overly open “o” instead of rounding to /ʊ/.",
    examples: [
      ex("cow", "k[aʊ]"),
      ex("now", "n[aʊ]"),
      ex("account", "ək[aʊ]nt"),
    ],
    azurePhonemes: [["aʊ"]],
  }),

  // Consonants: voiceless / voiced pairs
  sound({
    slug: "p",
    symbol: "p",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "b",
    articulation: [
      "Press both lips together and build up air behind them.",
      "Release your lips with a strong puff of air.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake:
      "Not aspirating enough so it sounds like /b/; dropping final /p/.",
    examples: [
      ex("pea", "[p]iː"),
      ex("paper", "[p]eɪpə"),
      ex("stop", "stɒ[p]"),
    ],
    azurePhonemes: [["p"]],
    confusions: {
      b: "Release a stronger puff of air; you should feel breath on your hand in front of your mouth.",
    },
  }),
  sound({
    slug: "b",
    symbol: "b",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "p",
    articulation: [
      "Press both lips together.",
      "Release your lips gently with less air than /p/.",
      "Your vocal cords vibrate.",
    ],
    commonMistake: "Dropping final /b/ in words like “job”.",
    examples: [
      ex("boat", "[b]əʊt"),
      ex("job", "dʒɒ[b]"),
      ex("about", "ə[b]aʊt"),
    ],
    azurePhonemes: [["b"]],
    confusions: {
      p: "Vibrate your vocal cords and use a gentler release of air.",
    },
  }),
  sound({
    slug: "t",
    symbol: "t",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "d",
    articulation: [
      "Place your tongue tip on the alveolar ridge right behind your upper front teeth.",
      "Snap your tongue down and push out a burst of air.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake: "Pronouncing it without aspiration, or dropping final /t/.",
    examples: [
      ex("tea", "[t]iː"),
      ex("ticket", "[t]ɪkɪt"),
      ex("meet", "miː[t]"),
    ],
    azurePhonemes: [["t"]],
    confusions: {
      d: "Release a stronger puff of air without vibrating your vocal cords.",
    },
  }),
  sound({
    slug: "d",
    symbol: "d",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "t",
    articulation: [
      "Place your tongue tip on the alveolar ridge behind your upper front teeth.",
      "Release your tongue gently downward.",
      "Your vocal cords vibrate.",
    ],
    commonMistake: "Articulating it too heavily or dropping final /d/.",
    examples: [ex("dog", "[d]ɒg"), ex("desk", "[d]esk"), ex("need", "niː[d]")],
    azurePhonemes: [["d"]],
    confusions: { t: "Vibrate your vocal cords as you release your tongue." },
  }),
  sound({
    slug: "ch",
    symbol: "tʃ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "j",
    articulation: [
      "Touch your tongue tip to the upper gum ridge while rounding and pushing your lips forward.",
      "Release the air sharply into a “ch” sound.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake: "Not rounding your lips enough when saying “ch”.",
    examples: [
      ex("cheese", "[tʃ]iːz"),
      ex("check", "[tʃ]ek"),
      ex("watch", "wɒ[tʃ]"),
    ],
    azurePhonemes: [["tʃ"]],
    confusions: {
      ʃ: "Stop the airflow with your tongue tip first before releasing it.",
    },
  }),
  sound({
    slug: "j",
    symbol: "dʒ",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "ch",
    articulation: [
      "Use the same mouth shape as /tʃ/, with lips rounded and pushed forward.",
      "Release your tongue while vibrating your vocal cords.",
    ],
    commonMistake: "Pronouncing it like /z/ or softening the initial stop.",
    examples: [
      ex("June", "[dʒ]uːn"),
      ex("job", "[dʒ]ɒb"),
      ex("manager", "mænɪ[dʒ]ə"),
    ],
    azurePhonemes: [["dʒ"]],
    confusions: {
      z: "Stop the air with your tongue tip on the gum ridge first, with rounded lips.",
      ʒ: "Stop the airflow with your tongue tip first before releasing it.",
    },
  }),
  sound({
    slug: "k",
    symbol: "k",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "g",
    articulation: [
      "Raise the back of your tongue to touch the soft palate.",
      "Drop the back of your tongue and push out a burst of air.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake: "Dropping final /k/ in words like “book”.",
    examples: [ex("car", "[k]ɑː"), ex("call", "[k]ɔːl"), ex("book", "bʊ[k]")],
    azurePhonemes: [["k"]],
    confusions: {
      ɡ: "Release a stronger puff of air without vibrating your vocal cords.",
    },
  }),
  sound({
    slug: "g",
    symbol: "g",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "k",
    articulation: [
      "Raise the back of your tongue to touch the soft palate.",
      "Release gently while vibrating your vocal cords.",
    ],
    commonMistake: "Dropping final /g/ in words like “bag”.",
    examples: [ex("go", "[g]əʊ"), ex("bag", "bæ[g]"), ex("again", "ə[g]en")],
    azurePhonemes: [["ɡ"], ["g"]],
    confusions: {
      k: "Vibrate your vocal cords and use a gentler release of air.",
    },
  }),
  sound({
    slug: "f",
    symbol: "f",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "v",
    articulation: [
      "Touch your upper front teeth lightly to your lower lip.",
      "Blow air steadily through the gap between your teeth and lip.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake: "Dropping final /f/ or closing both lips like /p/.",
    examples: [
      ex("fly", "[f]laɪ"),
      ex("office", "ɒ[f]ɪs"),
      ex("phone", "[f]əʊn"),
    ],
    azurePhonemes: [["f"]],
    confusions: {
      p: "Do not press your lips together; rest your upper teeth on your lower lip and blow air.",
    },
  }),
  sound({
    slug: "v",
    symbol: "v",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "f",
    articulation: [
      "Rest your upper front teeth lightly on your lower lip.",
      "Blow air through while vibrating your vocal cords.",
    ],
    commonMistake:
      "Pronouncing it like /b/ or /w/; dropping final /v/ in words like “have”.",
    examples: [
      ex("video", "[v]ɪdiəʊ"),
      ex("very", "[v]eri"),
      ex("have", "hæ[v]"),
    ],
    azurePhonemes: [["v"]],
    confusions: {
      b: "Do not press both lips together; touch your upper teeth to your lower lip.",
      w: "Do not round your lips; touch your upper teeth to your lower lip.",
      f: "Vibrate your vocal cords as you blow air.",
    },
  }),
  sound({
    slug: "th-voiceless",
    symbol: "θ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "th-voiced",
    articulation: [
      "Place the tip of your tongue gently between your upper and lower teeth, sticking out slightly.",
      "Blow air through the gap between your tongue and upper teeth.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake:
      "Pronouncing it like /t/ or /s/, making “think” sound like “tink” or “sink”.",
    examples: [
      ex("think", "[θ]ɪŋk"),
      ex("three", "[θ]riː"),
      ex("month", "mʌn[θ]"),
    ],
    azurePhonemes: [["θ"]],
    confusions: {
      s: "Place your tongue tip between your teeth and blow air, instead of keeping it behind your teeth.",
      t: "Do not block the air; keep your tongue between your teeth and blow steadily.",
      f: "Use your tongue instead of your lower lip to create the narrow gap.",
    },
  }),
  sound({
    slug: "th-voiced",
    symbol: "ð",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "th-voiceless",
    articulation: [
      "Place your tongue tip gently between your upper and lower teeth.",
      "Blow air while vibrating your vocal cords.",
    ],
    commonMistake:
      "Pronouncing it like /d/ or /z/, making “this” sound like “dis”.",
    examples: [
      ex("this", "[ð]ɪs"),
      ex("mother", "mʌ[ð]ə"),
      ex("with", "wɪ[ð]"),
    ],
    azurePhonemes: [["ð"]],
    confusions: {
      d: "Do not block the air; keep your tongue between your teeth and vibrate your vocal cords.",
      z: "Bring your tongue tip between your teeth instead of keeping it behind them.",
    },
  }),
  sound({
    slug: "s",
    symbol: "s",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "z",
    articulation: [
      "Bring your tongue tip close to the upper gum ridge with your teeth nearly closed.",
      "Blow air out to create a crisp hissing sound.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake:
      "Dropping final /s/ (plurals, third-person singular) or pronouncing it like /ʃ/.",
    examples: [
      ex("see", "[s]iː"),
      ex("sales", "[s]eɪlz"),
      ex("price", "praɪ[s]"),
    ],
    azurePhonemes: [["s"]],
    confusions: { ʃ: "Pull your lips sideways; do not round them." },
  }),
  sound({
    slug: "z",
    symbol: "z",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "s",
    articulation: [
      "Use the same mouth shape as /s/.",
      "Vibrate your vocal cords to make a buzzing “zzz” sound.",
    ],
    commonMistake:
      "Pronouncing it as voiceless /s/ at the end of words like “plans”.",
    examples: [
      ex("zoo", "[z]uː"),
      ex("busy", "bɪ[z]i"),
      ex("plans", "plæn[z]"),
    ],
    azurePhonemes: [["z"]],
    confusions: {
      s: "Vibrate your vocal cords; place a hand on your throat to feel the vibration.",
    },
  }),
  sound({
    slug: "sh",
    symbol: "ʃ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "zh",
    articulation: [
      "Round your lips and push them forward.",
      "Pull your tongue slightly further back than for /s/ and blow out a soft “sh” sound.",
      "Your vocal cords do not vibrate.",
    ],
    commonMistake: "Pronouncing it like /s/ by not rounding your lips.",
    examples: [
      ex("shall", "[ʃ]æl"),
      ex("shop", "[ʃ]ɒp"),
      ex("station", "steɪ[ʃ]n"),
    ],
    azurePhonemes: [["ʃ"]],
    confusions: {
      s: "Round your lips and pull your tongue slightly further back.",
    },
  }),
  sound({
    slug: "zh",
    symbol: "ʒ",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "sh",
    articulation: [
      "Use the same mouth shape as /ʃ/, with rounded lips.",
      "Vibrate your vocal cords.",
    ],
    commonMistake: "Pronouncing it like /z/ or softening it.",
    examples: [
      ex("television", "telɪvɪ[ʒ]n"),
      ex("usually", "juː[ʒ]uəli"),
      ex("measure", "me[ʒ]ə"),
    ],
    azurePhonemes: [["ʒ"]],
    confusions: {
      z: "Round your lips and pull your tongue back as for /ʃ/.",
      ʃ: "Vibrate your vocal cords.",
    },
  }),

  // Remaining consonants: nasals, lateral, approximants, /h/
  sound({
    slug: "m",
    symbol: "m",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Press both lips together.",
      "Let the air flow out through your nose while vibrating your vocal cords.",
    ],
    commonMistake: "Swallowing final /m/ in words like “team”.",
    examples: [
      ex("man", "[m]æn"),
      ex("meeting", "[m]iːtɪŋ"),
      ex("team", "tiː[m]"),
    ],
    azurePhonemes: [["m"]],
  }),
  sound({
    slug: "n",
    symbol: "n",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Touch your tongue tip to the upper gum ridge.",
      "Let the air flow out through your nose while vibrating your vocal cords.",
    ],
    commonMistake: "Confusing it with /ŋ/ at the end of words.",
    examples: [ex("now", "[n]aʊ"), ex("name", "[n]eɪm"), ex("plan", "plæ[n]")],
    azurePhonemes: [["n"]],
    confusions: {
      ŋ: "Touch your tongue tip to the upper gum ridge instead of using the back of your tongue.",
    },
  }),
  sound({
    slug: "ng",
    symbol: "ŋ",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Raise the back of your tongue to the soft palate as if saying /k/.",
      "Let the air flow out through your nose without releasing a /g/.",
    ],
    commonMistake: "Pronouncing it like /n/ or adding an extra /g/ at the end.",
    examples: [
      ex("sing", "sɪ[ŋ]"),
      ex("meeting", "miːtɪ[ŋ]"),
      ex("long", "lɒ[ŋ]"),
    ],
    azurePhonemes: [["ŋ"]],
    confusions: {
      n: "Block the air at the back with your tongue and keep your tongue tip relaxed.",
    },
  }),
  sound({
    slug: "h",
    symbol: "h",
    group: "consonant",
    subgroup: "voiceless",
    articulation: [
      "Shape your mouth for the following vowel.",
      "Breathe out a gentle puff of air from your throat.",
    ],
    commonMistake: "Dropping /h/ completely or making it too harsh and raspy.",
    examples: [
      ex("hat", "[h]æt"),
      ex("hotel", "[h]əʊtel"),
      ex("behind", "bɪ[h]aɪnd"),
    ],
    azurePhonemes: [["h"]],
  }),
  sound({
    slug: "l",
    symbol: "l",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Touch your tongue tip to the upper gum ridge.",
      "Let air flow around both sides of your tongue while vibrating your vocal cords.",
      "At the end of a word, hold your tongue tip on the gum ridge briefly.",
    ],
    commonMistake:
      "Dropping final /l/ in words like “email” or confusing it with /n/.",
    examples: [
      ex("love", "[l]ʌv"),
      ex("late", "[l]eɪt"),
      ex("email", "iːmeɪ[l]"),
    ],
    azurePhonemes: [["l"]],
    confusions: {
      n: "Let air escape along both sides of your tongue, not through your nose.",
    },
  }),
  sound({
    slug: "r",
    symbol: "r",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Curl your tongue tip slightly upward without touching the roof of your mouth.",
      "Round your lips slightly and vibrate your vocal cords.",
    ],
    commonMistake: "Trilling the tongue or substituting /l/ or /z/.",
    examples: [
      ex("red", "[r]ed"),
      ex("report", "[r]ɪpɔːt"),
      ex("sorry", "sɒ[r]i"),
    ],
    azurePhonemes: [["ɹ"], ["r"]],
    confusions: {
      l: "Do not let your tongue tip touch the gum ridge; curl it up and round your lips.",
      z: "Keep your tongue away from your teeth and curl it back.",
    },
  }),
  sound({
    slug: "w",
    symbol: "w",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Round your lips tightly as if saying /uː/.",
      "Open your lips quickly into the following vowel.",
    ],
    commonMistake: "Pronouncing it like /v/ or adding a hard /k/ sound.",
    examples: [ex("wet", "[w]et"), ex("work", "[w]ɜːk"), ex("quick", "k[w]ɪk")],
    azurePhonemes: [["w"]],
    confusions: {
      v: "Do not touch your teeth to your lip; only round your lips.",
    },
  }),
  sound({
    slug: "y",
    symbol: "j",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Raise the front of your tongue near the hard palate as for /iː/.",
      "Glide quickly into the following vowel.",
    ],
    commonMistake:
      "Turning it into a /z/ or /dʒ/ sound, or dropping /j/ so “use” sounds like “ooz”.",
    examples: [ex("yes", "[j]es"), ex("year", "[j]ɪə"), ex("use", "[j]uːz")],
    azurePhonemes: [["j"]],
  }),
];

const bySlug = new Map(ipaSounds.map((item) => [item.slug, item]));

export function findSound(slug: string | null | undefined) {
  return slug ? bySlug.get(slug) : undefined;
}

export function soundsByGroup(group: IpaGroup): readonly IpaSound[] {
  return ipaSounds.filter((item) => item.group === group);
}

export interface ConsonantRows {
  /** Voiceless sound first, then its voiced partner. */
  pairs: readonly (readonly [IpaSound, IpaSound])[];
  others: readonly IpaSound[];
}

/** Consonants laid out as voiceless/voiced pairs, then the unpaired ones. */
export function consonantRows(): ConsonantRows {
  const consonants = soundsByGroup("consonant");
  const pairs: [IpaSound, IpaSound][] = [];
  const others: IpaSound[] = [];
  for (const item of consonants) {
    if (!item.pairSlug) others.push(item);
    else if (item.subgroup === "voiceless") {
      const partner = bySlug.get(item.pairSlug);
      if (partner) pairs.push([item, partner]);
    }
  }
  return { pairs, others };
}

export function isIpaGroup(
  value: string | null | undefined,
): value is IpaGroup {
  return (
    value === "monophthong" || value === "diphthong" || value === "consonant"
  );
}
