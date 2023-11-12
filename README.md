# Document Handler
Raw prototype. Update all sharepoint documents to match an update. All documents that reference old information will get updated. No more outdated infromation in any organization.

Required Env variables described in .env.example

Steps to start.
```
pnpm run start-vector-database
pnpm run dev
```

Make sure you have applied migrations before starting (both the qdrant vector database and postgres).


