import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { type Document } from "~/drizzle";
import { AppRouter } from "./server/api/root";

export enum UpdateStatus {
  Updated = "updated",
  Skipped = "skipped",
}

export interface CompletionResponse {
  type: UpdateStatus;
}

export interface SkippedResponse extends CompletionResponse {
  type: UpdateStatus.Skipped;
  document: Document;
}

export interface UpdatedResponse extends CompletionResponse {
  type: UpdateStatus.Updated;
  document: Document;
  new: string;
}

export interface DocumentUpdateResponse {
  document: Document;
  changes: string;
}

export enum OperationType {
  Create = "create",
  Modify = "modify",
}

export enum DocumentType {
  Source = "source",
  Destination = "destination",
  Sharepoint = "sharepoint",
}

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

export type GetFileChangesOutput =
  RouterOutput["fileChanges"]["getFileChanges"];
