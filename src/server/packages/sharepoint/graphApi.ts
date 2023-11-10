import {
  type AuthProviderCallback,
  Client,
} from "@microsoft/microsoft-graph-client";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { env } from "~/env.mjs";
import axios from "axios";
import fs from "fs";
export interface DriveItemFile extends MicrosoftGraph.DriveItem {
  "@microsoft.graph.downloadUrl": string | undefined;
}

const axiosClient = axios.create();

const siteId =
  "4rkscv.sharepoint.com,02a94695-f4f7-44d5-b3d9-6aeefa128271,17c4a475-732d-41a7-8156-7317e88700c4";

const driveId =
  "b!lUapAvf01USz2Wru-hKCcXWkxBctc6dBgVZzF-iHAMRaiwR_Z8jHQJiP1Fie7yxZ";

export async function initMicrosoftGraphClient() {
  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;
  const tennantId = env.MICROSOFT_TENANT_ID;
  const accessToken = await getAccessToken(clientId, clientSecret, tennantId);
  return {
    token: accessToken,
    client: Client.init({
      authProvider: (callback: AuthProviderCallback) => {
        callback(null, accessToken);
      },
    }),
  };
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
    .get()) as { value?: DriveItemFile[] };

  return files;
}

export async function UpdateSharepointFile(
  client: Client,
  path: string,
  siteId: string,
  driveId: string,
  itemId: string,
) {
  const file = fs.readFileSync(path);
  const response = (await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}/content`)
    .put(file)) as DriveItemFile;

  return response;
}

export async function UploadSharepointFile(
  client: Client,
  filename: string,
  path: string,
) {
  const file = fs.readFileSync(path);
  const uploadedFileDriveItem = (await client
    .api(`/sites/${siteId}/drives/${driveId}/root:/${filename}:/content`)
    .put(file)) as DriveItemFile;

  return uploadedFileDriveItem;
}

export async function GetSharepointFileInfo(client: Client, id: string) {
  const file = (await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${id}`)
    .get()) as DriveItemFile;

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

export async function getSharepointSites(client: Client) {
  const response = (await client.api(`/sites`).get()) as {
    value?: MicrosoftGraph.Site[];
  };
  return response.value ?? [];
}

export async function getSharepointSite(client: Client, siteId: string) {
  const response = (await client
    .api(`/sites/${siteId}`)
    .get()) as MicrosoftGraph.Site;
  return response;
}

export async function getSharepointDrives(client: Client, siteId: string) {
  const response = (await client.api(`/sites/${siteId}/drives`).get()) as {
    value?: MicrosoftGraph.Drive[];
  };
  return response.value ?? [];
}

export async function getSharepointDrive(
  client: Client,
  siteId: string,
  driveId: string,
) {
  const response = (await client
    .api(`/sites/${siteId}/drives/${driveId}`)
    .get()) as MicrosoftGraph.Drive;
  return response;
}

export async function getSharepointDriveContentDelta(
  client: Client,
  siteId: string,
  driveId: string,
) {
  const response = (await client
    .api(`/sites/${siteId}/drives/${driveId}/root/delta`)
    .get()) as {
    "@odata.deltaLink": string | undefined;
    value?: MicrosoftGraph.DriveItem[];
  };

  return response;
}

export async function getSharepointDriveItem(
  client: Client,
  siteId: string,
  driveId: string,
  itemId: string,
) {
  const response = (await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
    .get()) as MicrosoftGraph.DriveItem;
  return response;
}

export async function getSharepointUpdatedDelta(token: string, url: string) {
  try {
    const response = (
      await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
    ).data as {
      "@odata.deltaLink": string | undefined;
      value?: MicrosoftGraph.DriveItem[];
    };

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createDriveChangeSubscription(
  client: Client,
  siteId: string,
  driveId: string,
) {
  // now + 3 days
  const expirationDateTime = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const createSubscriptionBody: MicrosoftGraph.Subscription = {
    changeType: "updated",
    notificationUrl: env.WEBSERVER_ENDPOINT,
    resource: `/sites/${siteId}/drives/${driveId}/root`,
    expirationDateTime: expirationDateTime,
    clientState: env.MSWEBHOOK_SECRET_TOKEN,
  };

  const response = (await client
    .api("/subscriptions")
    .post(createSubscriptionBody)) as MicrosoftGraph.Subscription;
  return response;
}

export async function deleteDriveChangeSubscription(
  client: Client,
  subscriptionId: string,
) {
  await client.api(`/subscriptions/${subscriptionId}`).delete();
}
