import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantCollectionName = "document-handler-test-collection";
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

export async function uploadEmbeddingToQdrant(
  id: string,
  vector: number[],
  documentType: string,
) {
  // Upload Embedding to Qdrant
  await qdrant.upsert(qdrantCollectionName, {
    points: [
      {
        id,
        vector,
        payload: { documentType },
      },
    ],
  });
}

export async function searchSimilarEmbeddingsInQdrant(vector: number[]) {
  const topK = 10;
  const searchResponse = await qdrant.search(qdrantCollectionName, {
    vector: vector,
    limit: topK,
    filter: {
      must_not: [
        {
          key: "documentType",
          match: {
            value: "source",
          },
        },
      ],
    },
  });

  return searchResponse;
}

export async function updateEmbeddingInQdrant(id: string, vector: number[]) {
  // Upload Embedding to Qdrant
  await qdrant.updateVectors(qdrantCollectionName, {
    points: [
      {
        id,
        vector,
      },
    ],
  });
}

export async function deleteEmbeddingFromQdrant(id: string) {
  // Upload Embedding to Qdrant
  await qdrant.delete(qdrantCollectionName, {
    points: [id],
  });
}
