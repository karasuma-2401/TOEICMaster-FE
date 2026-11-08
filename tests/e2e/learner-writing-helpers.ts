import { Page, Route, BrowserContext } from "@playwright/test";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createUserSessionCookie(
  userId = "user-learner-01",
  email = "learner@example.com",
): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    "34JICjBs7nQVpB7JJM3WjxMof8fZ6nVUdP2LbQXUA3w";
  const key = Buffer.from(secret, "base64url");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const session = {
    accessToken: `mock-token-${userId}`,
    accessTokenExpiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
    refreshToken: `mock-refresh-${userId}`,
    refreshTokenExpiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
    user: { id: userId, displayName: "Learner User", email },
    role: "USER" as const,
    rememberMe: false,
  };
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return `v1.${iv.toString("base64url")}.${enc.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export async function loginAsUser(
  context: BrowserContext,
  userId?: string,
  email?: string,
) {
  const cookie = createUserSessionCookie(userId, email);
  await context.addCookies([
    {
      name: "toeicmaster_session",
      value: cookie,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export interface MockLearnerAttemptQuestion {
  position: number;
  part: 1 | 2 | 3;
  preparationSeconds: number;
  responseSeconds: number;
  imageUrl: string | null;
  imageAlt: string | null;
  keywordOne: string | null;
  keywordTwo: string | null;
  sender: string | null;
  recipient: string | null;
  subject: string | null;
  emailBody: string | null;
  directions: string | null;
  prompt: string | null;
  minimumWordCount: number | null;
  outline: string | null;
  answer: string;
  lastSavedAtUtc: string | null;
  lockedAtUtc: string | null;
}

export interface MockLearnerEvaluation {
  id: string;
  status:
    | "CONSENT_REQUIRED"
    | "QUEUED"
    | "PROCESSING"
    | "RETRYING"
    | "COMPLETED"
    | "FAILED";
  estimatedScore: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  feedback: Array<{
    questionPosition: number;
    criterionScore: number;
    feedback: string;
    suggestedRevision: string;
  }>;
  provider: string;
  model: string;
  rubricVersion: string;
  consentAcceptedAtUtc: string | null;
  queuedAtUtc: string | null;
  completedAtUtc: string | null;
  retryCount: number;
  failureMessage: string | null;
}

export interface MockLearnerAttempt {
  id: string;
  testId: string | null;
  testCode: string;
  testTitle: string;
  ownerId: string;
  isPractice: boolean;
  mode: "FULL" | "PART_1" | "PART_2" | "PART_3";
  status: "IN_PROGRESS" | "SUBMITTED_AWAITING_EVALUATION";
  currentPhase: "PREPARING" | "ANSWERING" | null;
  phaseEndsAtUtc: string | null;
  currentQuestionPosition: number | null;
  questions: MockLearnerAttemptQuestion[];
  evaluation: MockLearnerEvaluation | null;
  reviewQuestions: Array<{ position: number; modelAnswer: string }>;
  createdAtUtc: string;
  submittedAtUtc: string | null;
  serverNowUtc: string;
}

export function sanitizeQuestion(
  q: Partial<MockLearnerAttemptQuestion> & {
    position: number;
    part: 1 | 2 | 3;
  },
): MockLearnerAttemptQuestion {
  return {
    position: q.position,
    part: q.part,
    preparationSeconds: q.preparationSeconds ?? 0,
    responseSeconds: q.responseSeconds ?? 45,
    imageUrl: q.imageUrl ?? null,
    imageAlt: q.imageAlt ?? null,
    keywordOne: q.keywordOne ?? null,
    keywordTwo: q.keywordTwo ?? null,
    sender: q.sender ?? null,
    recipient: q.recipient ?? null,
    subject: q.subject ?? null,
    emailBody: q.emailBody ?? null,
    directions: q.directions ?? null,
    prompt: q.prompt ?? null,
    minimumWordCount: q.minimumWordCount ?? null,
    outline: q.outline ?? null,
    answer: q.answer ?? "",
    lastSavedAtUtc: q.lastSavedAtUtc ?? null,
    lockedAtUtc: q.lockedAtUtc ?? null,
  };
}

export function sanitizeEvaluation(
  e?: Partial<MockLearnerEvaluation> | null,
): MockLearnerEvaluation | null {
  if (!e) return null;
  return {
    id: e.id ?? "eval-default",
    status: e.status ?? "CONSENT_REQUIRED",
    estimatedScore: e.estimatedScore ?? null,
    summary: e.summary ?? "",
    strengths: e.strengths ?? [],
    improvements: e.improvements ?? [],
    feedback: (e.feedback ?? []).map((f) => ({
      questionPosition: f.questionPosition,
      criterionScore: f.criterionScore,
      feedback: f.feedback,
      suggestedRevision: f.suggestedRevision,
    })),
    provider: e.provider ?? "Google Gemini",
    model: e.model ?? "gemini-2.5-flash",
    rubricVersion: e.rubricVersion ?? "v1.0",
    consentAcceptedAtUtc:
      e.consentAcceptedAtUtc ??
      (e.status !== "CONSENT_REQUIRED" ? new Date().toISOString() : null),
    queuedAtUtc:
      e.queuedAtUtc ??
      (e.status !== "CONSENT_REQUIRED" ? new Date().toISOString() : null),
    completedAtUtc:
      e.completedAtUtc ??
      (e.status === "COMPLETED" ? new Date().toISOString() : null),
    retryCount: e.retryCount ?? 0,
    failureMessage: e.failureMessage ?? null,
  };
}

export function sanitizeAttempt(
  a: Partial<MockLearnerAttempt> & {
    id: string;
    testCode: string;
    testTitle: string;
    ownerId: string;
  },
): MockLearnerAttempt {
  return {
    id: a.id,
    testId: a.testId ?? null,
    testCode: a.testCode,
    testTitle: a.testTitle,
    ownerId: a.ownerId,
    isPractice: Boolean(a.isPractice),
    mode: a.mode ?? (a.isPractice ? "PART_1" : "FULL"),
    status: a.status ?? "IN_PROGRESS",
    currentPhase: a.currentPhase ?? "ANSWERING",
    phaseEndsAtUtc: a.phaseEndsAtUtc ?? null,
    currentQuestionPosition:
      a.currentQuestionPosition !== undefined
        ? a.currentQuestionPosition
        : a.status === "IN_PROGRESS"
          ? 1
          : null,
    questions: (a.questions ?? []).map(sanitizeQuestion),
    evaluation: sanitizeEvaluation(a.evaluation),
    reviewQuestions: a.reviewQuestions ?? [],
    createdAtUtc: a.createdAtUtc ?? new Date().toISOString(),
    submittedAtUtc:
      a.submittedAtUtc ??
      (a.status === "SUBMITTED_AWAITING_EVALUATION"
        ? new Date().toISOString()
        : null),
    serverNowUtc: new Date().toISOString(),
  };
}

export class MockWritingLearnerBackend {
  publishedTests: any[] = [];
  practiceExercises: Record<number, any[]> = [];
  attempts: MockLearnerAttempt[] = [];
  guestConsentUsed = false;

  constructor() {
    this.seedData();
  }

  seedData() {
    // 1. Published Full Tests
    this.publishedTests = [
      {
        id: "test-pub-01",
        code: "WT-PUB-FULL-01",
        title: "TOEIC Writing Simulation Test 01",
        description: "Đề thi chuẩn 8 câu với đầy đủ 3 phần thi theo chuẩn ETS.",
        publishedAtUtc: "2026-11-01T00:00:00Z",
        parts: [
          {
            part: 1,
            questionCount: 5,
            preparationSeconds: 0,
            responseSeconds: 480,
          },
          {
            part: 2,
            questionCount: 2,
            preparationSeconds: 0,
            responseSeconds: 600,
          },
          {
            part: 3,
            questionCount: 1,
            preparationSeconds: 0,
            responseSeconds: 1800,
          },
        ],
      },
      {
        id: "test-pub-02",
        code: "WT-PUB-FULL-02",
        title: "TOEIC Writing Simulation Test 02",
        description: "Đề thi luyện tập hoàn chỉnh số 2.",
        publishedAtUtc: "2026-11-02T00:00:00Z",
        parts: [
          {
            part: 1,
            questionCount: 5,
            preparationSeconds: 0,
            responseSeconds: 480,
          },
          {
            part: 2,
            questionCount: 2,
            preparationSeconds: 0,
            responseSeconds: 600,
          },
          {
            part: 3,
            questionCount: 1,
            preparationSeconds: 0,
            responseSeconds: 1800,
          },
        ],
      },
    ];

    // 2. Published Practice Exercises
    this.practiceExercises[1] = [
      {
        id: "prac-p1-01",
        code: "WP1-PRAC-01",
        part: 1,
        topic: "Coffee Break Discussion",
        difficulty: "EASY",
      },
      {
        id: "prac-p1-02",
        code: "WP1-PRAC-02",
        part: 1,
        topic: "Office Filing Cabinet",
        difficulty: "MEDIUM",
      },
    ];

    this.practiceExercises[2] = [
      {
        id: "prac-p2-01",
        code: "WP2-PRAC-01",
        part: 2,
        topic: "Conference Invitation Response",
        difficulty: "MEDIUM",
      },
    ];

    this.practiceExercises[3] = [
      {
        id: "prac-p3-01",
        code: "WP3-PRAC-01",
        part: 3,
        topic: "Team Collaboration vs Individual Work",
        difficulty: "HARD",
      },
    ];

    // 3. Pre-seeded Attempts
    // 3a. In-progress attempt on Question 1 in PREPARING phase
    const attemptQuestions: MockLearnerAttemptQuestion[] = [
      sanitizeQuestion({
        position: 1,
        part: 1,
        preparationSeconds: 15,
        responseSeconds: 45,
        imageAlt: "A person at desk",
        keywordOne: "person",
        keywordTwo: "desk",
        answer: "",
      }),
      sanitizeQuestion({
        position: 2,
        part: 1,
        preparationSeconds: 15,
        responseSeconds: 45,
        imageAlt: "Two people in meeting",
        keywordOne: "meeting",
        keywordTwo: "discuss",
        answer: "",
      }),
      sanitizeQuestion({
        position: 3,
        part: 3,
        preparationSeconds: 0,
        responseSeconds: 1800,
        prompt:
          "Do you agree that universities should offer free tuition for all students?",
        minimumWordCount: 300,
        outline:
          "1. Introduction\n2. Financial equality\n3. Fiscal reality\n4. Conclusion",
        answer: "",
      }),
    ];

    this.attempts.push(
      sanitizeAttempt({
        id: "att-in-progress-01",
        testId: "test-pub-01",
        testCode: "WT-PUB-FULL-01",
        testTitle: "TOEIC Writing Simulation Test 01",
        ownerId: "user-learner-01",
        isPractice: false,
        mode: "FULL",
        status: "IN_PROGRESS",
        currentPhase: "PREPARING",
        phaseEndsAtUtc: new Date(Date.now() + 15000).toISOString(),
        currentQuestionPosition: 1,
        questions: attemptQuestions,
      }),
    );

    // 3b. Completed attempt with AI evaluation
    this.attempts.push(
      sanitizeAttempt({
        id: "att-completed-01",
        testId: "test-pub-01",
        testCode: "WT-PUB-FULL-01",
        testTitle: "TOEIC Writing Simulation Test 01",
        ownerId: "user-learner-01",
        isPractice: false,
        mode: "FULL",
        status: "SUBMITTED_AWAITING_EVALUATION",
        currentPhase: null,
        currentQuestionPosition: null,
        submittedAtUtc: "2026-11-05T01:30:00Z",
        questions: [
          sanitizeQuestion({
            position: 1,
            part: 1,
            preparationSeconds: 0,
            responseSeconds: 45,
            imageAlt: "A person typing on computer",
            keywordOne: "person",
            keywordTwo: "computer",
            answer: "The person is typing diligently on the computer.",
            lockedAtUtc: "2026-11-05T01:00:00Z",
          }),
        ],
        evaluation: {
          id: "eval-comp-01",
          status: "COMPLETED",
          estimatedScore: 170,
          summary:
            "Bài viết có ngữ pháp vững vàng, sử dụng từ vựng phong phú và cấu trúc câu mạch lạc.",
          strengths: [
            "Sử dụng đúng thì và hòa hợp chủ vị chính xác.",
            "Bố cục bài viết rõ ràng, logic lập luận chặt chẽ.",
          ],
          improvements: [
            "Chú ý đa dạng hóa liên từ nối câu.",
            "Phát triển thêm ví dụ thực tế cho luận điểm thứ 2.",
          ],
          feedback: [
            {
              questionPosition: 1,
              criterionScore: 3,
              feedback: "Câu văn hoàn chỉnh, đáp ứng đúng 2 từ khóa cho trước.",
              suggestedRevision:
                "The person is typing diligently on the office computer.",
            },
          ],
          provider: "Google Gemini",
          model: "gemini-2.5-flash",
          rubricVersion: "v1.0",
          consentAcceptedAtUtc: "2026-11-05T01:30:10Z",
          queuedAtUtc: "2026-11-05T01:30:12Z",
          completedAtUtc: "2026-11-05T01:30:25Z",
          retryCount: 0,
          failureMessage: null,
        },
      }),
    );

    // 3c. Another user's attempt (for cross-user security test)
    this.attempts.push(
      sanitizeAttempt({
        id: "att-other-user-99",
        testId: "test-pub-01",
        testCode: "WT-PUB-FULL-01",
        testTitle: "Private Attempt of Another User",
        ownerId: "victim-user-99",
        isPractice: false,
        mode: "FULL",
        status: "IN_PROGRESS",
        currentPhase: "ANSWERING",
        currentQuestionPosition: 1,
        questions: attemptQuestions,
      }),
    );
  }

  async setupRoutes(page: Page) {
    // Mock user profile & auth session to prevent session expired alerts
    await page.route("**/api/users/me", async (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-learner-01",
          displayName: "Learner User",
          email: "learner@example.com",
          avatarUrl: null,
          role: "USER",
        }),
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "authenticated",
          user: {
            id: "user-learner-01",
            displayName: "Learner User",
            email: "learner@example.com",
          },
        }),
      });
    });

    await page.route("**/api/writing/**", async (route: Route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const pathname = url.pathname.replace(/^\/api\/writing\/?/, "");

      // 1. Tests list (/api/writing/tests)
      if (pathname === "tests" && method === "GET") {
        const query = (url.searchParams.get("query") || "").toLowerCase();
        let items = this.publishedTests;
        if (query) {
          items = items.filter(
            (t) =>
              t.code.toLowerCase().includes(query) ||
              t.title.toLowerCase().includes(query),
          );
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items,
            totalCount: items.length,
            totalPages: 1,
            pageNumber: 1,
            pageSize: 20,
          }),
        });
      }

      // Test detail (/api/writing/tests/:id)
      const testMatch = pathname.match(/^tests\/([^/]+)$/);
      if (testMatch && method === "GET") {
        const t = this.publishedTests.find((x) => x.id === testMatch[1]);
        if (!t) return route.fulfill({ status: 404 });
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(t),
        });
      }

      // 2. Practice exercises (/api/writing/exercises?part=1)
      if (pathname === "exercises" && method === "GET") {
        const part = Number(url.searchParams.get("part") || "1");
        const items = this.practiceExercises[part] || [];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items,
            totalCount: items.length,
            totalPages: 1,
            pageNumber: 1,
            pageSize: 20,
          }),
        });
      }

      // Start Practice (/api/writing/exercises/:id/attempts)
      const startPracMatch = pathname.match(/^exercises\/([^/]+)\/attempts$/);
      if (startPracMatch && method === "POST") {
        const newAtt = sanitizeAttempt({
          id: `att-prac-${Date.now()}`,
          testCode: "PRACTICE-EX",
          testTitle: "Bài tập luyện Part",
          ownerId: "user-learner-01",
          isPractice: true,
          mode: "PART_1",
          status: "IN_PROGRESS",
          currentPhase: "ANSWERING",
          phaseEndsAtUtc: null,
          currentQuestionPosition: 1,
          questions: [
            sanitizeQuestion({
              position: 1,
              part: 1,
              preparationSeconds: 0,
              responseSeconds: 0,
              imageAlt: "Practice Image",
              keywordOne: "cat",
              keywordTwo: "sleep",
              answer: "",
            }),
          ],
        });
        this.attempts.unshift(newAtt);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newAtt),
        });
      }

      // 3. Start Test Attempt (/api/writing/attempts - POST)
      if (pathname === "attempts" && method === "POST") {
        const body = request.postDataJSON() || {};
        const newAtt = sanitizeAttempt({
          id: `att-test-${Date.now()}`,
          testId: body.testId || "test-pub-01",
          testCode: "WT-PUB-FULL-01",
          testTitle: "TOEIC Writing Simulation Test 01",
          ownerId: "user-learner-01",
          isPractice: false,
          mode: "FULL",
          status: "IN_PROGRESS",
          currentPhase: "PREPARING",
          phaseEndsAtUtc: new Date(Date.now() + 15000).toISOString(),
          currentQuestionPosition: 1,
          questions: [
            sanitizeQuestion({
              position: 1,
              part: 1,
              preparationSeconds: 15,
              responseSeconds: 45,
              imageAlt: "A person at desk",
              keywordOne: "person",
              keywordTwo: "desk",
              answer: "",
            }),
            sanitizeQuestion({
              position: 2,
              part: 2,
              preparationSeconds: 0,
              responseSeconds: 600,
              sender: "boss@corp.com",
              recipient: "staff@corp.com",
              subject: "Staff Meeting",
              emailBody: "Please attend.",
              directions: "Reply with questions.",
              answer: "",
            }),
            sanitizeQuestion({
              position: 3,
              part: 3,
              preparationSeconds: 0,
              responseSeconds: 1800,
              prompt: "Do you agree that universities should be tuition-free?",
              minimumWordCount: 300,
              answer: "",
            }),
          ],
        });
        this.attempts.unshift(newAtt);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newAtt),
        });
      }

      // 4. Attempt History (/api/writing/attempts - GET)
      if (pathname === "attempts" && method === "GET") {
        const items = this.attempts.map((a) => ({
          id: a.id,
          testId: a.testId,
          testCode: a.testCode,
          testTitle: a.testTitle,
          isPractice: a.isPractice,
          mode: a.mode,
          status: a.status,
          questionCount: a.questions.length,
          currentQuestionPosition: a.currentQuestionPosition,
          estimatedScore: a.evaluation?.estimatedScore ?? null,
          evaluationStatus: a.evaluation?.status ?? null,
          createdAtUtc: a.createdAtUtc,
          submittedAtUtc: a.submittedAtUtc,
          updatedAtUtc: a.createdAtUtc,
        }));
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items }),
        });
      }

      // 5. Attempt actions: next, submit, evaluation-consent, answers
      const attemptActionMatch = pathname.match(
        /^attempts\/([^/]+)(\/(next|submit|evaluation-consent|answers\/(\d+)))?$/,
      );
      if (attemptActionMatch) {
        const attId = attemptActionMatch[1];
        const action = attemptActionMatch[3];
        const positionParam = attemptActionMatch[4];

        // Security check: If checking other user's attempt
        if (attId === "att-other-user-99") {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
              status: 404,
              title: "Không tìm thấy lượt làm bài.",
            }),
          });
        }

        const att = this.attempts.find((x) => x.id === attId);
        if (!att) {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ title: "Not Found" }),
          });
        }

        att.serverNowUtc = new Date().toISOString();

        // 5a. Save Answer (Autosave)
        if (action?.startsWith("answers") && method === "PUT") {
          const pos = Number(positionParam);
          const body = request.postDataJSON() || {};
          const q = att.questions.find((x) => x.position === pos);
          if (q) {
            q.answer = body.answer || "";
            q.lastSavedAtUtc = new Date().toISOString();
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(att),
          });
        }

        // 5b. Next Question (Lock current question)
        if (action === "next" && method === "POST") {
          const currentPos = att.currentQuestionPosition || 1;
          const currentQ = att.questions.find((x) => x.position === currentPos);
          if (currentQ) {
            currentQ.lockedAtUtc = new Date().toISOString();
          }
          const nextPos = currentPos + 1;
          if (nextPos <= att.questions.length) {
            att.currentQuestionPosition = nextPos;
            att.currentPhase = "ANSWERING";
            att.phaseEndsAtUtc = new Date(Date.now() + 60000).toISOString();
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(att),
          });
        }

        // 5c. Submit Attempt
        if (action === "submit" && method === "POST") {
          att.status = "SUBMITTED_AWAITING_EVALUATION";
          att.currentQuestionPosition = null;
          att.submittedAtUtc = new Date().toISOString();
          att.questions.forEach((q) => {
            if (!q.lockedAtUtc) q.lockedAtUtc = new Date().toISOString();
          });
          if (!att.evaluation) {
            att.evaluation = sanitizeEvaluation({
              id: `eval-${att.id}`,
              status: "CONSENT_REQUIRED",
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(att),
          });
        }

        // 5d. AI Evaluation Consent
        if (action === "evaluation-consent" && method === "POST") {
          // Check Guest Limit: 1 time in 24h
          const cookieHeader = request.headers()["cookie"] || "";
          const isGuest = !cookieHeader.includes("toeicmaster_session");
          if (isGuest && this.guestConsentUsed) {
            return route.fulfill({
              status: 409,
              contentType: "application/json",
              body: JSON.stringify({
                status: 409,
                title:
                  "Phiên ẩn danh đã dùng lượt chấm AI trong 24 giờ qua. Hãy đăng nhập hoặc thử lại sau.",
              }),
            });
          }

          if (isGuest) {
            this.guestConsentUsed = true;
          }

          // Transition to QUEUED
          att.evaluation = sanitizeEvaluation({
            id: `eval-${att.id}`,
            status: "QUEUED",
          });
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(att),
          });
        }

        // 5e. Get Attempt detail
        if (method === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(att),
          });
        }
      }

      return route.continue();
    });
  }
}
