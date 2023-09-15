import { createTRPCRouter } from "../../trpc";
import { deleteDocumentProcedure } from "./procedures/deleteDocument";
import { getAllDocumentsProcedure } from "./procedures/getAllDocuments";
import { runUpdateForDocumentsProcedure } from "./procedures/runUpdateForDocuments";
import { saveOrUpdateDocumentProcedure } from "./procedures/saveOrUpdateDocument";

export const newDocumentRouter = createTRPCRouter({
  saveOrUpdateDocument: saveOrUpdateDocumentProcedure,
  getAllDocuments: getAllDocumentsProcedure,
  deleteDocument: deleteDocumentProcedure,
  runUpdateForDocuments: runUpdateForDocumentsProcedure,
});
