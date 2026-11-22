import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { components, paths } from "./generated/openapi.types";
import type { MediaOwnerKind } from "@/features/admin/exam-api";
import type { ReadingContext } from "@/features/admin/exam-management";
import type { LrAttemptStatus } from "@/features/lr-exam/api";
import type {
  AdminUser,
  AdminUsersResponse,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "@/features/admin/users";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false;

type ExamRevisionStatus = components["schemas"]["ExamRevisionStatus"];
type ExamBlockType = components["schemas"]["ExamBlockType"];
type ExamContextType = components["schemas"]["ExamContextType"];
type ExamMediaOwnerKind = components["schemas"]["ExamMediaOwnerKind"];
type ExamAttemptStatus = components["schemas"]["ExamAttemptStatus"];
type ExamReviewFilter = components["schemas"]["ExamReviewFilter"];
type ExamSkill = components["schemas"]["ExamSkill"];
type AdminUserDto = components["schemas"]["AdminUserDto"];
type AdminUserPageDto = components["schemas"]["AdminUserPageDto"];
type CreateAdminUserRequest = components["schemas"]["CreateAdminUserRequest"];
type UpdateAdminUserRequest = components["schemas"]["UpdateAdminUserRequest"];

describe("generated OpenAPI contract", () => {
  it("preserves PascalCase Exam enum unions and FE compatibility", () => {
    expectTypeOf<
      Equal<ExamRevisionStatus, "Draft" | "Published" | "Superseded">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamBlockType, "Single" | "Group">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamContextType, "Text" | "Image">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamMediaOwnerKind, "AudioGroup" | "QuestionImage" | "ContextImage">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamAttemptStatus, "InProgress" | "Completed" | "Abandoned">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamReviewFilter, "All" | "Incorrect" | "Flagged">
    >().toEqualTypeOf<true>();
    expectTypeOf<
      Equal<ExamSkill, "Listening" | "Reading">
    >().toEqualTypeOf<true>();
    expectTypeOf<"Draft" | "Published">().toMatchTypeOf<ExamRevisionStatus>();
    expectTypeOf<MediaOwnerKind>().toEqualTypeOf<ExamMediaOwnerKind>();
    expectTypeOf<ReadingContext["type"]>().toEqualTypeOf<ExamContextType>();
    expectTypeOf<LrAttemptStatus>().toEqualTypeOf<ExamAttemptStatus>();
  });

  it("keeps AdminUsers DTOs and all eight operations in the generated contract", async () => {
    expectTypeOf<AdminUser["id"]>().toEqualTypeOf<AdminUserDto["id"]>();
    expectTypeOf<AdminUser["email"]>().toEqualTypeOf<AdminUserDto["email"]>();
    expectTypeOf<AdminUser["createdAt"]>().toEqualTypeOf<
      AdminUserDto["createdAt"]
    >();
    expectTypeOf<AdminUser["emailVerified"]>().toEqualTypeOf<
      AdminUserDto["emailVerified"]
    >();
    expectTypeOf<AdminUser["role"]>().toMatchTypeOf<AdminUserDto["role"]>();
    expectTypeOf<AdminUser["status"]>().toMatchTypeOf<AdminUserDto["status"]>();
    expectTypeOf<AdminUser["authProvider"]>().toMatchTypeOf<
      AdminUserDto["authProvider"]
    >();
    expectTypeOf<AdminUsersResponse["stats"]>().toMatchTypeOf<
      AdminUserPageDto["stats"]
    >();
    expectTypeOf<CreateAdminUserInput["fullName"]>().toEqualTypeOf<
      CreateAdminUserRequest["fullName"]
    >();
    expectTypeOf<CreateAdminUserInput["email"]>().toEqualTypeOf<
      CreateAdminUserRequest["email"]
    >();
    expectTypeOf<CreateAdminUserInput["sendActivationEmail"]>().toEqualTypeOf<
      CreateAdminUserRequest["sendActivationEmail"]
    >();
    expectTypeOf<UpdateAdminUserInput["role"]>().toMatchTypeOf<
      UpdateAdminUserRequest["role"]
    >();

    const snapshotPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../docs/contracts/openapi.json",
    );
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as {
      paths: Record<
        string,
        Record<string, { responses?: Record<string, unknown> }>
      >;
    };
    const expected: Record<string, Record<string, string>> = {
      "/api/v1/admin/users": { get: "200", post: "201" },
      "/api/v1/admin/users/{id}": { get: "200", patch: "200", delete: "204" },
      "/api/v1/admin/users/{id}/lock": { post: "204", delete: "204" },
      "/api/v1/admin/users/{id}/reset-password": { post: "204" },
    };
    expect(Object.keys(expected)).toHaveLength(4);
    for (const [route, methods] of Object.entries(expected)) {
      for (const [method, status] of Object.entries(methods)) {
        expect(snapshot.paths[route]?.[method]?.responses).toHaveProperty(
          status,
        );
      }
    }
    expectTypeOf<paths["/api/v1/admin/users"]["get"]>().toMatchTypeOf<object>();
  });
});
