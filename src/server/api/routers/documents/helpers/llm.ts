import {
  type BaseMessage,
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
import type OpenAi from "openai";
import { type Stream } from "openai/streaming";
import ee from "~/server/eventEmitter";
import htmlDiff from "node-htmldiff";

export async function checkIfDocumentNeedsUpdate(
  baseDocument: Document,
  document: Document,
) {
  console.log("Started checkIfDocumentNeedsUpdate");

  const planningMessages: BaseMessage[] = [
    addSystemMessage(
      'You are a chatbot that can use tools to indicate its answers to document similarity using tools. In your answer you should use a tool. Example answers are: answer_no("No because the two documents are not similar") or answer_yes("Yes because the two documents are similar") or answer_no("The documents are about different subjects") or answer_yes("Yes because the documents are about the same subject").',
    ),
    addUserMessage("Are these two documents similar?"),
    addUserMessage(
      `Document1 with title "${baseDocument.title}":  ${baseDocument.text}`,
    ),
    addUserMessage(
      `Document2 with title "${document.title}": ${document.text}`,
    ),
  ];

  const actionMessages: BaseMessage[] = [
    /*addSystemMessage(
      "You are a machine that updates the information in old documents. You are given two documents. You should replace conflicting information in the old document with newer alternative and/or add relevant missing information that is relevant for the subject of the old file. You are not allowed to do any modifications to the old document if the subject of the new document is not relevant or it does not contain any new information that would conflict with the information present in the old document. You are only allowed to use information present in the documents to create the necessary changes. Keep in mind not to remove any information or change formatting in the old document if it is not justified. Modifying the main language of the old document is also prohibited eg. If it was originally written in English the updated version should also be written in English. Finally: The output should be the updated document.",
    ),*/
    addSystemMessage(
      "Given two documents, Document A and Document B, please update Document A with any new information found in Document B. Additionally, if there are any conflicting values or information between the two documents, carefully consider the differences and resolve them in favor of Document B. Ensure that the formatting and language of the old document (Document A) are preserved unless necessary for clarity or coherence. Provide the revised version of Document A with all changes and updates, paying close attention to differences in values.",
    ),
    addUserMessage(`DocumentB: ${baseDocument.text}`),
    addUserMessage(`DocumentA: ${document.text}`),
  ];

  const planningResponse = (await createAnswer(
    planningMessages,
    [getTool1(), getTool2()],
    0.1,
    false,
  )) as OpenAi.Chat.Completions.ChatCompletion;

  let planningMessage = planningResponse?.choices[0]?.message;

  if (planningMessage?.function_call === undefined) {
    planningMessages.push(
      addSystemMessage(
        "You did not call any function. Please call a function. Possible functions are: answer_no or answer_yes",
      ),
    );
    const retriedPlanningResponse = (await createAnswer(
      planningMessages,
      [getTool1(), getTool2()],
      0.1,
      false,
    )) as OpenAi.Chat.Completions.ChatCompletion;
    planningMessage = retriedPlanningResponse?.choices[0]?.message;
  }
  /*
  if (
    planningMessage?.function_call?.name === "select_action" &&
    planningMessage?.function_call?.arguments?.includes("answer_no")
  ) */
  if (planningMessage?.function_call?.name !== "answer_yes") {
    return {
      type: UpdateStatus.Skipped,
      document: document,
    } as SkippedResponse;
  }

  const functionCallResponse = (await createAnswer(
    actionMessages,
    null,
    0.0,
    true,
  )) as Stream<OpenAi.Chat.Completions.ChatCompletionChunk>;

  // eslint-disable-next-line
  //@ts-ignore

  let response = "";
  for await (const chunk of functionCallResponse) {
    if (chunk.choices[0]?.delta.content) {
      response += chunk.choices[0]?.delta.content;
      const changes = htmlDiff(document.text, response);
      ee.emit("newToken", document, changes);
    }
  }

  if (response === "") {
    throw new Error("Failed to get response from OpenAI");
  }
  return {
    type: UpdateStatus.Updated,
    document: document,
    new: response,
  } as UpdatedResponse;
}

function getTool1() {
  return {
    name: "answer_yes",
    description:
      "Use this tool to indicate yes. The input is a string why you chose yes.",
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
    name: "answer_no",
    description:
      "Use this tool to indicate no. The input is a string why you chose no.",
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
