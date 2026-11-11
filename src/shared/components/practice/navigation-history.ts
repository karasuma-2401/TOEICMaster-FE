// In-app visits of this page load. The browser's own history also holds other
// sites, so it cannot tell whether "back" stays inside the app.
let visits: string[] = [];

/** Next visit list: returning to an earlier page drops what came after it. */
export function nextVisits(current: string[], path: string) {
  const index = current.lastIndexOf(path);
  return index >= 0 ? current.slice(0, index + 1) : [...current, path];
}

export function trackVisit(path: string) {
  visits = nextVisits(visits, path);
}

export function hasPreviousVisit() {
  return visits.length > 1;
}

const parents: [RegExp, string | ((match: RegExpMatchArray) => string)][] = [
  [
    /^\/speaking\/attempts\/([^/]+)\/review(\/.*)?$/,
    (match) => `/speaking/attempts/${match[1]}`,
  ],
  [
    /^\/speaking\/tests\/([^/]+)\/practice$/,
    (match) => `/speaking/tests/${match[1]}`,
  ],
  [/^\/speaking\/exercises\//, "/speaking/parts/1"],
  [/^\/speaking\/.+/, "/speaking"],
  [/^\/writing\/attempts\/[^/]+\/result$/, "/history/writing"],
  [/^\/writing\/.+/, "/writing"],
  [/^\/listening\/.+/, "/listening"],
  [/^\/reading\/.+/, "/reading"],
];

/** Where "back" leads when the page was opened directly. */
export function parentPath(path: string) {
  for (const [pattern, target] of parents) {
    const match = path.match(pattern);
    if (match) return typeof target === "string" ? target : target(match);
  }
  return "/";
}
