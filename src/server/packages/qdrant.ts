import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantCollectionName = "document-handler-test-collection";
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

export async function uploadEmbeddingToQdrant(id: string, vector: number[]) {
  // Upload Embedding to Qdrant
  await qdrant.upsert(qdrantCollectionName, {
    points: [
      {
        id,
        vector,
      },
    ],
  });
}

export async function searchSimilarEmbeddingsInQdrant(
  vector: number[],
  ownId: string,
) {
  const topK = 5;

  const searchResponse = await qdrant.search(qdrantCollectionName, {
    vector: vector,
    limit: topK,
    filter: {},
  });
  return searchResponse.filter((s) => s.id !== ownId);
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
