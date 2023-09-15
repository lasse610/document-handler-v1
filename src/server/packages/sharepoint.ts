import {
  type AuthProviderCallback,
  Client,
} from "@microsoft/microsoft-graph-client";
import type * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { env } from "~/env.mjs";
import axios from "axios";
import fs from "fs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sharepointDocuments } from "~/drizzle";
import { excecutePandoc } from "./pandoc";
import { type DrizzleClient } from "~/drizzle/client";

interface DriveItem extends MicrosoftGraph.DriveItem {
  "@microsoft.graph.downloadUrl": string;
}

const axiosClient = axios.create();

const siteId =
  "4rkscv.sharepoint.com,02a94695-f4f7-44d5-b3d9-6aeefa128271,17c4a475-732d-41a7-8156-7317e88700c4";

const driveId =
  "b!lUapAvf01USz2Wru-hKCcXWkxBctc6dBgVZzF-iHAMRaiwR_Z8jHQJiP1Fie7yxZ";

export function initMicrosoftGraphClient() {
  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;
  const tennantId = env.MICROSOFT_TENANT_ID;

  return Client.init({
    authProvider: (callback: AuthProviderCallback) => {
      getAccessToken(clientId, clientSecret, tennantId)
        .then((token) => callback(null, token))
        .catch((error) => callback(error, null));
    },
  });
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  tennantId: string,
) {
  if (!clientId || !clientSecret || !tennantId) {
    throw new Error(
      "Azure AD client ID, client secret, and tenant ID must be set",
    );
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tennantId}/oauth2/v2.0/token`;
  const requestData = new URLSearchParams();
  requestData.append("client_id", clientId);
  requestData.append("scope", "https://graph.microsoft.com/.default");
  requestData.append("client_secret", clientSecret);
  requestData.append("grant_type", "client_credentials");

  try {
    const response = await axios.post<{ access_token: string }>(
      tokenEndpoint,
      requestData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!response.data.access_token) {
      throw new Error("No access token returned");
    }

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

export async function GetSharepointFileInfos(client: Client) {
  const files = (await client
    .api(`/sites/${siteId}/drives/${driveId}/root/children`)
    .get()) as { value?: DriveItem[] };

  return files;
}

export async function UpdateSharepointFile(
  client: Client,
  path: string,
  fileId: string,
) {
  const file = fs.readFileSync(path);
  await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${fileId}/content`)
    .put(file);

  return true;
}

export async function UploadSharepointFile(
  client: Client,
  filename: string,
  path: string,
) {
  const file = fs.readFileSync(path);
  const uploadedFileDriveItem = (await client
    .api(`/sites/${siteId}/drives/${driveId}/root:/${filename}:/content`)
    .put(file)) as DriveItem;

  return uploadedFileDriveItem;
}

export async function GetSharepointFileInfo(client: Client, id: string) {
  const file = (await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${id}`)
    .get()) as DriveItem;

  return file;
}

export async function DownloadSharepointFileAndWriteToDisk(
  downloadUrl: string,
  path: string,
) {
  const ArrayBuffer = await axiosClient.get<ArrayBuffer>(downloadUrl, {
    responseType: "arraybuffer",
  });
  fs.writeFileSync(path, Buffer.from(ArrayBuffer.data));
  return true;
}

export function DownloadSharepointFile(downloadUrl: string) {
  return axiosClient.get<ArrayBuffer>(downloadUrl, {
    responseType: "arraybuffer",
  });
}

export function DeleteSharepointFile(client: Client, id: string) {
  return client.api(`/sites/${siteId}/drives/${driveId}/items/${id}`).delete();
}
