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
  AdminUsersStats,
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
type AdminUserStatsDto = components["schemas"]["AdminUserStatsDto"];
type AdminUserPageDto = components["schemas"]["AdminUserPageDto"];
type CreateAdminUserRequest = components["schemas"]["CreateAdminUserRequest"];
type UpdateAdminUserRequest = components["schemas"]["UpdateAdminUserRequest"];

interface OpenApiMediaType {
  schema?: {
    $ref?: string;
  };
}

interface OpenApiOperation {
  parameters?: Array<{
    name?: string;
    in?: string;
    required?: boolean;
  }>;
  requestBody?: {
    content?: Record<string, OpenApiMediaType>;
  };
  responses?: Record<
    string,
    {
      content?: Record<string, OpenApiMediaType>;
    }
  >;
}

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
    // FE AdminUsers DTO structural alignment
    expectTypeOf<AdminUser["id"]>().toEqualTypeOf<AdminUserDto["id"]>();
    expectTypeOf<AdminUser["fullName"]>().toEqualTypeOf<
      AdminUserDto["fullName"]
    >();
    expectTypeOf<AdminUser["email"]>().toEqualTypeOf<AdminUserDto["email"]>();
    expectTypeOf<Exclude<AdminUser["avatarUrl"], undefined>>().toEqualTypeOf<
      AdminUserDto["avatarUrl"]
    >();
    expectTypeOf<AdminUserDto["avatarUrl"]>().toMatchTypeOf<
      AdminUser["avatarUrl"]
    >();
    expectTypeOf<AdminUser["createdAt"]>().toEqualTypeOf<
      AdminUserDto["createdAt"]
    >();
    expectTypeOf<Exclude<AdminUser["lastLoginAt"], undefined>>().toEqualTypeOf<
      AdminUserDto["lastLoginAt"]
    >();
    expectTypeOf<AdminUserDto["lastLoginAt"]>().toMatchTypeOf<
      AdminUser["lastLoginAt"]
    >();
    expectTypeOf<AdminUser["emailVerified"]>().toEqualTypeOf<
      AdminUserDto["emailVerified"]
    >();
    expectTypeOf<AdminUser["role"]>().toMatchTypeOf<AdminUserDto["role"]>();
    expectTypeOf<AdminUser["status"]>().toMatchTypeOf<AdminUserDto["status"]>();
    expectTypeOf<AdminUser["authProvider"]>().toMatchTypeOf<
      AdminUserDto["authProvider"]
    >();

    expectTypeOf<AdminUsersStats>().toEqualTypeOf<AdminUserStatsDto>();
    expectTypeOf<AdminUsersResponse["stats"]>().toEqualTypeOf<
      AdminUserPageDto["stats"]
    >();
    expectTypeOf<AdminUsersResponse["page"]>().toEqualTypeOf<
      AdminUserPageDto["page"]
    >();
    expectTypeOf<AdminUsersResponse["pageSize"]>().toEqualTypeOf<
      AdminUserPageDto["pageSize"]
    >();
    expectTypeOf<AdminUsersResponse["totalItems"]>().toEqualTypeOf<
      AdminUserPageDto["totalItems"]
    >();
    expectTypeOf<AdminUsersResponse["totalPages"]>().toEqualTypeOf<
      AdminUserPageDto["totalPages"]
    >();
    expectTypeOf<
      AdminUsersResponse["items"][number]
    >().toEqualTypeOf<AdminUser>();
    expectTypeOf<
      AdminUserPageDto["items"][number]
    >().toEqualTypeOf<AdminUserDto>();

    expectTypeOf<CreateAdminUserInput>().toMatchTypeOf<CreateAdminUserRequest>();
    expectTypeOf<CreateAdminUserInput["fullName"]>().toEqualTypeOf<
      CreateAdminUserRequest["fullName"]
    >();
    expectTypeOf<CreateAdminUserInput["email"]>().toEqualTypeOf<
      CreateAdminUserRequest["email"]
    >();
    expectTypeOf<CreateAdminUserInput["role"]>().toMatchTypeOf<
      CreateAdminUserRequest["role"]
    >();
    expectTypeOf<CreateAdminUserInput["sendActivationEmail"]>().toEqualTypeOf<
      CreateAdminUserRequest["sendActivationEmail"]
    >();

    expectTypeOf<UpdateAdminUserInput>().toMatchTypeOf<UpdateAdminUserRequest>();
    expectTypeOf<UpdateAdminUserInput["role"]>().toMatchTypeOf<
      UpdateAdminUserRequest["role"]
    >();

    // Compile-time operation assertions for all 8 AdminUsers endpoints
    type ListUsersOp = paths["/api/v1/admin/users"]["get"];
    expectTypeOf<ListUsersOp["parameters"]["query"]>().toEqualTypeOf<
      | {
          page?: number;
          pageSize?: number;
          q?: string;
          role?: string;
          sort?: string;
          status?: string;
        }
      | undefined
    >();
    expectTypeOf<ListUsersOp["requestBody"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<
      ListUsersOp["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<AdminUserPageDto>();

    type CreateUserOp = paths["/api/v1/admin/users"]["post"];
    expectTypeOf<CreateUserOp["parameters"]["query"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<
      CreateUserOp["requestBody"]["content"]["application/json"]
    >().toEqualTypeOf<CreateAdminUserRequest>();
    expectTypeOf<
      CreateUserOp["responses"][201]["content"]["application/json"]
    >().toEqualTypeOf<AdminUserDto>();

    type GetUserOp = paths["/api/v1/admin/users/{id}"]["get"];
    expectTypeOf<GetUserOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<GetUserOp["requestBody"]>().toEqualTypeOf<never | undefined>();
    expectTypeOf<
      GetUserOp["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<AdminUserDto>();

    type UpdateUserOp = paths["/api/v1/admin/users/{id}"]["patch"];
    expectTypeOf<UpdateUserOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<
      UpdateUserOp["requestBody"]["content"]["application/json"]
    >().toEqualTypeOf<UpdateAdminUserRequest>();
    expectTypeOf<
      UpdateUserOp["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<AdminUserDto>();

    type DeleteUserOp = paths["/api/v1/admin/users/{id}"]["delete"];
    expectTypeOf<DeleteUserOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<DeleteUserOp["requestBody"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<DeleteUserOp["responses"][204]["content"]>().toEqualTypeOf<
      never | undefined
    >();

    type LockUserOp = paths["/api/v1/admin/users/{id}/lock"]["post"];
    expectTypeOf<LockUserOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<LockUserOp["requestBody"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<LockUserOp["responses"][204]["content"]>().toEqualTypeOf<
      never | undefined
    >();

    type UnlockUserOp = paths["/api/v1/admin/users/{id}/lock"]["delete"];
    expectTypeOf<UnlockUserOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<UnlockUserOp["requestBody"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<UnlockUserOp["responses"][204]["content"]>().toEqualTypeOf<
      never | undefined
    >();

    type ResetPasswordOp =
      paths["/api/v1/admin/users/{id}/reset-password"]["post"];
    expectTypeOf<ResetPasswordOp["parameters"]["path"]>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<ResetPasswordOp["requestBody"]>().toEqualTypeOf<
      never | undefined
    >();
    expectTypeOf<ResetPasswordOp["responses"][204]["content"]>().toEqualTypeOf<
      never | undefined
    >();

    // Runtime snapshot verification for all 8 AdminUsers operations and $ref targets
    const snapshotPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../docs/contracts/openapi.json",
    );
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as {
      paths: Record<string, Record<string, OpenApiOperation>>;
    };

    const expectedOperations: Array<{
      route: string;
      method: string;
      status: string;
      hasIdParam?: boolean;
      queryParams?: string[];
      requestRef?: string;
      responseRef?: string;
    }> = [
      {
        route: "/api/v1/admin/users",
        method: "get",
        status: "200",
        queryParams: ["page", "pageSize", "q", "role", "status", "sort"],
        responseRef: "#/components/schemas/AdminUserPageDto",
      },
      {
        route: "/api/v1/admin/users",
        method: "post",
        status: "201",
        requestRef: "#/components/schemas/CreateAdminUserRequest",
        responseRef: "#/components/schemas/AdminUserDto",
      },
      {
        route: "/api/v1/admin/users/{id}",
        method: "get",
        status: "200",
        hasIdParam: true,
        responseRef: "#/components/schemas/AdminUserDto",
      },
      {
        route: "/api/v1/admin/users/{id}",
        method: "patch",
        status: "200",
        hasIdParam: true,
        requestRef: "#/components/schemas/UpdateAdminUserRequest",
        responseRef: "#/components/schemas/AdminUserDto",
      },
      {
        route: "/api/v1/admin/users/{id}",
        method: "delete",
        status: "204",
        hasIdParam: true,
      },
      {
        route: "/api/v1/admin/users/{id}/lock",
        method: "post",
        status: "204",
        hasIdParam: true,
      },
      {
        route: "/api/v1/admin/users/{id}/lock",
        method: "delete",
        status: "204",
        hasIdParam: true,
      },
      {
        route: "/api/v1/admin/users/{id}/reset-password",
        method: "post",
        status: "204",
        hasIdParam: true,
      },
    ];

    expect(expectedOperations).toHaveLength(8);
    for (const spec of expectedOperations) {
      const operation = snapshot.paths[spec.route]?.[spec.method];
      expect(operation).toBeDefined();

      if (spec.queryParams) {
        const names = (operation?.parameters ?? [])
          .filter((param) => param.in === "query")
          .map((param) => param.name);
        expect(names).toEqual(spec.queryParams);
      }

      if (spec.hasIdParam) {
        expect(operation?.parameters).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: "id",
              in: "path",
              required: true,
            }),
          ]),
        );
      }

      if (spec.requestRef) {
        expect(
          operation?.requestBody?.content?.["application/json"]?.schema?.$ref,
        ).toBe(spec.requestRef);
      } else {
        expect(operation?.requestBody).toBeUndefined();
      }

      const response = operation?.responses?.[spec.status];
      expect(response).toBeDefined();
      if (spec.responseRef) {
        expect(response?.content?.["application/json"]?.schema?.$ref).toBe(
          spec.responseRef,
        );
      } else {
        expect(response?.content).toBeUndefined();
      }
    }
  });
});
