import { Document } from "~/drizzle";
import { Editor } from "../components/editor/editor";
import htmlDiff from "node-htmldiff";

export default function Home() {
  const source = "<ul><li>test</li><li>test</li></ul>";
  const target = "<h1>Moi</h1>";
  const diff = htmlDiff(source, target);
  console.log(diff);
  const document: Document = {
    id: "1",
    title: "test",
    text: "<ul><li>test</li><li>test</li></ul>",
    createdAt: new Date(),
    updatedAt: new Date(),
    embedding: [1],
    updated: false,
    type: "source",
  };

  return (
    <div className="flex min-h-screen w-screen justify-center gap-20 bg-slate-100 py-20">
      <h1>Home</h1>
      <Editor
        newText={diff}
        document={document}
        onSave={(html: string) => {
          console.log(html);
          return;
        }}
      />
    </div>
  );
}
