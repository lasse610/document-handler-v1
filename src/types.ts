import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { DBSharepointFile, type Document } from "~/drizzle";
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

export interface CompletionResponseV2 {
  type: UpdateStatus;
}

export interface SkippedResponseV2 extends CompletionResponseV2 {
  type: UpdateStatus.Skipped;
  document: DBSharepointFile;
}

export interface UpdatedResponseV2 extends CompletionResponseV2 {
  type: UpdateStatus.Updated;
  document: DBSharepointFile;
  new: string;
}

export interface RunUpdateResponseBase {
  type: "updated" | "temporary";
}

export interface RunUpdateResponseTemporary extends RunUpdateResponseBase {
  document: DBSharepointFile;
  changes: string;
  type: "temporary";
}
export interface RunUpdateFinishedResponse extends RunUpdateResponseBase {
  document: DBSharepointFile;
  changes: string;
  saved: boolean;
  type: "updated";
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

export type RunUpdateOutput = RouterOutput["fileChanges"]["runUpdateForChange"];
