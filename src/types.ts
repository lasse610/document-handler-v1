import { type Document } from "~/drizzle";

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
