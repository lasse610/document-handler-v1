import { TRPCError } from "@trpc/server";
import {
  type BaseMessage,
  addAIMessage,
  addSystemMessage,
  addUserMessage,
  createAnswer,
} from "~/server/packages/openAI";
import {
  UpdateStatus,
  type UpdatedResponse,
  type SkippedResponse,
} from "~/types";
import { type Document } from "~/drizzle";

export async function checkIfDocumentNeedsUpdate(
  baselineText: string,
  document: Document,
) {
  const planningMessages: BaseMessage[] = [
    addSystemMessage(
      "You are a machine that determines if a document should be updated or not. You are given two documents. You should replace conflicting information in the old document with newer alternative and/or add relevant missing information that is relevant for the subject of the old file. You are not allowed to do any modifications to the old document if the subject of the new document is not relevant or it does not contain any new information that would conflict with the information present in the old document. You are only allowed to use information present in the documents to create the neccessary changes. Keep in mind not to remove any information or change formating in the old documentif it is not justified. You should output reasoning how the document should be updated.",
    ),
    addUserMessage(`New document with new infromation: ${baselineText}`),
    addUserMessage(`Old document: ${document.text}`),
  ];

  const actionMessages: BaseMessage[] = [
    addSystemMessage(
      "You are a machine that determines if a document should be updated or not. You are given two documents. You should replace conflicting information in the old document with newer alternative and/or add relevant missing information that is relevant for the subject of the old file. You are not allowed to do any modifications to the old document if the subject of the new document is not relevant or it does not contain any new information that would conflict with the information present in the old document. You are only allowed to use information present in the documents to create the neccessary changes. Keep in mind not to remove any information or change formating in the old document if it is not justified.",
    ),
    addUserMessage(`New document with new infromation: ${baselineText}`),
    addUserMessage(`Old document: ${document.text}`),
  ];

  const planningResponse = await createAnswer(planningMessages, null);

  const planningMessage = planningResponse?.choices[0]?.message;

  if (!planningMessage?.content) {
    throw new TRPCError({
      message: "failed to get response from OpenAI",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  actionMessages.push(addAIMessage(planningMessage.content));

  const functionCallResponse = await createAnswer(actionMessages, [
    getTool1(),
    getTool2(),
  ]);

  const functionCallMessage = functionCallResponse.choices[0]?.message;

  if (functionCallMessage?.function_call?.name === "update_document_tool") {
    const rawArguments = functionCallMessage.function_call.arguments;
    const { input } = JSON.parse(rawArguments) as { input: string };
    return {
      type: UpdateStatus.Updated,
      document: document,
      new: input,
    } as UpdatedResponse;
  } else {
    return {
      type: UpdateStatus.Skipped,
      document: document,
    } as SkippedResponse;
  }
}

function getTool1() {
  return {
    name: "update_document_tool",
    description:
      "Use this tool to replace the old document with a new version. The input should be the whole complete and updated content of the new version without any prefixes. Do not input only the changes. You should always include the whole document when using this tool. Make sure to apply all the proposed updates in the complete document.",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "string",
        },
      },
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#",
    },
  };
}

function getTool2() {
  return {
    name: "skip_document_tool",
    description:
      "Use this tool when the old document you are handling does not need to be updated. The input is the string 'skip'.",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "string",
        },
      },
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#",
    },
  };
}
