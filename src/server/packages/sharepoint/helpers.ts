import { type Client } from "@microsoft/microsoft-graph-client";
import { type DBSharepointDrive, type NewDBSharepointFile } from "~/drizzle";
import { excecutePandoc } from "../pandoc";
import {
  getSharepointDriveItem,
  type DriveItemFile,
  DownloadSharepointFile,
} from "./graphApi";
import { createEmbedding } from "../openAI";
import { uploadEmbeddingToQdrant } from "../qdrant";

export async function createNewDbSharepointFile(
  client: Client,
  dbSharepointDrive: DBSharepointDrive,
  file: microsoftgraph.DriveItem,
) {
  if (
    file.file?.mimeType !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    !file.id
  ) {
    console.log("Drive item not a file or wrong file type");
    throw new Error("Drive item not a file or wrong file type");
  }

  const driveItem = (await getSharepointDriveItem(
    client,
    dbSharepointDrive.siteId,
    dbSharepointDrive.driveId,
    file.id,
  )) as DriveItemFile;

  if (driveItem.deleted?.state === "deleted") {
    return null;
  }

  const unescapedName = driveItem.name;
  const escapedName = unescapedName?.replace(/ /g, "\\ ");
  const fileType = escapedName?.split(".")[1];

  if (!driveItem.id || !fileType || !unescapedName || !driveItem.cTag) {
    console.log("No drive item found or has missing properties");
    throw new Error("No drive item found or has missing properties");
  }

  // Fetch file content from download url
  const downloadUrl = driveItem["@microsoft.graph.downloadUrl"];
  if (!downloadUrl) {
    console.log("No download url");
    throw new Error("No download url in drive item response");
  }
  // Download file content
  const arrayBuffer = await DownloadSharepointFile(downloadUrl);

  // Convert to html
  const html = await excecutePandoc(arrayBuffer.data, [
    "-f",
    "docx",
    "--extract-media",
    `./public/media/${driveItem.id}`,
    "-t",
    "html",
  ]);

  // Create embedding
  const embedding = await createEmbedding(html);

  const sharepointFile: NewDBSharepointFile = {
    itemId: driveItem.id,
    name: unescapedName,
    sharepointDriveId: dbSharepointDrive.id,
    embedding,
    cTag: driveItem.cTag,
    content: html,
  };

  return sharepointFile;
}
