import type { components, operations, paths } from "./generated/openapi.types";

export type { components, operations, paths };
export type ApiPaths = paths;
export type ApiComponents = components;
export type ApiOperations = operations;
export type ApiSchema<K extends keyof components["schemas"]> =
  components["schemas"][K];
