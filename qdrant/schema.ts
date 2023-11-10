import { QdrantClient } from "@qdrant/js-client-rest";

async function main() {
  const client = new QdrantClient({ url: "http://localhost:6333" });
  const collectionName = "document-handler-test-collection";

  console.log("Deleting collection");
  await client.deleteCollection(collectionName);
  console.log("Creating collection");
  await client.createCollection(collectionName, {
    vectors: {
      size: 1536,
      distance: "Dot",
    },
  });

  console.log(
    await client.retrieve(collectionName, {
      ids: ["e4dc87a1-4c22-4dff-b588-de087f828cfc"],
      with_payload: true,
      with_vector: true,
    }),
  );

  console.log("Collection Info");
  console.log(await client.getCollection(collectionName));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
