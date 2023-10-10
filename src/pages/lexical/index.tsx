import { Document } from "~/drizzle";
import { Editor } from "../components/editor/editableEditor";
import htmlDiff from "node-htmldiff";

export default function Home() {
  const source = "<h1><strong>moi<strong></h1>";
  const target =
    "<h1><strong>hellou <i>italic</i></strong><strong>moi</strong></h1><p><strong>hellou </strong><strong>moi</strong></p>";
  const diff = htmlDiff(source, target);
  console.log(diff);
  const document: Document = {
    id: "1",
    title: "test",
    text: "<p>Kakka</p>",
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
