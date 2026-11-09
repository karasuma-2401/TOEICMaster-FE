import { Page, Route, BrowserContext } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createAdminSessionCookie(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    "34JICjBs7nQVpB7JJM3WjxMof8fZ6nVUdP2LbQXUA3w";
  const key = Buffer.from(secret, "base64url");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const session = {
    accessToken: "mock-admin-access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
    refreshToken: "mock-admin-refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
    user: {
      id: "admin-tester-01",
      displayName: "Admin Tester",
      email: "admin@toeicmaster.local",
    },
    role: "ADMIN",
    rememberMe: false,
  };
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return `v1.${iv.toString("base64url")}.${enc.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export async function loginAsAdmin(context: BrowserContext) {
  const cookie = createAdminSessionCookie();
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

export interface MockExercise {
  id: string;
  part: 1 | 2 | 3;
  code: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  rubricNotes: string;
  modelAnswer?: string | null;
  imageAssetId?: string | null;
  imageAlt?: string | null;
  keywordOne?: string | null;
  keywordTwo?: string | null;
  sender?: string | null;
  recipient?: string | null;
  subject?: string | null;
  emailBody?: string | null;
  directions?: string | null;
  prompt?: string | null;
  minimumWordCount?: number | null;
  outline?: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface MockTestQuestion {
  id: string;
  part: 1 | 2 | 3;
  sequenceNumber: number;
  exerciseId: string | null;
  snapshotJson: string | null;
}

export interface MockTest {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  questions: MockTestQuestion[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export class MockWritingAdminBackend {
  exercises: MockExercise[] = [];
  tests: MockTest[] = [];

  constructor() {
    this.seedDefaultData();
  }

  seedDefaultData() {
    this.exercises = [
      {
        id: "ex-p1-1",
        part: 1,
        code: "WP1-SEED-01",
        topic: "Office Workspace",
        difficulty: "EASY",
        status: "PUBLISHED",
        rubricNotes: "Standard P1 rubric",
        modelAnswer: "A man is typing on his computer.",
        imageAssetId: "img-seed-01",
        imageAlt: "A man typing at office",
        keywordOne: "man",
        keywordTwo: "laptop",
        version: 1,
        createdAtUtc: "2026-11-01T00:00:00Z",
        updatedAtUtc: "2026-11-01T00:00:00Z",
      },
      {
        id: "ex-p2-1",
        part: 2,
        code: "WP2-SEED-01",
        topic: "Customer Meeting",
        difficulty: "MEDIUM",
        status: "PUBLISHED",
        rubricNotes: "Polite tone and 2 questions",
        modelAnswer: "Dear Mr. Smith...",
        sender: "support@example.com",
        recipient: "client@example.com",
        subject: "Meeting Schedule",
        emailBody: "Could we reschedule our meeting to Thursday?",
        directions: "Confirm reschedule and ask 2 questions.",
        version: 1,
        createdAtUtc: "2026-11-01T00:00:00Z",
        updatedAtUtc: "2026-11-01T00:00:00Z",
      },
      {
        id: "ex-p3-1",
        part: 3,
        code: "WP3-SEED-01",
        topic: "Remote Work Opinion",
        difficulty: "HARD",
        status: "DRAFT",
        rubricNotes: "Clear thesis and 2 body paragraphs",
        modelAnswer: "Working remotely offers flexibility...",
        prompt:
          "Do you agree or disagree that working remotely improves employee productivity?",
        minimumWordCount: 300,
        outline:
          "1. Intro\n2. Body 1: Productivity\n3. Body 2: Well-being\n4. Conclusion",
        version: 1,
        createdAtUtc: "2026-11-01T00:00:00Z",
        updatedAtUtc: "2026-11-01T00:00:00Z",
      },
    ];

    // Seed a Draft test (8 questions 5/2/1)
    const draftQuestions: MockTestQuestion[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `q-p1-${i + 1}`,
        part: 1 as const,
        sequenceNumber: i + 1,
        exerciseId: null,
        snapshotJson: JSON.stringify({
          ImageAssetId: "img-seed-01",
          ImageAlt: `Desk Photo ${i + 1}`,
          KeywordOne: "person",
          KeywordTwo: "desk",
        }),
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `q-p2-${i + 1}`,
        part: 2 as const,
        sequenceNumber: i + 1,
        exerciseId: null,
        snapshotJson: JSON.stringify({
          Sender: "alice@corp.com",
          Recipient: "bob@corp.com",
          Subject: `Email Part 2 #${i + 1}`,
          EmailBody: "Please reply.",
          Directions: "Respond with 2 inquiries.",
        }),
      })),
      {
        id: "q-p3-1",
        part: 3 as const,
        sequenceNumber: 1,
        exerciseId: null,
        snapshotJson: JSON.stringify({
          Prompt: "Should schools require uniforms?",
          MinimumWordCount: 300,
          Outline: "Intro, Pros, Cons, Conclusion",
        }),
      },
    ];

    this.tests = [
      {
        id: "test-draft-01",
        code: "WT-DRAFT-01",
        title: "Đề thi Writing Bản nháp 01",
        description: "Đề thi nháp kiểm thử vòng đời đề",
        status: "DRAFT",
        version: 1,
        questions: draftQuestions,
        createdAtUtc: "2026-11-02T00:00:00Z",
        updatedAtUtc: "2026-11-02T00:00:00Z",
      },
      {
        id: "test-published-01",
        code: "WT-PUB-01",
        title: "Đề thi Writing Đã công bố 01",
        description: "Đề thi chuẩn đã xuất bản đóng băng nội dung",
        status: "PUBLISHED",
        version: 1,
        questions: draftQuestions,
        createdAtUtc: "2026-11-02T00:00:00Z",
        updatedAtUtc: "2026-11-02T00:00:00Z",
      },
      {
        id: "test-archived-01",
        code: "WT-ARC-01",
        title: "Đề thi Writing Đã lưu trữ 01",
        description: "Đề thi cũ đã lưu trữ",
        status: "ARCHIVED",
        version: 1,
        questions: draftQuestions,
        createdAtUtc: "2026-11-02T00:00:00Z",
        updatedAtUtc: "2026-11-02T00:00:00Z",
      },
    ];
  }

  async setupRoutes(page: Page) {
    await page.route("**/api/admin/writing/**", async (route: Route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const pathname = url.pathname.replace(/^\/api\/admin\/writing\/?/, "");

      // 1. Exercises
      if (pathname === "exercises" && method === "GET") {
        const part = url.searchParams.get("part");
        const query = (url.searchParams.get("query") || "").toLowerCase();
        const difficulty = url.searchParams.get("difficulty");
        const status = url.searchParams.get("status");
        const pageNumber = Number(url.searchParams.get("pageNumber") || "1");
        const pageSize = Number(url.searchParams.get("pageSize") || "20");

        let filtered = this.exercises.filter((ex) => {
          if (part && ex.part !== Number(part)) return false;
          if (
            query &&
            !ex.code.toLowerCase().includes(query) &&
            !ex.topic.toLowerCase().includes(query)
          )
            return false;
          if (
            difficulty &&
            difficulty !== "ALL" &&
            ex.difficulty !== difficulty
          )
            return false;
          if (status && status !== "ALL" && ex.status !== status) return false;
          return true;
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / pageSize) || 1;
        const start = (pageNumber - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items,
            totalCount,
            totalPages,
            pageNumber,
            pageSize,
          }),
        });
      }

      if (pathname === "exercises" && method === "POST") {
        const body = request.postDataJSON();
        const newEx: MockExercise = {
          ...body,
          id: `ex-${Date.now()}`,
          version: 1,
          createdAtUtc: new Date().toISOString(),
          updatedAtUtc: new Date().toISOString(),
        };
        this.exercises.unshift(newEx);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newEx),
        });
      }

      const exerciseIdMatch = pathname.match(/^exercises\/([^/]+)$/);
      if (exerciseIdMatch) {
        const exId = exerciseIdMatch[1];
        const existing = this.exercises.find((e) => e.id === exId);

        if (method === "GET") {
          if (!existing) {
            return route.fulfill({
              status: 404,
              contentType: "application/json",
              body: JSON.stringify({ title: "Not Found" }),
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (method === "PUT") {
          const body = request.postDataJSON();
          if (existing) {
            Object.assign(existing, body.exercise || body, {
              version: (existing.version || 1) + 1,
              updatedAtUtc: new Date().toISOString(),
            });
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(existing),
            });
          }
          return route.fulfill({ status: 404 });
        }

        if (method === "DELETE") {
          if (existing) {
            existing.status = "ARCHIVED";
            return route.fulfill({ status: 204 });
          }
          return route.fulfill({ status: 404 });
        }
      }

      // Exercise Import Validation
      if (pathname === "exercises/imports/validate" && method === "POST") {
        const part = Number(url.searchParams.get("part") || "1");
        const postData = request.postData() || "";

        // Check if file contains invalid missing columns fixture or valid fixture
        if (
          postData.includes("invalid-part1-missing-cols.xlsx") ||
          postData.includes("Thiếu") ||
          postData.includes("WP1-ERR")
        ) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              part,
              fileName: "invalid-part1-missing-cols.xlsx",
              validRowCount: 0,
              invalidRowCount: 1,
              rows: [
                {
                  rowNumber: 2,
                  code: "WP1-ERR-01",
                  isValid: false,
                  errors: [
                    "Thiếu Difficulty.",
                    "Thiếu Status.",
                    "Thiếu ImageAssetId.",
                  ],
                },
              ],
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            part,
            fileName: "sample-import.xlsx",
            validRowCount: 2,
            invalidRowCount: 0,
            rows: [
              {
                rowNumber: 2,
                code: `WP${part}-IMP-01`,
                isValid: true,
                errors: [],
              },
              {
                rowNumber: 3,
                code: `WP${part}-IMP-02`,
                isValid: true,
                errors: [],
              },
            ],
          }),
        });
      }

      // Exercise Import Commit
      if (pathname === "exercises/import" && method === "POST") {
        const part = Number(url.searchParams.get("part") || "1") as 1 | 2 | 3;
        const newEx1: MockExercise = {
          id: `ex-imp-${Date.now()}-1`,
          part,
          code: `WP${part}-IMP-01`,
          topic: `Imported Topic 1`,
          difficulty: "MEDIUM",
          status: "PUBLISHED",
          rubricNotes: "Imported rubric",
          version: 1,
          createdAtUtc: new Date().toISOString(),
          updatedAtUtc: new Date().toISOString(),
        };
        this.exercises.unshift(newEx1);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ importedCount: 1 }),
        });
      }

      // 2. Media Image Upload
      if (pathname === "media/images" && method === "POST") {
        const buffer = request.postDataBuffer() || Buffer.alloc(0);
        const headers = request.headers();
        const contentType = headers["content-type"] || "";
        const postDataStr = request.postData() || "";

        // Check file size (> 5MB) or oversized fixture
        if (
          buffer.length > 5 * 1024 * 1024 ||
          postDataStr.includes("oversized-image.png")
        ) {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              status: 400,
              title: "Ảnh không được vượt quá 5 MiB.",
            }),
          });
        }

        // Check if file is invalid format (txt/pdf)
        if (
          postDataStr.includes(".txt") ||
          postDataStr.includes("text/plain") ||
          postDataStr.includes(".pdf")
        ) {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              status: 400,
              title: "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG hoặc PNG.",
            }),
          });
        }

        const assetId = `img-asset-${Date.now()}`;
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: assetId,
            fileName: "uploaded.png",
            contentType: "image/png",
            sizeBytes: buffer.length,
          }),
        });
      }

      // Media Image GET
      if (pathname.startsWith("media/") && method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "image/png",
          body: Buffer.from("fake-image-bytes"),
        });
      }

      // 3. Tests
      if (pathname === "tests" && method === "GET") {
        const query = (url.searchParams.get("query") || "").toLowerCase();
        const status = url.searchParams.get("status");
        const pageNumber = Number(url.searchParams.get("pageNumber") || "1");
        const pageSize = Number(url.searchParams.get("pageSize") || "20");

        let filtered = this.tests.filter((t) => {
          if (
            query &&
            !t.code.toLowerCase().includes(query) &&
            !t.title.toLowerCase().includes(query)
          )
            return false;
          if (status && t.status !== status) return false;
          return true;
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / pageSize) || 1;
        const start = (pageNumber - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items,
            totalCount,
            totalPages,
            pageNumber,
            pageSize,
          }),
        });
      }

      if (pathname === "tests" && method === "POST") {
        const body = request.postDataJSON();
        const newTest: MockTest = {
          id: `test-${Date.now()}`,
          code: body.code,
          title: body.title,
          description: body.description || "",
          status: "DRAFT",
          version: 1,
          questions: (body.questions || []).map((q: any, idx: number) => ({
            id: `q-${Date.now()}-${idx}`,
            part: q.part,
            sequenceNumber: q.sequenceNumber,
            exerciseId: q.exerciseId || null,
            snapshotJson: q.content ? JSON.stringify(q.content) : null,
          })),
          createdAtUtc: new Date().toISOString(),
          updatedAtUtc: new Date().toISOString(),
        };
        this.tests.unshift(newTest);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newTest),
        });
      }

      if (pathname === "tests/import-template" && method === "GET") {
        return route.fulfill({
          status: 200,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          headers: {
            "content-disposition":
              'attachment; filename="writing-test-template.xlsx"',
          },
          body: Buffer.from("mock-xlsx-template-bytes"),
        });
      }

      if (pathname === "tests/imports/validate" && method === "POST") {
        const postData = request.postData() || "";

        // Check if file is invalid missing sheet or wrong counts
        if (
          postData.includes("invalid-missing-sheets") ||
          postData.includes("invalid-counts") ||
          postData.includes("toeic-lr-exam")
        ) {
          const errors = postData.includes("invalid-counts")
            ? ["Part 1 cần đúng 5 câu."]
            : ["File cần đủ 4 sheet: Manifest, Part1, Part2, Part3."];

          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              isValid: false,
              errors,
              test: null,
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            isValid: true,
            errors: [],
            test: {
              code: "WT-IMP-FULL",
              title: "Đề thi Writing Import Thành công",
              description: "Imported from Excel",
              questions: Array.from({ length: 8 }, (_, i) => ({
                part: i < 5 ? 1 : i < 7 ? 2 : 3,
                sequenceNumber: i < 5 ? i + 1 : i < 7 ? i - 4 : 1,
              })),
            },
          }),
        });
      }

      if (pathname === "tests/import" && method === "POST") {
        const newTest: MockTest = {
          id: `test-imp-${Date.now()}`,
          code: "WT-IMP-FULL",
          title: "Đề thi Writing Import Thành công",
          description: "Imported from Excel",
          status: "DRAFT",
          version: 1,
          questions: Array.from({ length: 8 }, (_, i) => ({
            id: `q-imp-${i}`,
            part: (i < 5 ? 1 : i < 7 ? 2 : 3) as 1 | 2 | 3,
            sequenceNumber: i < 5 ? i + 1 : i < 7 ? i - 4 : 1,
            exerciseId: null,
            snapshotJson: JSON.stringify({ title: "Question snapshot" }),
          })),
          createdAtUtc: new Date().toISOString(),
          updatedAtUtc: new Date().toISOString(),
        };
        this.tests.unshift(newTest);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newTest),
        });
      }

      const testActionMatch = pathname.match(
        /^tests\/([^/]+)(\/(publish|archive|restore))?$/,
      );
      if (testActionMatch) {
        const testId = testActionMatch[1];
        const action = testActionMatch[3];
        const existing = this.tests.find((t) => t.id === testId);

        if (!existing) {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ title: "Not Found" }),
          });
        }

        if (action === "publish" && method === "POST") {
          // Check if test has 8 questions
          if (existing.questions.length !== 8) {
            return route.fulfill({
              status: 400,
              contentType: "application/json",
              body: JSON.stringify({
                status: 400,
                title:
                  "Đề thi phải có đúng 8 câu hỏi chuẩn 5/2/1 trước khi xuất bản.",
              }),
            });
          }
          existing.status = "PUBLISHED";
          existing.version += 1;
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (action === "archive" && method === "POST") {
          existing.status = "ARCHIVED";
          existing.version += 1;
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (action === "restore" && method === "POST") {
          existing.status = "PUBLISHED";
          existing.version += 1;
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (method === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (method === "PUT") {
          const body = request.postDataJSON();
          if (existing.status === "PUBLISHED") {
            return route.fulfill({
              status: 400,
              contentType: "application/json",
              body: JSON.stringify({
                status: 400,
                title:
                  "Đề thi đã công bố bị đóng băng nội dung, không được phép chỉnh sửa.",
              }),
            });
          }
          Object.assign(existing, body.test || body, {
            version: (existing.version || 1) + 1,
            updatedAtUtc: new Date().toISOString(),
          });
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(existing),
          });
        }

        if (method === "DELETE") {
          if (existing.status !== "DRAFT") {
            return route.fulfill({
              status: 400,
              contentType: "application/json",
              body: JSON.stringify({
                status: 400,
                title: "Chỉ được xóa đề ở trạng thái bản nháp.",
              }),
            });
          }
          this.tests = this.tests.filter((t) => t.id !== testId);
          return route.fulfill({ status: 204 });
        }
      }

      return route.continue();
    });
  }
}

export const FIXTURES_DIR = path.resolve(__dirname, "../fixtures/writing");

/** Picks a value from a custom admin filter dropdown. */
export async function chooseFilter(page: Page, name: RegExp, option: string) {
  await page.getByRole("button", { name }).click();
  await page.getByRole("button", { name: option, exact: true }).click();
}
