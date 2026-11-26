export interface MascotGuide {
  title: string;
  tips: string[];
}

const guides: { match: RegExp; guide: MascotGuide }[] = [
  {
    match: /^\/speaking\/(tests\/[^/]+\/practice|exercises\/[^/]+\/practice)/,
    guide: {
      title: "Check your microphone",
      tips: [
        "Allow the browser to access your microphone when prompted.",
        'Read a few words aloud. Once you see "Microphone is working well", you are ready to start.',
      ],
    },
  },
  {
    match: /^\/speaking\/attempts\/[^/]+\/review/,
    guide: {
      title: "Review your attempt",
      tips: [
        "Click a question number on the left to switch questions.",
        "Underlined words are ones the AI flagged as unclear. Hover over them to see the score.",
      ],
    },
  },
  {
    match: /^\/speaking\/parts/,
    guide: {
      title: "Practice by Part",
      tips: [
        "Select a Part from the buttons right below the heading.",
        "Filter by difficulty or status, then click Practice to begin.",
      ],
    },
  },
  {
    match: /^\/speaking/,
    guide: {
      title: "Speaking Page",
      tips: [
        "Just getting started? Click Exercises right below the heading to practice each Part first.",
        "When you are ready, pick a full 11-question mock test.",
        "During a test, once you finish speaking, click Next instead of waiting for the timer.",
      ],
    },
  },
  {
    match: /^\/writing\/practice/,
    guide: {
      title: "Practice Writing by Part",
      tips: ["Choose an exercise from the list to start writing."],
    },
  },
  {
    match: /^\/writing/,
    guide: {
      title: "Writing Page",
      tips: [
        "Practice individual Parts to get familiar with each task, or take a full timed test.",
        "Review your past attempts in the History section.",
      ],
    },
  },
  {
    match: /^\/flashcards/,
    guide: {
      title: "Quick Flashcard Study",
      tips: [
        "Press Space to flip a card, S to hear pronunciation, and 1 / 2 / 3 to rate how well you remember it.",
        "Switch to the Quick Quiz tab after flipping cards to test your memory.",
      ],
    },
  },
  {
    match: /^\/history/,
    guide: {
      title: "Learning History",
      tips: ["Open any completed attempt to review your results."],
    },
  },
];

const home: MascotGuide = {
  title: "Hi there, I'm Mic!",
  tips: [
    'Choose the skill you want to practice in the "Three standalone tests" section.',
    "Click the TOEICMaster logo in the top bar to return to the home page.",
    "Whenever you need help, just click me in the corner of the screen.",
  ],
};

const suppressedRoutes = [
  /^\/(exams\/lr|speaking|writing)\/attempts\//,
  /^\/exams\/lr\/[^/]+\/attempt(?:\/|$)/,
  /^\/(listening|reading)\/practice\//,
  /^\/(speaking|writing)\/parts\//,
];

/** The guide for a page, or null where the mascot would disturb an active exam or practice session. */
export function mascotGuide(pathname: string): MascotGuide | null {
  if (suppressedRoutes.some((pattern) => pattern.test(pathname))) return null;
  return guides.find((item) => item.match.test(pathname))?.guide ?? home;
}
