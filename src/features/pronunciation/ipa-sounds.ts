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
  monophthong: "Nguyên âm đơn",
  diphthong: "Nguyên âm đôi",
  consonant: "Phụ âm",
};

export const subgroupLabels: Record<IpaSubgroup, string> = {
  short: "ngắn",
  long: "dài",
  centring: "kết thúc bằng /ə/",
  closing: "kết thúc bằng /ɪ/ hoặc /ʊ/",
  voiceless: "vô thanh",
  voiced: "hữu thanh",
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
  "Hệ thống chấm theo giọng Mỹ nên âm này được so với cách đọc Mỹ tương ứng.";

export const ipaSounds: readonly IpaSound[] = [
  // Nguyên âm đơn
  sound({
    slug: "i-long",
    symbol: "iː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Kéo hai khóe môi sang ngang như đang cười.",
      "Mặt lưỡi nâng cao, đầu lưỡi chạm nhẹ sau răng cửa dưới.",
      "Giữ âm dài hơn /ɪ/.",
    ],
    commonMistake: "Đọc ngắn như /ɪ/ nên “sheep” nghe thành “ship”.",
    examples: [
      ex("sheep", "ʃ[iː]p"),
      ex("see", "s[iː]"),
      ex("teacher", "t[iː]tʃə"),
    ],
    azurePhonemes: [["i"]],
    confusions: { ɪ: "Kéo môi sang ngang hơn và giữ âm lâu hơn." },
  }),
  sound({
    slug: "i-short",
    symbol: "ɪ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Môi hơi mở, thả lỏng, không kéo căng sang ngang.",
      "Lưỡi nâng cao nhưng thấp và lùi hơn /iː/.",
      "Đọc ngắn, dứt khoát.",
    ],
    commonMistake: "Kéo dài thành /iː/ như chữ “i” tiếng Việt.",
    examples: [
      ex("ship", "ʃ[ɪ]p"),
      ex("sit", "s[ɪ]t"),
      ex("business", "b[ɪ]znəs"),
    ],
    azurePhonemes: [["ɪ"]],
    confusions: { i: "Thả lỏng môi và đọc ngắn hơn, đừng kéo dài." },
  }),
  sound({
    slug: "u-short",
    symbol: "ʊ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Môi tròn nhẹ, hơi đưa ra trước, không chu mạnh.",
      "Cuống lưỡi nâng lên phía sau.",
      "Đọc ngắn.",
    ],
    commonMistake: "Chu môi và kéo dài thành /uː/.",
    examples: [ex("good", "g[ʊ]d"), ex("book", "b[ʊ]k"), ex("put", "p[ʊ]t")],
    azurePhonemes: [["ʊ"]],
    confusions: { u: "Thả lỏng môi hơn và đọc ngắn." },
  }),
  sound({
    slug: "u-long",
    symbol: "uː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Chu tròn môi về phía trước.",
      "Cuống lưỡi nâng cao về phía sau.",
      "Giữ âm dài.",
    ],
    commonMistake: "Đọc ngắn nên “food” nghe gần “foot”.",
    examples: [
      ex("shoot", "ʃ[uː]t"),
      ex("food", "f[uː]d"),
      ex("blue", "bl[uː]"),
    ],
    azurePhonemes: [["u"]],
    confusions: { ʊ: "Chu môi tròn hơn và giữ âm lâu hơn." },
  }),
  sound({
    slug: "e",
    symbol: "e",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Mở miệng vừa, môi hơi kéo sang ngang.",
      "Lưỡi ở độ cao trung bình, phía trước.",
    ],
    commonMistake: "Mở miệng quá rộng nên nghe thành /æ/.",
    examples: [ex("bed", "b[e]d"), ex("many", "m[e]ni"), ex("said", "s[e]d")],
    azurePhonemes: [["ɛ"]],
    confusions: { æ: "Khép miệng bớt lại, hàm dưới không hạ thấp như /æ/." },
  }),
  sound({
    slug: "schwa",
    symbol: "ə",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Thả lỏng hoàn toàn môi, lưỡi và hàm.",
      "Miệng hé nhẹ, phát ra âm “ơ” rất ngắn và nhẹ.",
      "Chỉ xuất hiện ở âm tiết không nhấn.",
    ],
    commonMistake: "Đọc rõ theo mặt chữ (a, o, e) thay vì đọc lướt “ơ”.",
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
      "Môi thả lỏng, hơi mở, không tròn.",
      "Lưỡi ở giữa miệng, giữ yên.",
      "Kéo dài như “ơ” dài.",
    ],
    commonMistake: "Đọc ngắn hoặc tròn môi thành “ô”.",
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
      "Môi tròn, đưa ra trước.",
      "Cuống lưỡi nâng lên vừa phải.",
      "Giữ âm dài như “o” kéo dài.",
    ],
    commonMistake: "Đọc ngắn thành /ɒ/ hoặc “ô” tiếng Việt.",
    examples: [ex("door", "d[ɔː]"), ex("law", "l[ɔː]"), ex("walk", "w[ɔː]k")],
    azurePhonemes: [["ɔ"]],
  }),
  sound({
    slug: "ae",
    symbol: "æ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Hạ hàm dưới, mở miệng rộng.",
      "Kéo môi sang ngang, lưỡi thấp và ở phía trước.",
      "Âm nằm giữa “a” và “e”.",
    ],
    commonMistake: "Đọc thành /e/ nên “bad” nghe như “bed”.",
    examples: [
      ex("cat", "k[æ]t"),
      ex("bank", "b[æ]ŋk"),
      ex("manager", "m[æ]nɪdʒə"),
    ],
    azurePhonemes: [["æ"]],
    confusions: {
      ɛ: "Hạ hàm dưới nhiều hơn, mở miệng rộng như sắp nói “a”.",
    },
  }),
  sound({
    slug: "uh",
    symbol: "ʌ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Mở miệng vừa, môi thả lỏng.",
      "Lưỡi hơi lùi về sau, ở độ cao trung bình.",
      "Đọc ngắn như “ă”.",
    ],
    commonMistake: "Đọc thành “a” dài /ɑː/.",
    examples: [ex("up", "[ʌ]p"), ex("cup", "k[ʌ]p"), ex("money", "m[ʌ]ni")],
    azurePhonemes: [["ʌ"]],
    confusions: { ɑ: "Đọc ngắn và khép miệng hơn, gần “ă”." },
  }),
  sound({
    slug: "a-long",
    symbol: "ɑː",
    group: "monophthong",
    subgroup: "long",
    articulation: [
      "Mở miệng rộng, hàm dưới hạ thấp.",
      "Lưỡi nằm thấp, lùi về sau.",
      "Giữ âm dài như “a” kéo dài.",
    ],
    commonMistake: "Đọc ngắn thành /ʌ/.",
    examples: [ex("far", "f[ɑː]"), ex("car", "k[ɑː]"), ex("start", "st[ɑː]t")],
    azurePhonemes: [["ɑ"]],
    confusions: { ʌ: "Mở miệng rộng hơn và giữ âm lâu hơn." },
  }),
  sound({
    slug: "o-short",
    symbol: "ɒ",
    group: "monophthong",
    subgroup: "short",
    articulation: [
      "Mở miệng rộng, môi hơi tròn.",
      "Lưỡi thấp, lùi về sau.",
      "Đọc ngắn như “o”.",
    ],
    commonMistake: "Đọc thành “ô” khép miệng.",
    examples: [ex("on", "[ɒ]n"), ex("hot", "h[ɒ]t"), ex("job", "dʒ[ɒ]b")],
    azurePhonemes: [["ɑ"], ["ɔ"]],
    scoringNote: "Giọng Mỹ không có /ɒ/; hệ thống chấm theo /ɑ/ của giọng Mỹ.",
  }),

  // Nguyên âm đôi
  sound({
    slug: "ie",
    symbol: "ɪə",
    group: "diphthong",
    subgroup: "centring",
    articulation: [
      "Bắt đầu ở /ɪ/, môi thả lỏng.",
      "Lướt nhẹ về /ə/, miệng hé ra một chút.",
    ],
    commonMistake: "Chỉ đọc /ɪ/ mà thiếu phần lướt về /ə/.",
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
      "Bắt đầu ở /e/, miệng mở vừa.",
      "Lướt lên /ɪ/, hàm khép lại dần.",
    ],
    commonMistake: "Đọc thành “ê” đơn, thiếu phần lướt lên /ɪ/.",
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
      "Bắt đầu ở /ʊ/, môi tròn nhẹ.",
      "Lướt về /ə/, môi thả lỏng.",
    ],
    commonMistake: "Đọc thành “ua” với “a” quá rõ.",
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
      "Bắt đầu ở /ɔː/, môi tròn.",
      "Lướt lên /ɪ/, môi kéo sang ngang.",
    ],
    commonMistake: "Đọc như “oi” tiếng Việt nhưng quá ngắn.",
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
      "Bắt đầu ở /ə/, môi thả lỏng.",
      "Lướt về /ʊ/, môi tròn dần.",
    ],
    commonMistake: "Đọc thành “ô” đơn, không có chuyển động môi.",
    examples: [ex("show", "ʃ[əʊ]"), ex("go", "g[əʊ]"), ex("phone", "f[əʊ]n")],
    azurePhonemes: [["oʊ"]],
    scoringNote: americanNote,
  }),
  sound({
    slug: "ea",
    symbol: "eə",
    group: "diphthong",
    subgroup: "centring",
    articulation: ["Bắt đầu ở /e/, miệng mở vừa.", "Lướt về /ə/, thả lỏng."],
    commonMistake: "Đọc thành “e” đơn hoặc “ia”.",
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
      "Bắt đầu với miệng mở rộng như “a”.",
      "Lướt lên /ɪ/, hàm khép lại.",
    ],
    commonMistake: "Đọc thành “ai” quá ngắn hoặc thiếu /ɪ/ ở cuối.",
    examples: [ex("my", "m[aɪ]"), ex("time", "t[aɪ]m"), ex("price", "pr[aɪ]s")],
    azurePhonemes: [["aɪ"]],
  }),
  sound({
    slug: "au",
    symbol: "aʊ",
    group: "diphthong",
    subgroup: "closing",
    articulation: [
      "Bắt đầu với miệng mở rộng như “a”.",
      "Lướt về /ʊ/, môi tròn lại.",
    ],
    commonMistake: "Đọc thành “ao” với “o” quá rõ.",
    examples: [
      ex("cow", "k[aʊ]"),
      ex("now", "n[aʊ]"),
      ex("account", "ək[aʊ]nt"),
    ],
    azurePhonemes: [["aʊ"]],
  }),

  // Phụ âm: cặp vô thanh / hữu thanh
  sound({
    slug: "p",
    symbol: "p",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "b",
    articulation: [
      "Mím hai môi lại, giữ hơi phía sau.",
      "Bật môi ra, đẩy luồng hơi mạnh.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Không bật hơi nên nghe giống /b/; bỏ âm /p/ ở cuối từ.",
    examples: [
      ex("pea", "[p]iː"),
      ex("paper", "[p]eɪpə"),
      ex("stop", "stɒ[p]"),
    ],
    azurePhonemes: [["p"]],
    confusions: {
      b: "Bật hơi mạnh hơn; đặt tay trước miệng phải cảm thấy hơi.",
    },
  }),
  sound({
    slug: "b",
    symbol: "b",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "p",
    articulation: [
      "Mím hai môi lại.",
      "Bật môi ra nhẹ, ít hơi hơn /p/.",
      "Dây thanh rung.",
    ],
    commonMistake: "Bỏ âm /b/ ở cuối từ như “job”.",
    examples: [
      ex("boat", "[b]əʊt"),
      ex("job", "dʒɒ[b]"),
      ex("about", "ə[b]aʊt"),
    ],
    azurePhonemes: [["b"]],
    confusions: { p: "Cho dây thanh rung và bật hơi nhẹ hơn." },
  }),
  sound({
    slug: "t",
    symbol: "t",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "d",
    articulation: [
      "Đặt đầu lưỡi lên lợi ngay sau răng cửa trên.",
      "Bật lưỡi xuống, đẩy hơi ra.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Đọc như “t” tiếng Việt, không bật hơi; bỏ /t/ cuối từ.",
    examples: [
      ex("tea", "[t]iː"),
      ex("ticket", "[t]ɪkɪt"),
      ex("meet", "miː[t]"),
    ],
    azurePhonemes: [["t"]],
    confusions: { d: "Bật hơi mạnh hơn, dây thanh không rung." },
  }),
  sound({
    slug: "d",
    symbol: "d",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "t",
    articulation: [
      "Đặt đầu lưỡi lên lợi sau răng cửa trên.",
      "Bật lưỡi xuống nhẹ.",
      "Dây thanh rung.",
    ],
    commonMistake: "Đọc như “đ” tiếng Việt hoặc bỏ /d/ cuối từ.",
    examples: [ex("dog", "[d]ɒg"), ex("desk", "[d]esk"), ex("need", "niː[d]")],
    azurePhonemes: [["d"]],
    confusions: { t: "Cho dây thanh rung khi bật lưỡi." },
  }),
  sound({
    slug: "ch",
    symbol: "tʃ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "j",
    articulation: [
      "Đầu lưỡi chạm lợi trên, môi hơi tròn và đưa ra.",
      "Bật lưỡi ra thành tiếng xì như “ch”.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Đọc thành “ch” tiếng Việt, môi không tròn.",
    examples: [
      ex("cheese", "[tʃ]iːz"),
      ex("check", "[tʃ]ek"),
      ex("watch", "wɒ[tʃ]"),
    ],
    azurePhonemes: [["tʃ"]],
    confusions: { ʃ: "Chặn hơi bằng đầu lưỡi trước rồi mới bật ra." },
  }),
  sound({
    slug: "j",
    symbol: "dʒ",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "ch",
    articulation: [
      "Khẩu hình giống /tʃ/, môi tròn và đưa ra.",
      "Bật lưỡi ra, dây thanh rung.",
    ],
    commonMistake: "Đọc thành /z/ hoặc “gi” tiếng Việt.",
    examples: [
      ex("June", "[dʒ]uːn"),
      ex("job", "[dʒ]ɒb"),
      ex("manager", "mænɪ[dʒ]ə"),
    ],
    azurePhonemes: [["dʒ"]],
    confusions: {
      z: "Chặn hơi bằng đầu lưỡi trên lợi rồi bật ra, môi tròn.",
      ʒ: "Chặn hơi bằng đầu lưỡi trước rồi mới bật ra.",
    },
  }),
  sound({
    slug: "k",
    symbol: "k",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "g",
    articulation: [
      "Nâng cuống lưỡi chạm ngạc mềm.",
      "Bật cuống lưỡi xuống, đẩy hơi ra.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Bỏ âm /k/ cuối từ như “book”.",
    examples: [ex("car", "[k]ɑː"), ex("call", "[k]ɔːl"), ex("book", "bʊ[k]")],
    azurePhonemes: [["k"]],
    confusions: { ɡ: "Bật hơi mạnh hơn, dây thanh không rung." },
  }),
  sound({
    slug: "g",
    symbol: "g",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "k",
    articulation: [
      "Nâng cuống lưỡi chạm ngạc mềm.",
      "Bật xuống nhẹ, dây thanh rung.",
    ],
    commonMistake: "Bỏ âm /g/ cuối từ như “bag”.",
    examples: [ex("go", "[g]əʊ"), ex("bag", "bæ[g]"), ex("again", "ə[g]en")],
    azurePhonemes: [["ɡ"], ["g"]],
    confusions: { k: "Cho dây thanh rung và bật hơi nhẹ hơn." },
  }),
  sound({
    slug: "f",
    symbol: "f",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "v",
    articulation: [
      "Đặt răng cửa trên chạm nhẹ môi dưới.",
      "Thổi hơi qua khe giữa răng và môi.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Bỏ /f/ cuối từ hoặc đọc thành /p/.",
    examples: [
      ex("fly", "[f]laɪ"),
      ex("office", "ɒ[f]ɪs"),
      ex("phone", "[f]əʊn"),
    ],
    azurePhonemes: [["f"]],
    confusions: { p: "Đừng mím môi; để răng trên chạm môi dưới và thổi hơi." },
  }),
  sound({
    slug: "v",
    symbol: "v",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "f",
    articulation: [
      "Răng cửa trên chạm nhẹ môi dưới.",
      "Thổi hơi và cho dây thanh rung.",
    ],
    commonMistake: "Đọc thành /b/ hoặc /w/; bỏ /v/ cuối từ như “have”.",
    examples: [
      ex("video", "[v]ɪdiəʊ"),
      ex("very", "[v]eri"),
      ex("have", "hæ[v]"),
    ],
    azurePhonemes: [["v"]],
    confusions: {
      b: "Đừng mím môi; để răng trên chạm môi dưới.",
      w: "Đừng tròn môi; để răng trên chạm môi dưới.",
      f: "Cho dây thanh rung khi thổi hơi.",
    },
  }),
  sound({
    slug: "th-voiceless",
    symbol: "θ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "th-voiced",
    articulation: [
      "Đặt đầu lưỡi giữa hai hàm răng, hơi thò ra.",
      "Thổi hơi qua khe giữa lưỡi và răng trên.",
      "Dây thanh không rung.",
    ],
    commonMistake:
      "Đọc thành /t/ hoặc /s/ nên “think” nghe như “tink”, “sink”.",
    examples: [
      ex("think", "[θ]ɪŋk"),
      ex("three", "[θ]riː"),
      ex("month", "mʌn[θ]"),
    ],
    azurePhonemes: [["θ"]],
    confusions: {
      s: "Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi, đừng để lưỡi sau răng.",
      t: "Không chặn hơi; để lưỡi giữa hai hàm răng và thổi liên tục.",
      f: "Dùng lưỡi thay vì môi dưới để tạo khe hơi.",
    },
  }),
  sound({
    slug: "th-voiced",
    symbol: "ð",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "th-voiceless",
    articulation: [
      "Đầu lưỡi đặt giữa hai hàm răng.",
      "Thổi hơi và cho dây thanh rung.",
    ],
    commonMistake: "Đọc thành /d/ hoặc /z/ nên “this” nghe như “dis”.",
    examples: [
      ex("this", "[ð]ɪs"),
      ex("mother", "mʌ[ð]ə"),
      ex("with", "wɪ[ð]"),
    ],
    azurePhonemes: [["ð"]],
    confusions: {
      d: "Không chặn hơi; để lưỡi giữa hai hàm răng và cho dây thanh rung.",
      z: "Đưa đầu lưỡi ra giữa hai hàm răng thay vì để sau răng.",
    },
  }),
  sound({
    slug: "s",
    symbol: "s",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "z",
    articulation: [
      "Đầu lưỡi gần lợi trên, hai hàm răng gần khít.",
      "Thổi hơi tạo tiếng xì.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Bỏ /s/ cuối từ (số nhiều, ngôi thứ ba) hoặc đọc thành /ʃ/.",
    examples: [
      ex("see", "[s]iː"),
      ex("sales", "[s]eɪlz"),
      ex("price", "praɪ[s]"),
    ],
    azurePhonemes: [["s"]],
    confusions: { ʃ: "Kéo môi sang ngang, đừng tròn môi." },
  }),
  sound({
    slug: "z",
    symbol: "z",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "s",
    articulation: [
      "Khẩu hình giống /s/.",
      "Cho dây thanh rung, tạo tiếng “zzz” như ong bay.",
    ],
    commonMistake: "Đọc thành /s/ ở cuối từ như “plans”.",
    examples: [
      ex("zoo", "[z]uː"),
      ex("busy", "bɪ[z]i"),
      ex("plans", "plæn[z]"),
    ],
    azurePhonemes: [["z"]],
    confusions: { s: "Cho dây thanh rung; đặt tay lên cổ phải thấy rung." },
  }),
  sound({
    slug: "sh",
    symbol: "ʃ",
    group: "consonant",
    subgroup: "voiceless",
    pairSlug: "zh",
    articulation: [
      "Môi tròn, đưa ra trước.",
      "Lưỡi lùi hơn /s/, thổi hơi tạo tiếng “sh”.",
      "Dây thanh không rung.",
    ],
    commonMistake: "Đọc thành /s/ vì không tròn môi.",
    examples: [
      ex("shall", "[ʃ]æl"),
      ex("shop", "[ʃ]ɒp"),
      ex("station", "steɪ[ʃ]n"),
    ],
    azurePhonemes: [["ʃ"]],
    confusions: { s: "Tròn môi và lùi lưỡi về sau một chút." },
  }),
  sound({
    slug: "zh",
    symbol: "ʒ",
    group: "consonant",
    subgroup: "voiced",
    pairSlug: "sh",
    articulation: ["Khẩu hình giống /ʃ/, môi tròn.", "Cho dây thanh rung."],
    commonMistake: "Đọc thành /z/ hoặc “gi” tiếng Việt.",
    examples: [
      ex("television", "telɪvɪ[ʒ]n"),
      ex("usually", "juː[ʒ]uəli"),
      ex("measure", "me[ʒ]ə"),
    ],
    azurePhonemes: [["ʒ"]],
    confusions: {
      z: "Tròn môi và lùi lưỡi về sau như khi nói /ʃ/.",
      ʃ: "Cho dây thanh rung.",
    },
  }),

  // Phụ âm còn lại: âm mũi, âm bên, bán nguyên âm, /h/
  sound({
    slug: "m",
    symbol: "m",
    group: "consonant",
    subgroup: "voiced",
    articulation: ["Mím hai môi.", "Cho hơi thoát qua mũi, dây thanh rung."],
    commonMistake: "Nuốt /m/ ở cuối từ như “team”.",
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
      "Đầu lưỡi chạm lợi trên.",
      "Cho hơi thoát qua mũi, dây thanh rung.",
    ],
    commonMistake: "Đọc lẫn với /ŋ/ ở cuối từ.",
    examples: [ex("now", "[n]aʊ"), ex("name", "[n]eɪm"), ex("plan", "plæ[n]")],
    azurePhonemes: [["n"]],
    confusions: {
      ŋ: "Đưa đầu lưỡi lên chạm lợi trên thay vì dùng cuống lưỡi.",
    },
  }),
  sound({
    slug: "ng",
    symbol: "ŋ",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Nâng cuống lưỡi chạm ngạc mềm như khi nói /k/.",
      "Cho hơi thoát qua mũi, không bật /g/ ra.",
    ],
    commonMistake: "Đọc thành /n/ hoặc thêm /g/ phía sau.",
    examples: [
      ex("sing", "sɪ[ŋ]"),
      ex("meeting", "miːtɪ[ŋ]"),
      ex("long", "lɒ[ŋ]"),
    ],
    azurePhonemes: [["ŋ"]],
    confusions: { n: "Dùng cuống lưỡi chặn phía sau, đầu lưỡi để yên." },
  }),
  sound({
    slug: "h",
    symbol: "h",
    group: "consonant",
    subgroup: "voiceless",
    articulation: [
      "Mở miệng theo nguyên âm đi sau.",
      "Thở hơi nhẹ ra từ cổ họng.",
    ],
    commonMistake: "Bỏ hẳn /h/ hoặc đọc quá nặng như “kh”.",
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
      "Đầu lưỡi chạm lợi trên.",
      "Hơi thoát ra hai bên lưỡi, dây thanh rung.",
      "Ở cuối từ, giữ lưỡi chạm lợi một chút.",
    ],
    commonMistake: "Bỏ /l/ cuối từ như “email” hoặc đọc thành /n/.",
    examples: [
      ex("love", "[l]ʌv"),
      ex("late", "[l]eɪt"),
      ex("email", "iːmeɪ[l]"),
    ],
    azurePhonemes: [["l"]],
    confusions: { n: "Để hơi thoát hai bên lưỡi, không qua mũi." },
  }),
  sound({
    slug: "r",
    symbol: "r",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Cong đầu lưỡi lên, không chạm vòm miệng.",
      "Môi hơi tròn, dây thanh rung.",
    ],
    commonMistake: "Rung lưỡi như “r” tiếng Việt hoặc đọc thành /l/, /z/.",
    examples: [
      ex("red", "[r]ed"),
      ex("report", "[r]ɪpɔːt"),
      ex("sorry", "sɒ[r]i"),
    ],
    azurePhonemes: [["ɹ"], ["r"]],
    confusions: {
      l: "Đừng để đầu lưỡi chạm lợi; cong lưỡi lên và tròn môi.",
      z: "Không để lưỡi gần răng; cong lưỡi lên phía sau.",
    },
  }),
  sound({
    slug: "w",
    symbol: "w",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Chu tròn môi như khi nói /uː/.",
      "Mở môi nhanh sang nguyên âm tiếp theo.",
    ],
    commonMistake: "Đọc thành /v/ hoặc “qu”.",
    examples: [ex("wet", "[w]et"), ex("work", "[w]ɜːk"), ex("quick", "k[w]ɪk")],
    azurePhonemes: [["w"]],
    confusions: { v: "Không để răng chạm môi; chỉ chu tròn môi." },
  }),
  sound({
    slug: "y",
    symbol: "j",
    group: "consonant",
    subgroup: "voiced",
    articulation: [
      "Mặt lưỡi nâng gần vòm miệng như khi nói /iː/.",
      "Lướt nhanh sang nguyên âm tiếp theo.",
    ],
    commonMistake: "Đọc thành “gi” hoặc bỏ /j/ như “use” thành “ooz”.",
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
