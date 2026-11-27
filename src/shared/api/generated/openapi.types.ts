export interface paths {
    "/api/v1/admin/exam-media/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamMediaAssetDto"];
                        "text/json": components["schemas"]["ExamMediaAssetDto"];
                        "text/plain": components["schemas"]["ExamMediaAssetDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    status?: components["schemas"]["ExamRevisionStatus"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamPageDto"];
                        "text/json": components["schemas"]["ExamPageDto"];
                        "text/plain": components["schemas"]["ExamPageDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateExamRequest"];
                    "application/json": components["schemas"]["CreateExamRequest"];
                    "text/json": components["schemas"]["CreateExamRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamDraftResponse"];
                        "text/json": components["schemas"]["ExamDraftResponse"];
                        "text/plain": components["schemas"]["ExamDraftResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ForkExamRevisionRequest"];
                    "application/json": components["schemas"]["ForkExamRevisionRequest"];
                    "text/json": components["schemas"]["ForkExamRevisionRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamDraftResponse"];
                        "text/json": components["schemas"]["ExamDraftResponse"];
                        "text/plain": components["schemas"]["ExamDraftResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamRevisionDetailDto"];
                        "text/json": components["schemas"]["ExamRevisionDetailDto"];
                        "text/plain": components["schemas"]["ExamRevisionDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/blocks/{blockKey}/contexts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    blockKey: string;
                    examId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ReplaceExamContextBlocksRequest"];
                    "application/json": components["schemas"]["ReplaceExamContextBlocksRequest"];
                    "text/json": components["schemas"]["ReplaceExamContextBlocksRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/media-upload-intents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateMediaUploadIntentRequest"];
                    "application/json": components["schemas"]["CreateMediaUploadIntentRequest"];
                    "text/json": components["schemas"]["CreateMediaUploadIntentRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamMediaUploadIntentDto"];
                        "text/json": components["schemas"]["ExamMediaUploadIntentDto"];
                        "text/plain": components["schemas"]["ExamMediaUploadIntentDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/media-upload-intents/{intentId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    intentId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamMediaAssetDto"];
                        "text/json": components["schemas"]["ExamMediaAssetDto"];
                        "text/plain": components["schemas"]["ExamMediaAssetDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamDraftResponse"];
                        "text/json": components["schemas"]["ExamDraftResponse"];
                        "text/plain": components["schemas"]["ExamDraftResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/questions/{questionNumber}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    questionNumber: number;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateExamQuestionRequest"];
                    "application/json": components["schemas"]["UpdateExamQuestionRequest"];
                    "text/json": components["schemas"]["UpdateExamQuestionRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/{examId}/revisions/{revisionId}/score-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                    revisionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateExamScoreProfileRequest"];
                    "application/json": components["schemas"]["UpdateExamScoreProfileRequest"];
                    "text/json": components["schemas"]["UpdateExamScoreProfileRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamDraftResponse"];
                        "text/json": components["schemas"]["ExamDraftResponse"];
                        "text/plain": components["schemas"]["ExamDraftResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/exams/import-template": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": unknown;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/articles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    categoryId?: string;
                    pageNumber?: number;
                    pageSize?: number;
                    q?: string;
                    skill?: string;
                    sort?: string;
                    status?: string;
                    tag?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticlePageDto"];
                        "text/json": components["schemas"]["KnowledgeArticlePageDto"];
                        "text/plain": components["schemas"]["KnowledgeArticlePageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["KnowledgeArticleInput"];
                    "application/json": components["schemas"]["KnowledgeArticleInput"];
                    "text/json": components["schemas"]["KnowledgeArticleInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/articles/{articleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedKnowledgeArticleRequest"];
                    "application/json": components["schemas"]["VersionedKnowledgeArticleRequest"];
                    "text/json": components["schemas"]["VersionedKnowledgeArticleRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/articles/{articleId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["KnowledgeVersionRequest"];
                    "application/json": components["schemas"]["KnowledgeVersionRequest"];
                    "text/json": components["schemas"]["KnowledgeVersionRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/articles/{articleId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["KnowledgeVersionRequest"];
                    "application/json": components["schemas"]["KnowledgeVersionRequest"];
                    "text/json": components["schemas"]["KnowledgeVersionRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/articles/{articleId}/unpublish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["KnowledgeVersionRequest"];
                    "application/json": components["schemas"]["KnowledgeVersionRequest"];
                    "text/json": components["schemas"]["KnowledgeVersionRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    hasArticles?: boolean;
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    sort?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeCategoryPageDto"];
                        "text/json": components["schemas"]["KnowledgeCategoryPageDto"];
                        "text/plain": components["schemas"]["KnowledgeCategoryPageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["KnowledgeCategoryInput"];
                    "application/json": components["schemas"]["KnowledgeCategoryInput"];
                    "text/json": components["schemas"]["KnowledgeCategoryInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeCategoryDto"];
                        "text/json": components["schemas"]["KnowledgeCategoryDto"];
                        "text/plain": components["schemas"]["KnowledgeCategoryDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/categories/{categoryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    categoryId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedKnowledgeCategoryRequest"];
                    "application/json": components["schemas"]["VersionedKnowledgeCategoryRequest"];
                    "text/json": components["schemas"]["VersionedKnowledgeCategoryRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeCategoryDto"];
                        "text/json": components["schemas"]["KnowledgeCategoryDto"];
                        "text/plain": components["schemas"]["KnowledgeCategoryDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    categoryId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    sort?: string;
                    unusedOnly?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeMediaAssetPageDto"];
                        "text/json": components["schemas"]["KnowledgeMediaAssetPageDto"];
                        "text/plain": components["schemas"]["KnowledgeMediaAssetPageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/media/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeMediaAssetDto"];
                        "text/json": components["schemas"]["KnowledgeMediaAssetDto"];
                        "text/plain": components["schemas"]["KnowledgeMediaAssetDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Payload Too Large */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/knowledge/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    sort?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeTagPageDto"];
                        "text/json": components["schemas"]["KnowledgeTagPageDto"];
                        "text/plain": components["schemas"]["KnowledgeTagPageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/lr-exercise-bank/parts/{part}/imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrExerciseImportResultDto"];
                        "text/json": components["schemas"]["LrExerciseImportResultDto"];
                        "text/plain": components["schemas"]["LrExerciseImportResultDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/lr-exercise-bank/parts/{part}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    difficulty?: string;
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    status?: string;
                };
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrExerciseItemPageDto"];
                        "text/json": components["schemas"]["LrExerciseItemPageDto"];
                        "text/plain": components["schemas"]["LrExerciseItemPageDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LrExerciseItemInput"];
                    "application/json": components["schemas"]["LrExerciseItemInput"];
                    "text/json": components["schemas"]["LrExerciseItemInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrExerciseItemDto"];
                        "text/json": components["schemas"]["LrExerciseItemDto"];
                        "text/plain": components["schemas"]["LrExerciseItemDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/lr-exercise-bank/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrExerciseBankSummaryDto"];
                        "text/json": components["schemas"]["LrExerciseBankSummaryDto"];
                        "text/plain": components["schemas"]["LrExerciseBankSummaryDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/lr-exercise-bank/templates/{part}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": unknown;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/score-profiles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ScoreProfileResponse"][];
                        "text/json": components["schemas"]["ScoreProfileResponse"][];
                        "text/plain": components["schemas"]["ScoreProfileResponse"][];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateScoreProfileRequest"];
                    "application/json": components["schemas"]["CreateScoreProfileRequest"];
                    "text/json": components["schemas"]["CreateScoreProfileRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ScoreProfileResponse"];
                        "text/json": components["schemas"]["ScoreProfileResponse"];
                        "text/plain": components["schemas"]["ScoreProfileResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    difficulty?: string;
                    pageNumber?: number;
                    pageSize?: number;
                    part?: number;
                    query?: string;
                    status?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPageDtoOfSpeakingExerciseDto"];
                        "text/json": components["schemas"]["SpeakingPageDtoOfSpeakingExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingPageDtoOfSpeakingExerciseDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["SpeakingExerciseInput"];
                    "application/json": components["schemas"]["SpeakingExerciseInput"];
                    "text/json": components["schemas"]["SpeakingExerciseInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingExerciseDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/exercises/{exerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingExerciseDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedSpeakingExerciseRequest"];
                    "application/json": components["schemas"]["VersionedSpeakingExerciseRequest"];
                    "text/json": components["schemas"]["VersionedSpeakingExerciseRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/json": components["schemas"]["SpeakingExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingExerciseDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/media/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        file?: components["schemas"]["IFormFile"];
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingImageDto"];
                        "text/json": components["schemas"]["SpeakingImageDto"];
                        "text/plain": components["schemas"]["SpeakingImageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Payload Too Large */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAdminSummaryDto"];
                        "text/json": components["schemas"]["SpeakingAdminSummaryDto"];
                        "text/plain": components["schemas"]["SpeakingAdminSummaryDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    status?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPageDtoOfSpeakingTestListItemDto"];
                        "text/json": components["schemas"]["SpeakingPageDtoOfSpeakingTestListItemDto"];
                        "text/plain": components["schemas"]["SpeakingPageDtoOfSpeakingTestListItemDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["SpeakingTestInput"];
                    "application/json": components["schemas"]["SpeakingTestInput"];
                    "text/json": components["schemas"]["SpeakingTestInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/plain": components["schemas"]["SpeakingTestDetailDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/tests/{testId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/plain": components["schemas"]["SpeakingTestDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedSpeakingTestRequest"];
                    "application/json": components["schemas"]["VersionedSpeakingTestRequest"];
                    "text/json": components["schemas"]["VersionedSpeakingTestRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/plain": components["schemas"]["SpeakingTestDetailDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/tests/{testId}/clone": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CloneSpeakingTestRequest"];
                    "application/json": components["schemas"]["CloneSpeakingTestRequest"];
                    "text/json": components["schemas"]["CloneSpeakingTestRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/plain": components["schemas"]["SpeakingTestDetailDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/speaking/tests/{testId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedSpeakingPublishRequest"];
                    "application/json": components["schemas"]["VersionedSpeakingPublishRequest"];
                    "text/json": components["schemas"]["VersionedSpeakingPublishRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/json": components["schemas"]["SpeakingTestDetailDto"];
                        "text/plain": components["schemas"]["SpeakingTestDetailDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unprocessable Entity */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    page?: number;
                    pageSize?: number;
                    q?: string;
                    role?: string;
                    sort?: string;
                    status?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AdminUserPageDto"];
                        "text/json": components["schemas"]["AdminUserPageDto"];
                        "text/plain": components["schemas"]["AdminUserPageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateAdminUserRequest"];
                    "application/json": components["schemas"]["CreateAdminUserRequest"];
                    "text/json": components["schemas"]["CreateAdminUserRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AdminUserDto"];
                        "text/json": components["schemas"]["AdminUserDto"];
                        "text/plain": components["schemas"]["AdminUserDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AdminUserDto"];
                        "text/json": components["schemas"]["AdminUserDto"];
                        "text/plain": components["schemas"]["AdminUserDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateAdminUserRequest"];
                    "application/json": components["schemas"]["UpdateAdminUserRequest"];
                    "text/json": components["schemas"]["UpdateAdminUserRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AdminUserDto"];
                        "text/json": components["schemas"]["AdminUserDto"];
                        "text/plain": components["schemas"]["AdminUserDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/users/{id}/lock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{id}/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/evaluations/{attemptId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    difficulty?: string;
                    pageNumber?: number;
                    pageSize?: number;
                    part?: number;
                    query?: string;
                    status?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingExercisePageDto"];
                        "text/json": components["schemas"]["WritingExercisePageDto"];
                        "text/plain": components["schemas"]["WritingExercisePageDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["WritingExerciseInput"];
                    "application/json": components["schemas"]["WritingExerciseInput"];
                    "text/json": components["schemas"]["WritingExerciseInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingExerciseDto"];
                        "text/json": components["schemas"]["WritingExerciseDto"];
                        "text/plain": components["schemas"]["WritingExerciseDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/exercises/{exerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingExerciseDto"];
                        "text/json": components["schemas"]["WritingExerciseDto"];
                        "text/plain": components["schemas"]["WritingExerciseDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedWritingExerciseRequest"];
                    "application/json": components["schemas"]["VersionedWritingExerciseRequest"];
                    "text/json": components["schemas"]["VersionedWritingExerciseRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingExerciseDto"];
                        "text/json": components["schemas"]["WritingExerciseDto"];
                        "text/plain": components["schemas"]["WritingExerciseDto"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/exercises/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    part?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ImportWritingItemsResponse"];
                        "text/json": components["schemas"]["ImportWritingItemsResponse"];
                        "text/plain": components["schemas"]["ImportWritingItemsResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/exercises/imports/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    part?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingExerciseImportPreviewDto"];
                        "text/json": components["schemas"]["WritingExerciseImportPreviewDto"];
                        "text/plain": components["schemas"]["WritingExerciseImportPreviewDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/media/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingMediaAssetDto"];
                        "text/json": components["schemas"]["WritingMediaAssetDto"];
                        "text/plain": components["schemas"]["WritingMediaAssetDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                    status?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestPageDto"];
                        "text/json": components["schemas"]["WritingTestPageDto"];
                        "text/plain": components["schemas"]["WritingTestPageDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["WritingTestInput"];
                    "application/json": components["schemas"]["WritingTestInput"];
                    "text/json": components["schemas"]["WritingTestInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/{testId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedWritingTestRequest"];
                    "application/json": components["schemas"]["VersionedWritingTestRequest"];
                    "text/json": components["schemas"]["VersionedWritingTestRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/{testId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedRequest"];
                    "application/json": components["schemas"]["VersionedRequest"];
                    "text/json": components["schemas"]["VersionedRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/{testId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedRequest"];
                    "application/json": components["schemas"]["VersionedRequest"];
                    "text/json": components["schemas"]["VersionedRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/{testId}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VersionedRequest"];
                    "application/json": components["schemas"]["VersionedRequest"];
                    "text/json": components["schemas"]["VersionedRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestDto"];
                        "text/json": components["schemas"]["WritingTestDto"];
                        "text/plain": components["schemas"]["WritingTestDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/import-template": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writing/tests/imports/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingTestImportPreviewDto"];
                        "text/json": components["schemas"]["WritingTestImportPreviewDto"];
                        "text/plain": components["schemas"]["WritingTestImportPreviewDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RequestPasswordResetCommand"];
                    "application/json": components["schemas"]["RequestPasswordResetCommand"];
                    "text/json": components["schemas"]["RequestPasswordResetCommand"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LoginWithGoogleCommand"];
                    "application/json": components["schemas"]["LoginWithGoogleCommand"];
                    "text/json": components["schemas"]["LoginWithGoogleCommand"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthenticationResponse"];
                        "text/json": components["schemas"]["AuthenticationResponse"];
                        "text/plain": components["schemas"]["AuthenticationResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LoginCommand"];
                    "application/json": components["schemas"]["LoginCommand"];
                    "text/json": components["schemas"]["LoginCommand"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthenticationResponse"];
                        "text/json": components["schemas"]["AuthenticationResponse"];
                        "text/plain": components["schemas"]["AuthenticationResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LogoutCommand"];
                    "application/json": components["schemas"]["LogoutCommand"];
                    "text/json": components["schemas"]["LogoutCommand"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RefreshSessionCommand"];
                    "application/json": components["schemas"]["RefreshSessionCommand"];
                    "text/json": components["schemas"]["RefreshSessionCommand"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthenticationResponse"];
                        "text/json": components["schemas"]["AuthenticationResponse"];
                        "text/plain": components["schemas"]["AuthenticationResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RegisterCommand"];
                    "application/json": components["schemas"]["RegisterCommand"];
                    "text/json": components["schemas"]["RegisterCommand"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/resend-verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ResendEmailVerificationCommand"];
                    "application/json": components["schemas"]["ResendEmailVerificationCommand"];
                    "text/json": components["schemas"]["ResendEmailVerificationCommand"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ResetPasswordCommand"];
                    "application/json": components["schemas"]["ResetPasswordCommand"];
                    "text/json": components["schemas"]["ResetPasswordCommand"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VerifyEmailCommand"];
                    "application/json": components["schemas"]["VerifyEmailCommand"];
                    "text/json": components["schemas"]["VerifyEmailCommand"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify-password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["VerifyPasswordResetCommand"];
                    "application/json": components["schemas"]["VerifyPasswordResetCommand"];
                    "text/json": components["schemas"]["VerifyPasswordResetCommand"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PasswordResetVerificationResponse"];
                        "text/json": components["schemas"]["PasswordResetVerificationResponse"];
                        "text/plain": components["schemas"]["PasswordResetVerificationResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/plain": components["schemas"]["ExamAttemptSheetDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/abandon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/answers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["SaveAttemptAnswerInput"][];
                    "application/json": components["schemas"]["SaveAttemptAnswerInput"][];
                    "text/json": components["schemas"]["SaveAttemptAnswerInput"][];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/audio/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptMediaUrlDto"];
                        "text/json": components["schemas"]["ExamAttemptMediaUrlDto"];
                        "text/plain": components["schemas"]["ExamAttemptMediaUrlDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/images/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptMediaUrlDto"];
                        "text/json": components["schemas"]["ExamAttemptMediaUrlDto"];
                        "text/plain": components["schemas"]["ExamAttemptMediaUrlDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/listening-audio-urls": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptListeningPlaylistDto"];
                        "text/json": components["schemas"]["ExamAttemptListeningPlaylistDto"];
                        "text/plain": components["schemas"]["ExamAttemptListeningPlaylistDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/questions/{questionId}/flag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                    questionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ToggleQuestionFlagInput"];
                    "application/json": components["schemas"]["ToggleQuestionFlagInput"];
                    "text/json": components["schemas"]["ToggleQuestionFlagInput"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptResultDto"];
                        "text/json": components["schemas"]["ExamAttemptResultDto"];
                        "text/plain": components["schemas"]["ExamAttemptResultDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    filter?: components["schemas"]["ExamReviewFilter"];
                };
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptReviewDto"];
                        "text/json": components["schemas"]["ExamAttemptReviewDto"];
                        "text/plain": components["schemas"]["ExamAttemptReviewDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/start-reading": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/plain": components["schemas"]["ExamAttemptSheetDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/{attemptId}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptResultDto"];
                        "text/json": components["schemas"]["ExamAttemptResultDto"];
                        "text/plain": components["schemas"]["ExamAttemptResultDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exam-attempts/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    examId?: string;
                    pageIndex?: number;
                    pageSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptHistoryPagedDto"];
                        "text/json": components["schemas"]["ExamAttemptHistoryPagedDto"];
                        "text/plain": components["schemas"]["ExamAttemptHistoryPagedDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exams/{examId}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/plain": components["schemas"]["ExamAttemptSheetDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exams/{examId}/current-attempt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/json": components["schemas"]["ExamAttemptSheetDto"];
                        "text/plain": components["schemas"]["ExamAttemptSheetDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exams/{examId}/lr-overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    examId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrExamOverviewDto"];
                        "text/json": components["schemas"]["LrExamOverviewDto"];
                        "text/plain": components["schemas"]["LrExamOverviewDto"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exams/lr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PublishedLrExamDto"][];
                        "text/json": components["schemas"]["PublishedLrExamDto"][];
                        "text/plain": components["schemas"]["PublishedLrExamDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/cards/{cardId}/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    cardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpsertFlashcardProgressRequest"];
                    "application/json": components["schemas"]["UpsertFlashcardProgressRequest"];
                    "text/json": components["schemas"]["UpsertFlashcardProgressRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CardProgressDto"];
                        "text/json": components["schemas"]["CardProgressDto"];
                        "text/plain": components["schemas"]["CardProgressDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["FlashcardWorkspaceDto"];
                        "text/json": components["schemas"]["FlashcardWorkspaceDto"];
                        "text/plain": components["schemas"]["FlashcardWorkspaceDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateFlashcardDeckRequest"];
                    "application/json": components["schemas"]["CreateFlashcardDeckRequest"];
                    "text/json": components["schemas"]["CreateFlashcardDeckRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["FlashcardDeckDto"];
                        "text/json": components["schemas"]["FlashcardDeckDto"];
                        "text/plain": components["schemas"]["FlashcardDeckDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks/{deckId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    deckId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks/{deckId}/cards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    deckId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateFlashcardCardRequest"];
                    "application/json": components["schemas"]["CreateFlashcardCardRequest"];
                    "text/json": components["schemas"]["CreateFlashcardCardRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["FlashcardCardDto"];
                        "text/json": components["schemas"]["FlashcardCardDto"];
                        "text/plain": components["schemas"]["FlashcardCardDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks/{deckId}/match-records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    deckId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RecordFlashcardMatchRequest"];
                    "application/json": components["schemas"]["RecordFlashcardMatchRequest"];
                    "text/json": components["schemas"]["RecordFlashcardMatchRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MatchRecordDto"];
                        "text/json": components["schemas"]["MatchRecordDto"];
                        "text/plain": components["schemas"]["MatchRecordDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks/{deckId}/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    deckId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/flashcards/decks/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["FlashcardDeckDto"];
                        "text/json": components["schemas"]["FlashcardDeckDto"];
                        "text/plain": components["schemas"]["FlashcardDeckDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/articles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    categoryId?: string;
                    pageNumber?: number;
                    pageSize?: number;
                    q?: string;
                    skill?: string;
                    sort?: string;
                    tag?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticlePageDto"];
                        "text/json": components["schemas"]["KnowledgeArticlePageDto"];
                        "text/plain": components["schemas"]["KnowledgeArticlePageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/articles/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/json": components["schemas"]["KnowledgeArticleDetailDto"];
                        "text/plain": components["schemas"]["KnowledgeArticleDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/articles/{slug}/related": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeArticleSummaryDto"][];
                        "text/json": components["schemas"]["KnowledgeArticleSummaryDto"][];
                        "text/plain": components["schemas"]["KnowledgeArticleSummaryDto"][];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KnowledgeCategoryDto"][];
                        "text/json": components["schemas"]["KnowledgeCategoryDto"][];
                        "text/plain": components["schemas"]["KnowledgeCategoryDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/saved": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    articleId?: string;
                    pageNumber?: number;
                    pageSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SavedKnowledgeArticlePage"];
                        "text/json": components["schemas"]["SavedKnowledgeArticlePage"];
                        "text/plain": components["schemas"]["SavedKnowledgeArticlePage"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/saved/{articleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    articleId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lr-practice/items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrPracticeDetailDto"];
                        "text/json": components["schemas"]["LrPracticeDetailDto"];
                        "text/plain": components["schemas"]["LrPracticeDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lr-practice/items/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LrPracticeSubmitRequest"];
                    "application/json": components["schemas"]["LrPracticeSubmitRequest"];
                    "text/json": components["schemas"]["LrPracticeSubmitRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrPracticeSubmitResultDto"];
                        "text/json": components["schemas"]["LrPracticeSubmitResultDto"];
                        "text/plain": components["schemas"]["LrPracticeSubmitResultDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lr-practice/parts/{part}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                };
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrPracticeItemPageDto"];
                        "text/json": components["schemas"]["LrPracticeItemPageDto"];
                        "text/plain": components["schemas"]["LrPracticeItemPageDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lr-practice/parts/{part}/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    part: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LrPracticeItemStatisticsDto"][];
                        "text/json": components["schemas"]["LrPracticeItemStatisticsDto"][];
                        "text/plain": components["schemas"]["LrPracticeItemStatisticsDto"][];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateProfileRequest"];
                    "application/json": components["schemas"]["UpdateProfileRequest"];
                    "text/json": components["schemas"]["UpdateProfileRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateProfileNameRequest"];
                    "application/json": components["schemas"]["UpdateProfileNameRequest"];
                    "text/json": components["schemas"]["UpdateProfileNameRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/profile/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/profile/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ChangeProfilePasswordRequest"];
                    "application/json": components["schemas"]["ChangeProfilePasswordRequest"];
                    "text/json": components["schemas"]["ChangeProfilePasswordRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                    "application/json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                    "text/json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pronunciation/assessments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        file?: components["schemas"]["IFormFile"];
                    } & {
                        referenceText?: string;
                    } & {
                        locale?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PronunciationAssessmentDto"];
                        "text/json": components["schemas"]["PronunciationAssessmentDto"];
                        "text/plain": components["schemas"]["PronunciationAssessmentDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Payload Too Large */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unprocessable Entity */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Bad Gateway */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Service Unavailable */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Gateway Timeout */
                504: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPageDtoOfSpeakingAttemptSummaryDto"];
                        "text/json": components["schemas"]["SpeakingPageDtoOfSpeakingAttemptSummaryDto"];
                        "text/plain": components["schemas"]["SpeakingPageDtoOfSpeakingAttemptSummaryDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["StartSpeakingAttemptInput"];
                    "application/json": components["schemas"]["StartSpeakingAttemptInput"];
                    "text/json": components["schemas"]["StartSpeakingAttemptInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts/{attemptId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts/{attemptId}/evaluation-consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["GrantSpeakingEvaluationConsentInput"];
                    "application/json": components["schemas"]["GrantSpeakingEvaluationConsentInput"];
                    "text/json": components["schemas"]["GrantSpeakingEvaluationConsentInput"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts/{attemptId}/next": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts/{attemptId}/recordings/{position}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                    position: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                    position: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        file?: components["schemas"]["IFormFile"];
                    } & {
                        /** Format: int32 */
                        durationSeconds?: number;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Payload Too Large */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/attempts/{attemptId}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/json": components["schemas"]["SpeakingAttemptDto"];
                        "text/plain": components["schemas"]["SpeakingAttemptDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/evaluation-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingEvaluationAvailabilityDto"];
                        "text/json": components["schemas"]["SpeakingEvaluationAvailabilityDto"];
                        "text/plain": components["schemas"]["SpeakingEvaluationAvailabilityDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    part?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPageDtoOfSpeakingPublicExerciseDto"];
                        "text/json": components["schemas"]["SpeakingPageDtoOfSpeakingPublicExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingPageDtoOfSpeakingPublicExerciseDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/exercises/{exerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPublicExerciseDto"];
                        "text/json": components["schemas"]["SpeakingPublicExerciseDto"];
                        "text/plain": components["schemas"]["SpeakingPublicExerciseDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPageDtoOfSpeakingPublicTestDto"];
                        "text/json": components["schemas"]["SpeakingPageDtoOfSpeakingPublicTestDto"];
                        "text/plain": components["schemas"]["SpeakingPageDtoOfSpeakingPublicTestDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/speaking/tests/{testId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpeakingPublicTestDto"];
                        "text/json": components["schemas"]["SpeakingPublicTestDto"];
                        "text/plain": components["schemas"]["SpeakingPublicTestDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/system/ping": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PingResponse"];
                        "text/json": components["schemas"]["PingResponse"];
                        "text/plain": components["schemas"]["PingResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateProfileRequest"];
                    "application/json": components["schemas"]["UpdateProfileRequest"];
                    "text/json": components["schemas"]["UpdateProfileRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateProfileNameRequest"];
                    "application/json": components["schemas"]["UpdateProfileNameRequest"];
                    "text/json": components["schemas"]["UpdateProfileNameRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/users/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ContentDisposition?: string;
                        ContentType?: string;
                        FileName?: string;
                        Headers?: {
                            [key: string]: string[];
                        };
                        /** Format: int64 */
                        Length?: number;
                        Name?: string;
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProfileDto"];
                        "text/json": components["schemas"]["ProfileDto"];
                        "text/plain": components["schemas"]["ProfileDto"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ChangeProfilePasswordRequest"];
                    "application/json": components["schemas"]["ChangeProfilePasswordRequest"];
                    "text/json": components["schemas"]["ChangeProfilePasswordRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                    "application/json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                    "text/json": components["schemas"]["ChangeProfilePasswordFrontendRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationProblemDetails"];
                        "text/json": components["schemas"]["ValidationProblemDetails"];
                        "text/plain": components["schemas"]["ValidationProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptPageDto"];
                        "text/json": components["schemas"]["WritingAttemptPageDto"];
                        "text/plain": components["schemas"]["WritingAttemptPageDto"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["StartWritingAttemptInput"];
                    "application/json": components["schemas"]["StartWritingAttemptInput"];
                    "text/json": components["schemas"]["StartWritingAttemptInput"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}/answers/{position}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                    position: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["SaveWritingAnswerInput"];
                    "application/json": components["schemas"]["SaveWritingAnswerInput"];
                    "text/json": components["schemas"]["SaveWritingAnswerInput"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}/evaluation-consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["GrantWritingEvaluationConsentInput"];
                    "application/json": components["schemas"]["GrantWritingEvaluationConsentInput"];
                    "text/json": components["schemas"]["GrantWritingEvaluationConsentInput"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}/next": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/attempts/{attemptId}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    attemptId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    part?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingPracticeExercisePageDto"];
                        "text/json": components["schemas"]["WritingPracticeExercisePageDto"];
                        "text/plain": components["schemas"]["WritingPracticeExercisePageDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/exercises/{exerciseId}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    exerciseId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingAttemptDto"];
                        "text/json": components["schemas"]["WritingAttemptDto"];
                        "text/plain": components["schemas"]["WritingAttemptDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/media/{assetId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    assetId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    pageNumber?: number;
                    pageSize?: number;
                    query?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingPublicTestPageDto"];
                        "text/json": components["schemas"]["WritingPublicTestPageDto"];
                        "text/plain": components["schemas"]["WritingPublicTestPageDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/writing/tests/{testId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    testId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WritingPublicTestDto"];
                        "text/json": components["schemas"]["WritingPublicTestDto"];
                        "text/plain": components["schemas"]["WritingPublicTestDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AdminExamContextBlockDto: {
            altText: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            imageRequired: boolean;
            /** Format: int32 */
            ordinal: number;
            text: null | string;
            type: components["schemas"]["ExamContextType"];
        };
        AdminUserDto: {
            authProvider: string;
            avatarUrl: null | string;
            /** Format: date-time */
            createdAt: string;
            email: string;
            emailVerified: boolean;
            fullName: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            lastLoginAt: null | string;
            role: string;
            status: string;
        };
        AdminUserPageDto: {
            items: components["schemas"]["AdminUserDto"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            stats: components["schemas"]["AdminUserStatsDto"];
            /** Format: int32 */
            totalItems: number;
            /** Format: int32 */
            totalPages: number;
        };
        AdminUserStatsDto: {
            /** Format: int32 */
            activeUsers: number;
            /** Format: int32 */
            lockedUsers: number;
            /** Format: int32 */
            pendingUsers: number;
            /** Format: int32 */
            totalUsers: number;
        };
        AuthenticatedUserResponse: {
            displayName: string;
            email: string;
            /** Format: uuid */
            id: string;
            role: string;
        };
        AuthenticationResponse: {
            accessToken: string;
            /** Format: date-time */
            accessTokenExpiresAtUtc: string;
            refreshToken: string;
            /** Format: date-time */
            refreshTokenExpiresAtUtc: string;
            tokenType: string;
            user: components["schemas"]["AuthenticatedUserResponse"];
        };
        CardProgressDto: {
            /** Format: int32 */
            reviewCount: number;
            starred: boolean;
            status: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ChangeProfilePasswordFrontendRequest: {
            confirmPassword: string;
            currentPassword: string;
            newPassword: string;
        };
        ChangeProfilePasswordRequest: {
            currentPassword: string;
            newPassword: string;
        };
        CloneSpeakingTestRequest: {
            code: null | string;
            title: null | string;
            /** Format: int32 */
            version: number;
        };
        CreateAdminUserRequest: {
            email: string;
            fullName: string;
            role: string;
            /** @default true */
            sendActivationEmail: boolean;
        };
        CreateExamRequest: {
            code: string;
            /** Format: uuid */
            scoreProfileId: string;
            title: string;
        };
        CreateFlashcardCardRequest: {
            collocations: null | string[];
            exampleEn: null | string;
            exampleVi: null | string;
            level: null | string;
            meaningVi: string;
            partOfSpeech: null | string;
            phonetic: null | string;
            term: string;
            toeicPart: null | string;
        };
        CreateFlashcardDeckRequest: {
            cards: components["schemas"]["CreateFlashcardCardRequest"][];
            description: null | string;
            title: string;
        };
        CreateMediaUploadIntentRequest: {
            /** Format: int64 */
            byteSize: number;
            contentType: string;
            /** Format: int32 */
            durationMs?: null | number;
            ownerKey: string;
            ownerKind: components["schemas"]["ExamMediaOwnerKind"];
        };
        CreateScoreProfileRequest: {
            conversions: components["schemas"]["ScoreConversionRequest"][];
            name: string;
        };
        ExamAttemptContextBlockDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            imageAssetId: null | string;
            /** Format: int32 */
            ordinal: number;
            text: null | string;
        };
        ExamAttemptHistoryItemDto: {
            /** Format: uuid */
            attemptId: string;
            /** Format: int32 */
            durationSeconds: null | number;
            examCode: string;
            /** Format: uuid */
            examId: string;
            examTitle: string;
            isTimeExpired: boolean;
            /** Format: int32 */
            listeningScaledScore: null | number;
            /** Format: int32 */
            readingScaledScore: null | number;
            /** Format: date-time */
            startedAtUtc: string;
            status: components["schemas"]["ExamAttemptStatus"];
            /** Format: date-time */
            submittedAtUtc: null | string;
            /** Format: int32 */
            totalScaledScore: null | number;
        };
        ExamAttemptHistoryPagedDto: {
            items: components["schemas"]["ExamAttemptHistoryItemDto"][];
            /** Format: int32 */
            pageIndex: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
        };
        ExamAttemptListeningAudioItemDto: {
            /** Format: uuid */
            audioAssetId: string;
            /** Format: uuid */
            blockId: string;
            /** Format: int32 */
            durationMs: null | number;
            /** Format: date-time */
            expiresAtUtc: string;
            /** Format: int32 */
            firstQuestionNumber: number;
            /** Format: int32 */
            part: number;
            url: string;
        };
        ExamAttemptListeningPlaylistDto: {
            items: components["schemas"]["ExamAttemptListeningAudioItemDto"][];
        };
        ExamAttemptMediaUrlDto: {
            /** Format: date-time */
            expiresAtUtc: string;
            url: string;
        };
        ExamAttemptResultDto: {
            /** Format: uuid */
            attemptId: string;
            /** Format: int32 */
            durationSeconds: number;
            examCode: string;
            /** Format: uuid */
            examId: string;
            examTitle: string;
            isTimeExpired: boolean;
            /** Format: int32 */
            listeningMaxScaledScore: number;
            /** Format: int32 */
            listeningRawScore: number;
            /** Format: int32 */
            listeningScaledScore: number;
            /** Format: int32 */
            maxScaledScore: number;
            parts: components["schemas"]["PartScoreSummaryDto"][];
            /** Format: int32 */
            readingMaxScaledScore: number;
            /** Format: int32 */
            readingRawScore: number;
            /** Format: int32 */
            readingScaledScore: number;
            /** Format: date-time */
            startedAtUtc: string;
            /** Format: date-time */
            submittedAtUtc: string;
            /** Format: int32 */
            totalCorrect: number;
            /** Format: int32 */
            totalIncorrect: number;
            /** Format: int32 */
            totalScaledScore: number;
            /** Format: int32 */
            totalSkipped: number;
        };
        ExamAttemptReviewBlockDto: {
            /** Format: uuid */
            audioAssetId?: null | string;
            /** Format: int32 */
            audioDurationMs?: null | number;
            contextBlocks: components["schemas"]["ExamAttemptContextBlockDto"][];
            /** Format: int32 */
            firstQuestionNumber: number;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            part: number;
            questions: components["schemas"]["ExamAttemptReviewQuestionDto"][];
        };
        ExamAttemptReviewCountsDto: {
            /** Format: int32 */
            correct: number;
            /** Format: int32 */
            flagged: number;
            /** Format: int32 */
            skipped: number;
            /** Format: int32 */
            wrong: number;
        };
        ExamAttemptReviewDto: {
            /** Format: uuid */
            attemptId: string;
            blocks: components["schemas"]["ExamAttemptReviewBlockDto"][];
            counts: components["schemas"]["ExamAttemptReviewCountsDto"];
            examCode: string;
            /** Format: uuid */
            examId: string;
            examTitle: string;
            isTimeExpired: boolean;
            /** Format: int32 */
            listeningScaledScore: number;
            /** Format: int32 */
            readingScaledScore: number;
            /** Format: int32 */
            totalScaledScore: number;
        };
        ExamAttemptReviewQuestionDto: {
            correctKey: null | string;
            explanation: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            isFlagged: boolean;
            /** Format: int32 */
            number: number;
            optionA: null | string;
            optionB: null | string;
            optionC: null | string;
            optionD: null | string;
            /** Format: int32 */
            part: number;
            /** Format: uuid */
            questionId: string;
            status: string;
            stem: null | string;
            translation: null | string;
            userSelectedKey: null | string;
        };
        ExamAttemptSheetDto: {
            /** Format: uuid */
            attemptId: string;
            blocks: components["schemas"]["ExamBlockSheetDto"][];
            examCode: string;
            /** Format: uuid */
            examId: string;
            examTitle: string;
            phase: string;
            /** Format: date-time */
            readingStartedAtUtc: null | string;
            /** Format: int32 */
            remainingSeconds: number;
            /** Format: date-time */
            startedAtUtc: string;
            /** Format: int32 */
            timeLimitSeconds: number;
            /** Format: int32 */
            totalQuestions: number;
            /** Format: int32 */
            versionNumber: number;
        };
        /** @enum {string} */
        ExamAttemptStatus: "InProgress" | "Completed" | "Abandoned";
        ExamBlockDto: {
            /** Format: uuid */
            audioAssetId: null | string;
            /** Format: int32 */
            audioDurationMs?: null | number;
            contextBlocks: components["schemas"]["AdminExamContextBlockDto"][];
            /** Format: int32 */
            firstQuestionNumber: number;
            key: string;
            /** Format: int32 */
            part: number;
            questions: components["schemas"]["ExamQuestionDto"][];
            type: components["schemas"]["ExamBlockType"];
        };
        ExamBlockSheetDto: {
            /** Format: uuid */
            audioAssetId: null | string;
            /** Format: int32 */
            audioDurationMs?: null | number;
            contextBlocks: components["schemas"]["ExamAttemptContextBlockDto"][];
            /** Format: int32 */
            firstQuestionNumber: number;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            part: number;
            questions: components["schemas"]["ExamQuestionSheetDto"][];
        };
        /** @enum {string} */
        ExamBlockType: "Single" | "Group";
        ExamContextBlockDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            imageAssetId: null | string;
            /** Format: int32 */
            ordinal: number;
            text: null | string;
        };
        ExamContextBlockRequest: {
            altText: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            /** @default false */
            imageRequired: boolean;
            /** Format: int32 */
            ordinal: number;
            text: null | string;
            type: components["schemas"]["ExamContextType"];
        };
        /** @enum {string} */
        ExamContextType: "Text" | "Image";
        ExamDraftResponse: {
            code: string;
            /** Format: uuid */
            examId: string;
            /** Format: int32 */
            questionCount: number;
            /** Format: uuid */
            revisionId: string;
            status: string;
            title: string;
            /** Format: int32 */
            versionNumber: number;
        };
        ExamListItemDto: {
            code: string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: uuid */
            examId: string;
            /** Format: uuid */
            revisionId: string;
            status: components["schemas"]["ExamRevisionStatus"];
            title: string;
            /** Format: int32 */
            versionNumber: number;
        };
        ExamMediaAssetDto: {
            /** Format: int64 */
            byteSize: number;
            contentType: string;
            /** Format: int32 */
            durationMs?: null | number;
            /** Format: uuid */
            id: string;
            kind: string;
        };
        /** @enum {string} */
        ExamMediaOwnerKind: "AudioGroup" | "QuestionImage" | "ContextImage";
        ExamMediaUploadIntentDto: {
            /** Format: date-time */
            expiresAtUtc: string;
            /** Format: uuid */
            intentId: string;
            requiredHeaders: {
                [key: string]: string;
            };
            uploadUrl: string;
        };
        ExamPageDto: {
            hasNextPage?: boolean;
            hasPreviousPage?: boolean;
            items: components["schemas"]["ExamListItemDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        ExamQuestionDto: {
            code: null | string;
            correctKey: null | string;
            explanation: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            imageRequired: boolean;
            /** Format: int32 */
            number: number;
            optionA: null | string;
            optionB: null | string;
            optionC: null | string;
            optionD: null | string;
            stem: null | string;
            translation: null | string;
        };
        ExamQuestionSheetDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            imageAssetId: null | string;
            isFlagged: boolean;
            /** Format: int32 */
            number: number;
            optionA: null | string;
            optionB: null | string;
            optionC: null | string;
            optionD: null | string;
            stem: null | string;
            userSelectedKey: null | string;
        };
        /** @enum {string} */
        ExamReviewFilter: "All" | "Incorrect" | "Flagged";
        ExamRevisionDetailDto: {
            blocks: components["schemas"]["ExamBlockDto"][];
            code: string;
            /** Format: uuid */
            examId: string;
            /** Format: uuid */
            revisionId: string;
            /** Format: uuid */
            scoreProfileId: string;
            status: components["schemas"]["ExamRevisionStatus"];
            title: string;
            /** Format: int32 */
            versionNumber: number;
        };
        /** @enum {string} */
        ExamRevisionStatus: "Draft" | "Published" | "Superseded";
        /** @enum {string} */
        ExamSkill: "Listening" | "Reading";
        FlashcardCardDto: {
            collocations: string[];
            exampleEn: string;
            exampleVi: string;
            /** Format: uuid */
            id: string;
            level: string;
            meaningVi: string;
            partOfSpeech: string;
            phonetic: string;
            term: string;
            toeicPart: string;
        };
        FlashcardDeckDto: {
            cards: components["schemas"]["FlashcardCardDto"][];
            category: string;
            description: string;
            /** Format: int32 */
            estimatedMinutes: number;
            /** Format: uuid */
            id: string;
            isCustom: boolean;
            slug: string;
            targetScore: string;
            title: string;
        };
        FlashcardWorkspaceDto: {
            decks: components["schemas"]["FlashcardDeckDto"][];
            matchRecords: {
                [key: string]: components["schemas"]["MatchRecordDto"];
            };
            progress: {
                [key: string]: components["schemas"]["CardProgressDto"];
            };
        };
        ForkExamRevisionRequest: {
            /** Format: uuid */
            sourceRevisionId: string;
        };
        GrantSpeakingEvaluationConsentInput: {
            accepted: boolean;
        };
        GrantWritingEvaluationConsentInput: {
            accepted: boolean;
        };
        /** Format: binary */
        IFormFile: string;
        ImportWritingItemsResponse: {
            /** Format: int32 */
            importedCount: number;
        };
        JsonElement: unknown;
        KnowledgeArticleDetailDto: {
            /** Format: uuid */
            categoryId: string;
            categoryName: string;
            content: components["schemas"]["JsonElement"];
            coverImageAlt: null | string;
            /** Format: uuid */
            coverImageAssetId: null | string;
            coverImageUrl: null | string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: int32 */
            estimatedReadMinutes: number;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            publishedAtUtc: null | string;
            skill: string;
            slug: string;
            status: string;
            summary: string;
            tags: components["schemas"]["KnowledgeTagDto"][];
            title: string;
            toc: components["schemas"]["KnowledgeTocItemDto"][];
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        KnowledgeArticleInput: {
            /** Format: uuid */
            categoryId: string;
            content: components["schemas"]["JsonElement"];
            coverImageAlt: null | string;
            /** Format: uuid */
            coverImageAssetId: null | string;
            skill: string;
            slug: null | string;
            summary: string;
            tags: null | string[];
            title: string;
        };
        KnowledgeArticlePageDto: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            items: components["schemas"]["KnowledgeArticleSummaryDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        KnowledgeArticleSummaryDto: {
            /** Format: uuid */
            categoryId: string;
            categoryName: string;
            coverImageAlt: null | string;
            /** Format: uuid */
            coverImageAssetId: null | string;
            coverImageUrl: null | string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: int32 */
            estimatedReadMinutes: number;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            publishedAtUtc: null | string;
            skill: string;
            slug: string;
            status: string;
            summary: string;
            tags: components["schemas"]["KnowledgeTagDto"][];
            title: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        KnowledgeCategoryDto: {
            /** Format: int32 */
            articleCount: number;
            /** Format: date-time */
            createdAtUtc: string;
            description: null | string;
            /** Format: int32 */
            displayOrder: number;
            /** Format: uuid */
            id: string;
            name: string;
            slug: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        KnowledgeCategoryInput: {
            description: null | string;
            /**
             * Format: int32
             * @default 0
             */
            displayOrder: number;
            name: string;
            slug: null | string;
        };
        KnowledgeCategoryPageDto: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            items: components["schemas"]["KnowledgeCategoryDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        KnowledgeMediaAssetDto: {
            adminUrl: string;
            /** Format: int64 */
            byteLength: number;
            contentType: string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: uuid */
            id: string;
            originalFileName: string;
        };
        KnowledgeMediaAssetPageDto: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            items: components["schemas"]["KnowledgeMediaAssetSummaryDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        KnowledgeMediaAssetSummaryDto: {
            adminUrl: string;
            /** Format: int64 */
            byteLength: number;
            contentType: string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: uuid */
            id: string;
            originalFileName: string;
            /** Format: int32 */
            usageCount: number;
        };
        KnowledgeTagDto: {
            /** Format: uuid */
            id: string;
            name: string;
            slug: string;
        };
        KnowledgeTagPageDto: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            items: components["schemas"]["KnowledgeTagDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        KnowledgeTocItemDto: {
            id: string;
            /** Format: int32 */
            level: number;
            text: string;
        };
        KnowledgeVersionRequest: {
            /** Format: int32 */
            version: number;
        };
        LoginCommand: {
            email: string;
            password: string;
            /** @default false */
            rememberMe: boolean;
        };
        LoginWithGoogleCommand: {
            credential: string;
            /** @default false */
            rememberMe: boolean;
        };
        LogoutCommand: {
            refreshToken: string;
        };
        LrExamOverviewDto: {
            /** Format: uuid */
            activeAttemptId: null | string;
            code: string;
            /** Format: int32 */
            durationMinutes: number;
            /** Format: uuid */
            examId: string;
            /** Format: int32 */
            listeningQuestions: number;
            /** Format: int32 */
            maxScaledScore: number;
            /** Format: int32 */
            minScaledScore: number;
            /** Format: int32 */
            readingQuestions: number;
            title: string;
            /** Format: int32 */
            totalQuestions: number;
        };
        LrExerciseBankSummaryDto: {
            parts: components["schemas"]["LrExercisePartSummaryDto"][];
            /** Format: int32 */
            totalQuestionCount: number;
            /** Format: date-time */
            updatedAtUtc: null | string;
        };
        LrExerciseImportResultDto: {
            /** Format: int32 */
            createdItemCount: number;
            /** Format: int32 */
            createdQuestionCount: number;
            /** Format: int32 */
            part: number;
            summary: components["schemas"]["LrExerciseBankSummaryDto"];
        };
        LrExerciseItemDto: {
            audioUrl: null | string;
            code: string;
            context: null | string;
            /** Format: date-time */
            createdAtUtc: string;
            difficulty: string;
            /** Format: uuid */
            id: string;
            imageUrl: null | string;
            kind: string;
            /** Format: int32 */
            part: number;
            questions: components["schemas"]["LrExerciseQuestionDto"][];
            status: string;
            topic: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        LrExerciseItemInput: {
            audioUrl: null | string;
            code: string;
            context: null | string;
            difficulty: string;
            imageUrl: null | string;
            questions: components["schemas"]["LrExerciseQuestionInput"][];
            status: string;
            topic: string;
        };
        LrExerciseItemPageDto: {
            items: components["schemas"]["LrExerciseItemDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        LrExercisePartSummaryDto: {
            /** Format: int32 */
            itemCount: number;
            kind: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            questionCount: number;
            /** Format: date-time */
            updatedAtUtc: null | string;
        };
        LrExerciseQuestionDto: {
            code: string;
            correctKey: string;
            explanation: null | string;
            /** Format: uuid */
            id: string;
            optionA: string;
            optionB: string;
            optionC: string;
            optionD: null | string;
            /** Format: int32 */
            ordinal: number;
            prompt: string;
            translation: null | string;
        };
        LrExerciseQuestionInput: {
            code: string;
            correctKey: string;
            explanation: null | string;
            optionA: string;
            optionB: string;
            optionC: string;
            optionD: null | string;
            prompt: string;
            translation: null | string;
        };
        LrPracticeAnswerInput: {
            /** Format: uuid */
            questionId: string;
            selectedKey: null | string;
        };
        LrPracticeDetailDto: {
            audioUrl: null | string;
            code: string;
            context: null | string;
            difficulty: string;
            /** Format: uuid */
            id: string;
            imageUrl: null | string;
            kind: string;
            /** Format: int32 */
            part: number;
            questions: components["schemas"]["LrPracticeQuestionDto"][];
            topic: null | string;
        };
        LrPracticeItemDto: {
            audioUrl: null | string;
            code: string;
            context: null | string;
            difficulty: string;
            /** Format: uuid */
            id: string;
            imageUrl: null | string;
            kind: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            questionCount: number;
            topic: null | string;
        };
        LrPracticeItemPageDto: {
            items: components["schemas"]["LrPracticeItemDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        LrPracticeItemStatisticsDto: {
            /** Format: int32 */
            attemptCount: number;
            /** Format: int32 */
            bestScore: number;
            /** Format: uuid */
            itemId: string;
            /** Format: int32 */
            totalQuestions: number;
        };
        LrPracticeQuestionDto: {
            code: null | string;
            /** Format: uuid */
            id: string;
            optionA: null | string;
            optionB: null | string;
            optionC: null | string;
            optionD: null | string;
            /** Format: int32 */
            ordinal: number;
            prompt: null | string;
        };
        LrPracticeQuestionResultDto: {
            correctKey: string;
            explanation: null | string;
            isCorrect: boolean;
            /** Format: int32 */
            ordinal: number;
            /** Format: uuid */
            questionId: string;
            selectedKey: null | string;
            translation: null | string;
        };
        LrPracticeSubmitRequest: {
            answers: components["schemas"]["LrPracticeAnswerInput"][];
        };
        LrPracticeSubmitResultDto: {
            /** Format: int32 */
            correctCount: number;
            /** Format: int32 */
            incorrectCount: number;
            /** Format: uuid */
            itemId: string;
            questions: components["schemas"]["LrPracticeQuestionResultDto"][];
            /** Format: int32 */
            totalQuestions: number;
        };
        MatchRecordDto: {
            /** Format: int32 */
            bestCombo: number;
            /** Format: int32 */
            bestTimeMs: number;
            /** @default false */
            isNewRecord: boolean;
            /** Format: int32 */
            playCount: number;
            /** Format: date-time */
            updatedAt: string;
        };
        PartScoreSummaryDto: {
            /** Format: int32 */
            correctCount: number;
            /** Format: int32 */
            incorrectCount: number;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            skippedCount: number;
            /** Format: int32 */
            totalQuestions: number;
        };
        PasswordResetVerificationResponse: {
            /** Format: date-time */
            expiresAtUtc: string;
            resetToken: string;
        };
        PingResponse: {
            service: string;
            status: string;
        };
        ProblemDetails: {
            detail?: null | string;
            instance?: null | string;
            /** Format: int32 */
            status?: null | number;
            title?: null | string;
            type?: null | string;
        };
        ProfileDto: {
            avatarUrl: null | string;
            avatarVersion: null | string;
            /** Format: date */
            dateOfBirth: null | string;
            displayName: string;
            email: string;
            hasPassword: boolean;
            /** Format: uuid */
            id: string;
            phone: null | string;
            /** Format: int32 */
            targetScore: null | number;
        };
        PronunciationAssessmentDto: {
            /** Format: double */
            accuracyScore: number;
            /** Format: double */
            completenessScore: number;
            /** Format: double */
            pronunciationScore: number;
            recognitionStatus: string;
            recognizedText: string;
            referenceText: string;
            words: components["schemas"]["PronunciationWordDto"][];
        };
        PronunciationPhonemeCandidateDto: {
            phoneme: string;
            /** Format: double */
            score: number;
        };
        PronunciationPhonemeDto: {
            /** Format: double */
            accuracyScore: number;
            candidates: components["schemas"]["PronunciationPhonemeCandidateDto"][];
            phoneme: string;
        };
        PronunciationWordDto: {
            /** Format: double */
            accuracyScore: number;
            errorType: string;
            phonemes: components["schemas"]["PronunciationPhonemeDto"][];
            word: string;
        };
        PublishedLrExamDto: {
            code: string;
            /** Format: uuid */
            examId: string;
            /** Format: int32 */
            listeningQuestions: number;
            /** Format: date-time */
            publishedAtUtc: string;
            /** Format: int32 */
            readingQuestions: number;
            title: string;
            /** Format: int32 */
            totalQuestions: number;
            /** Format: int32 */
            versionNumber: number;
        };
        RecordFlashcardMatchRequest: {
            /** Format: int32 */
            elapsedMs: number;
            /** Format: int32 */
            maxCombo: number;
        };
        RefreshSessionCommand: {
            refreshToken: string;
        };
        RegisterCommand: {
            displayName: string;
            email: string;
            password: string;
        };
        ReplaceExamContextBlocksRequest: {
            contexts: components["schemas"]["ExamContextBlockRequest"][];
        };
        RequestPasswordResetCommand: {
            email: string;
        };
        ResendEmailVerificationCommand: {
            email: string;
        };
        ResetPasswordCommand: {
            newPassword: string;
            resetToken: string;
        };
        SaveAttemptAnswerInput: {
            isFlagged?: null | boolean;
            /** Format: uuid */
            questionId: string;
            selectedKey: null | string;
        };
        SavedKnowledgeArticle: {
            /** Format: uuid */
            articleId: string;
            available: boolean;
            title: string;
            url: null | string;
        };
        SavedKnowledgeArticlePage: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            items: components["schemas"]["SavedKnowledgeArticle"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages: number;
        };
        SaveWritingAnswerInput: {
            answer: string;
        };
        ScoreConversionRequest: {
            /** Format: int32 */
            rawCorrectCount: number;
            /** Format: int32 */
            scaledScore: number;
            skill: components["schemas"]["ExamSkill"];
        };
        ScoreProfileResponse: {
            /** Format: uuid */
            id: string;
            isComplete: boolean;
            /** Format: int32 */
            mappingCount: number;
            name: string;
        };
        SpeakingAdminSummaryDto: {
            exercises: components["schemas"]["SpeakingExerciseCountsDto"];
            tests: components["schemas"]["SpeakingTestCountsDto"];
        };
        SpeakingAttemptDto: {
            /** Format: date-time */
            createdAtUtc: string;
            currentPhase: null | string;
            /** Format: int32 */
            currentQuestionPosition: null | number;
            evaluation?: null | components["schemas"]["SpeakingEvaluationDto"];
            /** Format: uuid */
            exerciseId: null | string;
            /** Format: uuid */
            id: string;
            mode: string;
            /** Format: date-time */
            phaseEndsAtUtc: null | string;
            questions: components["schemas"]["SpeakingAttemptQuestionDto"][];
            reviewQuestions: components["schemas"]["SpeakingReviewQuestionDto"][];
            /** Format: date-time */
            serverNowUtc: string;
            status: string;
            /** Format: date-time */
            submittedAtUtc: null | string;
            testCode: string;
            /** Format: uuid */
            testId: null | string;
            testTitle: string;
        };
        SpeakingAttemptQuestionDto: {
            content: components["schemas"]["SpeakingContentDto"];
            /** Format: date-time */
            lockedAtUtc: null | string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            position: number;
            /** Format: int32 */
            preparationSeconds: number;
            /** Format: int32 */
            questionIndex: number;
            /** Format: int32 */
            readingSeconds: number;
            recording: null | components["schemas"]["SpeakingRecordingDto"];
            /** Format: int32 */
            responseSeconds: number;
        };
        SpeakingAttemptSummaryDto: {
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: int32 */
            estimatedScore?: null | number;
            evaluationStatus?: null | string;
            /** Format: uuid */
            exerciseId: null | string;
            /** Format: uuid */
            id: string;
            mode: string;
            /** Format: int32 */
            questionCount: number;
            /** Format: int32 */
            recordedCount: number;
            status: string;
            /** Format: date-time */
            submittedAtUtc: null | string;
            testCode: string;
            /** Format: uuid */
            testId: null | string;
            testTitle: string;
            /** Format: date-time */
            updatedAtUtc: string;
        };
        SpeakingContentDto: {
            callerIntro?: null | string;
            context?: null | string;
            documentRows?: null | components["schemas"]["SpeakingInfoRowDto"][];
            documentTitle?: null | string;
            imageAlt?: null | string;
            /** Format: uuid */
            imageAssetId?: null | string;
            /** Format: int32 */
            part: number;
            passage?: null | string;
            prompt?: null | string;
            questions?: null | string[];
        };
        SpeakingEvaluationAvailabilityDto: {
            available: boolean;
        };
        SpeakingEvaluationDto: {
            /** Format: date-time */
            completedAtUtc: null | string;
            /** Format: date-time */
            consentAcceptedAtUtc: string;
            /** Format: int32 */
            estimatedScore: null | number;
            failureMessage: null | string;
            improvements: string[];
            items: components["schemas"]["SpeakingEvaluationItemDto"][];
            languageModel: string;
            languageProvider: string;
            /** Format: date-time */
            queuedAtUtc: null | string;
            /** Format: int32 */
            retryCount: number;
            rubricVersion: string;
            speechProvider: string;
            status: string;
            strengths: string[];
            summary: null | string;
        };
        SpeakingEvaluationItemDto: {
            /** Format: double */
            accuracyScore: number;
            /** Format: double */
            completenessScore: null | number;
            feedback: string;
            /** Format: double */
            fluencyScore: number;
            /** Format: int32 */
            grammarScore: null | number;
            /** Format: int32 */
            maxRawScore: number;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            position: number;
            /** Format: double */
            pronunciationScore: number;
            /** Format: double */
            prosodyScore: null | number;
            /** Format: int32 */
            rawScore: number;
            recognitionStatus: string;
            /** Format: int32 */
            relevanceScore: null | number;
            suggestedResponse: null | string;
            transcript: string;
            /** Format: int32 */
            vocabularyScore: null | number;
            wordIssues: components["schemas"]["SpeakingWordIssueDto"][];
        };
        SpeakingExerciseCountsDto: {
            /** Format: int32 */
            archived: number;
            /** Format: int32 */
            draft: number;
            /** Format: int32 */
            published: number;
            /** Format: int32 */
            total: number;
        };
        SpeakingExerciseDto: {
            callerIntro?: null | string;
            code: string;
            context?: null | string;
            /** Format: date-time */
            createdAtUtc: string;
            difficulty: string;
            documentRows?: null | components["schemas"]["SpeakingInfoRowDto"][];
            documentTitle?: null | string;
            /** Format: uuid */
            id: string;
            imageAlt?: null | string;
            /** Format: uuid */
            imageAssetId?: null | string;
            modelAnswer: string;
            /** Format: int32 */
            part: number;
            passage?: null | string;
            prompt?: null | string;
            questions?: null | string[];
            rubricNotes: string;
            status: string;
            topic: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        SpeakingExerciseInput: {
            callerIntro?: null | string;
            code: null | string;
            context?: null | string;
            difficulty: null | string;
            documentRows?: null | components["schemas"]["SpeakingInfoRowInput"][];
            documentTitle?: null | string;
            imageAlt?: null | string;
            /** Format: uuid */
            imageAssetId?: null | string;
            modelAnswer: null | string;
            /** Format: int32 */
            part: number;
            passage?: null | string;
            prompt?: null | string;
            questions?: null | string[];
            rubricNotes: null | string;
            status: null | string;
            topic: null | string;
        };
        SpeakingImageDto: {
            contentType: string;
            /** Format: uuid */
            id: string;
            /** Format: int64 */
            sizeBytes: number;
        };
        SpeakingInfoRowDto: {
            label: string;
            value: string;
        };
        SpeakingInfoRowInput: {
            label: null | string;
            value: null | string;
        };
        SpeakingPageDtoOfSpeakingAttemptSummaryDto: {
            items: components["schemas"]["SpeakingAttemptSummaryDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SpeakingPageDtoOfSpeakingExerciseDto: {
            items: components["schemas"]["SpeakingExerciseDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SpeakingPageDtoOfSpeakingPublicExerciseDto: {
            items: components["schemas"]["SpeakingPublicExerciseDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SpeakingPageDtoOfSpeakingPublicTestDto: {
            items: components["schemas"]["SpeakingPublicTestDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SpeakingPageDtoOfSpeakingTestListItemDto: {
            items: components["schemas"]["SpeakingTestListItemDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SpeakingPartSummaryDto: {
            /** Format: int32 */
            durationSeconds: number;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            questionCount: number;
        };
        SpeakingPublicExerciseDto: {
            code: string;
            difficulty: string;
            /** Format: int32 */
            durationSeconds: number;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            questionCount: number;
            topic: string;
            /** Format: date-time */
            updatedAtUtc: string;
        };
        SpeakingPublicTestDto: {
            code: string;
            description: string;
            /** Format: uuid */
            id: string;
            parts: components["schemas"]["SpeakingPartSummaryDto"][];
            /** Format: date-time */
            publishedAtUtc: null | string;
            title: string;
        };
        SpeakingRecordingDto: {
            /** Format: int32 */
            durationSeconds: number;
            /** Format: date-time */
            uploadedAtUtc: string;
        };
        SpeakingReviewQuestionDto: {
            modelAnswer: string;
            /** Format: int32 */
            position: number;
            rubricNotes: string;
        };
        SpeakingTestCountsDto: {
            /** Format: int32 */
            draft: number;
            /** Format: int32 */
            published: number;
            /** Format: int32 */
            total: number;
        };
        SpeakingTestDetailDto: {
            code: string;
            contentMode: string;
            /** Format: date-time */
            createdAtUtc: string;
            description: string;
            exercises: components["schemas"]["SpeakingTestSlotDto"][];
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            publishedAtUtc: null | string;
            questions: components["schemas"]["SpeakingTestQuestionDto"][];
            status: string;
            title: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        SpeakingTestInput: {
            code: null | string;
            contentMode?: null | string;
            description: null | string;
            exercises: null | components["schemas"]["SpeakingTestSlotInput"][];
            questions?: null | components["schemas"]["SpeakingTestQuestionInput"][];
            title: null | string;
        };
        SpeakingTestListItemDto: {
            code: string;
            contentMode: string;
            /** Format: uuid */
            id: string;
            partCounts: {
                [key: string]: number;
            };
            /** Format: date-time */
            publishedAtUtc: null | string;
            /** Format: int32 */
            questionCount: number;
            status: string;
            title: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        SpeakingTestQuestionContentDto: {
            callerIntro?: null | string;
            context?: null | string;
            documentRows?: null | components["schemas"]["SpeakingInfoRowDto"][];
            documentTitle?: null | string;
            imageAlt?: null | string;
            /** Format: uuid */
            imageAssetId?: null | string;
            modelAnswer: string;
            passage?: null | string;
            prompt?: null | string;
            questions?: null | string[];
            rubricNotes: string;
        };
        SpeakingTestQuestionContentInput: {
            callerIntro?: null | string;
            context?: null | string;
            documentRows?: null | components["schemas"]["SpeakingInfoRowInput"][];
            documentTitle?: null | string;
            imageAlt?: null | string;
            /** Format: uuid */
            imageAssetId?: null | string;
            modelAnswer: null | string;
            passage?: null | string;
            prompt?: null | string;
            questions?: null | string[];
            rubricNotes: null | string;
        };
        SpeakingTestQuestionDto: {
            content: components["schemas"]["SpeakingTestQuestionContentDto"];
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
        };
        SpeakingTestQuestionInput: {
            content: null | components["schemas"]["SpeakingTestQuestionContentInput"];
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
        };
        SpeakingTestSlotDto: {
            exercise: components["schemas"]["SpeakingExerciseDto"];
            /** Format: uuid */
            exerciseId: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
        };
        SpeakingTestSlotInput: {
            /** Format: uuid */
            exerciseId: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
        };
        SpeakingWordIssueDto: {
            /** Format: double */
            accuracyScore: number;
            word: string;
        };
        StartSpeakingAttemptInput: {
            /** Format: uuid */
            exerciseId?: null | string;
            mode: null | string;
            /** Format: uuid */
            testId: null | string;
        };
        StartWritingAttemptInput: {
            mode: string;
            /** Format: uuid */
            testId: string;
        };
        ToggleQuestionFlagInput: {
            isFlagged: boolean;
        };
        UpdateAdminUserRequest: {
            role: string;
        };
        UpdateExamQuestionRequest: {
            code: string;
            correctKey: string;
            explanation: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            /** @default false */
            imageRequired: boolean;
            optionA: string;
            optionB: string;
            optionC: string;
            optionD: null | string;
            stem: string;
            translation: null | string;
        };
        UpdateExamScoreProfileRequest: {
            /** Format: uuid */
            scoreProfileId: string;
        };
        UpdateProfileNameRequest: {
            displayName: string;
        };
        UpdateProfileRequest: {
            /** Format: date */
            dateOfBirth: null | string;
            displayName: string;
            phone: null | string;
            /** Format: int32 */
            targetScore: null | number;
        };
        UpsertFlashcardProgressRequest: {
            starred: boolean;
            status: string;
        };
        ValidationProblemDetails: {
            detail?: null | string;
            errors?: {
                [key: string]: string[];
            };
            instance?: null | string;
            /** Format: int32 */
            status?: null | number;
            title?: null | string;
            type?: null | string;
        };
        VerifyEmailCommand: {
            code: string;
            email: string;
        };
        VerifyPasswordResetCommand: {
            code: string;
            email: string;
        };
        VersionedKnowledgeArticleRequest: {
            article: components["schemas"]["KnowledgeArticleInput"];
            /** Format: int32 */
            version: number;
        };
        VersionedKnowledgeCategoryRequest: {
            category: components["schemas"]["KnowledgeCategoryInput"];
            /** Format: int32 */
            version: number;
        };
        VersionedRequest: {
            /** Format: int32 */
            version: number;
        };
        VersionedSpeakingExerciseRequest: {
            exercise: null | components["schemas"]["SpeakingExerciseInput"];
            /** Format: int32 */
            version: number;
        };
        VersionedSpeakingPublishRequest: {
            /** Format: int32 */
            version: number;
        };
        VersionedSpeakingTestRequest: {
            test: null | components["schemas"]["SpeakingTestInput"];
            /** Format: int32 */
            version: number;
        };
        VersionedWritingExerciseRequest: {
            exercise: components["schemas"]["WritingExerciseInput"];
            /** Format: int32 */
            version: number;
        };
        VersionedWritingTestRequest: {
            test: components["schemas"]["WritingTestInput"];
            /** Format: int32 */
            version: number;
        };
        WritingAttemptDto: {
            /** Format: date-time */
            createdAtUtc: string;
            currentPhase: null | string;
            /** Format: int32 */
            currentQuestionPosition: null | number;
            evaluation: null | components["schemas"]["WritingEvaluationDto"];
            /** Format: uuid */
            id: string;
            isPractice: boolean;
            mode: string;
            /** Format: date-time */
            phaseEndsAtUtc: null | string;
            questions: components["schemas"]["WritingAttemptQuestionDto"][];
            reviewQuestions: components["schemas"]["WritingAttemptReviewQuestionDto"][];
            /** Format: date-time */
            serverNowUtc: string;
            status: string;
            /** Format: date-time */
            submittedAtUtc: null | string;
            testCode: string;
            /** Format: uuid */
            testId: null | string;
            testTitle: string;
        };
        WritingAttemptPageDto: {
            items: components["schemas"]["WritingAttemptSummaryDto"][];
        };
        WritingAttemptPartDto: {
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            preparationSeconds: number;
            /** Format: int32 */
            questionCount: number;
            /** Format: int32 */
            responseSeconds: number;
        };
        WritingAttemptQuestionDto: {
            answer: string;
            directions: null | string;
            emailBody: null | string;
            imageAlt: null | string;
            imageUrl: null | string;
            keywordOne: null | string;
            keywordTwo: null | string;
            /** Format: date-time */
            lastSavedAtUtc: null | string;
            /** Format: date-time */
            lockedAtUtc: null | string;
            /** Format: int32 */
            minimumWordCount: null | number;
            outline: null | string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            position: number;
            /** Format: int32 */
            preparationSeconds: number;
            prompt: null | string;
            recipient: null | string;
            /** Format: int32 */
            responseSeconds: number;
            sender: null | string;
            subject: null | string;
        };
        WritingAttemptReviewQuestionDto: {
            modelAnswer: string;
            /** Format: int32 */
            position: number;
        };
        WritingAttemptSummaryDto: {
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: int32 */
            currentQuestionPosition: null | number;
            /** Format: int32 */
            estimatedScore: null | number;
            evaluationStatus: null | string;
            /** Format: uuid */
            id: string;
            isPractice: boolean;
            /** Format: int32 */
            maxRawScore?: null | number;
            mode: string;
            /** Format: int32 */
            questionCount: number;
            /** Format: int32 */
            rawScore?: null | number;
            /** Format: double */
            scorePercentage?: null | number;
            status: string;
            /** Format: date-time */
            submittedAtUtc: null | string;
            testCode: string;
            /** Format: uuid */
            testId: null | string;
            testTitle: string;
            /** Format: date-time */
            updatedAtUtc: string;
        };
        WritingEvaluationDto: {
            /** Format: date-time */
            completedAtUtc: null | string;
            /** Format: date-time */
            consentAcceptedAtUtc: null | string;
            /** Format: int32 */
            estimatedScore: null | number;
            failureMessage: null | string;
            feedback: components["schemas"]["WritingEvaluationFeedbackDto"][];
            improvements: string[];
            /** Format: int32 */
            maxRawScore?: null | number;
            model: string;
            provider: string;
            /** Format: date-time */
            queuedAtUtc: null | string;
            /** Format: int32 */
            rawScore?: null | number;
            /** Format: int32 */
            retryCount: number;
            rubricVersion: string;
            /** Format: double */
            scorePercentage?: null | number;
            status: string;
            strengths: string[];
            summary: null | string;
        };
        WritingEvaluationFeedbackDto: {
            /** Format: int32 */
            criterionScore: number;
            feedback: string;
            /** Format: int32 */
            questionPosition: number;
            suggestedRevision: string;
        };
        WritingExerciseDto: {
            code: string;
            /** Format: date-time */
            createdAtUtc: string;
            difficulty: string;
            directions: null | string;
            emailBody: null | string;
            /** Format: uuid */
            id: string;
            imageAlt: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            keywordOne: null | string;
            keywordTwo: null | string;
            /** Format: int32 */
            minimumWordCount: null | number;
            modelAnswer: string;
            outline: null | string;
            /** Format: int32 */
            part: number;
            prompt: null | string;
            recipient: null | string;
            rubricNotes: string;
            sender: null | string;
            status: string;
            subject: null | string;
            topic: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        WritingExerciseImportPreviewDto: {
            fileName: string;
            /** Format: int32 */
            invalidRowCount?: number;
            /** Format: int32 */
            part: number;
            rows: components["schemas"]["WritingExerciseImportRowDto"][];
            /** Format: int32 */
            validRowCount?: number;
        };
        WritingExerciseImportRowDto: {
            code: null | string;
            errors: string[];
            input?: null | components["schemas"]["WritingExerciseInput"];
            isValid?: boolean;
            /** Format: int32 */
            rowNumber: number;
        };
        WritingExerciseInput: {
            code: string;
            difficulty: string;
            directions: null | string;
            emailBody: null | string;
            imageAlt: null | string;
            /** Format: uuid */
            imageAssetId: null | string;
            keywordOne: null | string;
            keywordTwo: null | string;
            /** Format: int32 */
            minimumWordCount: null | number;
            modelAnswer: null | string;
            outline: null | string;
            /** Format: int32 */
            part: number;
            prompt: null | string;
            recipient: null | string;
            rubricNotes: null | string;
            sender: null | string;
            status: string;
            subject: null | string;
            topic: string;
        };
        WritingExercisePageDto: {
            items: components["schemas"]["WritingExerciseDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        WritingMediaAssetDto: {
            /** Format: int64 */
            byteLength: number;
            contentType: string;
            downloadUrl: string;
            /** Format: uuid */
            id: string;
            originalFileName: string;
            /** Format: date-time */
            uploadedAtUtc: string;
        };
        WritingPracticeExerciseDto: {
            code: string;
            difficulty: string;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            part: number;
            topic: string;
        };
        WritingPracticeExercisePageDto: {
            items: components["schemas"]["WritingPracticeExerciseDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
        };
        WritingPublicTestDto: {
            code: string;
            description: string;
            /** Format: uuid */
            id: string;
            parts: components["schemas"]["WritingAttemptPartDto"][];
            /** Format: date-time */
            publishedAtUtc: string;
            title: string;
        };
        WritingPublicTestPageDto: {
            items: components["schemas"]["WritingPublicTestSummaryDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        WritingPublicTestSummaryDto: {
            code: string;
            description: string;
            /** Format: uuid */
            id: string;
            parts: components["schemas"]["WritingAttemptPartDto"][];
            /** Format: date-time */
            publishedAtUtc: string;
            title: string;
        };
        WritingTestDto: {
            code: string;
            /** Format: date-time */
            createdAtUtc: string;
            description: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            publishedAtUtc: null | string;
            questions: components["schemas"]["WritingTestQuestionDto"][];
            status: string;
            title: string;
            /** Format: date-time */
            updatedAtUtc: string;
            /** Format: int32 */
            version: number;
        };
        WritingTestImportPreviewDto: {
            errors: string[];
            isValid?: boolean;
            test: null | components["schemas"]["WritingTestInput"];
        };
        WritingTestInput: {
            code: string;
            description: null | string;
            questions: components["schemas"]["WritingTestQuestionInput"][];
            title: string;
        };
        WritingTestPageDto: {
            items: components["schemas"]["WritingTestDto"][];
            /** Format: int32 */
            pageNumber: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
        };
        WritingTestQuestionDto: {
            /** Format: uuid */
            exerciseId: null | string;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
            snapshotJson: null | string;
        };
        WritingTestQuestionInput: {
            content?: null | components["schemas"]["WritingExerciseInput"];
            /** Format: uuid */
            exerciseId: null | string;
            /** Format: int32 */
            part: number;
            /** Format: int32 */
            sequenceNumber: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
