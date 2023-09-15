import {
  $getRoot,
  $insertNodes,
  LineBreakNode,
  type LexicalNode,
  TextNode,
} from "lexical";
import { Fragment, useEffect, useState } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import Head from "next/head";
import * as Diff from "diff";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
} from "@heroicons/react/24/outline";
import { api } from "~/utils/api";
import { set } from "zod";

export default function TestWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [objects, setObjects] = useState<number[]>([]);
  const testMutation = api.documents.test.useMutation({
    onSuccess: (data) => {
      setObjects(data);
      setIsModalOpen(true);
    },
  });

  function handleModalOpen() {
    setIsModalOpen(true);
  }

  function handleClick() {
    testMutation.mutate();
  }

  function onError(error: Error) {
    console.error(error);
  }
  const initialConfig = {
    namespace: "MyEditor",
    onError,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col justify-center gap-10">
        <Editor />
        {testMutation.isLoading && <p>Loading...</p>}
        <Modal
          objects={objects}
          open={isModalOpen}
          closeModal={setIsModalOpen}
        />
        <button onClick={handleClick}>Open Modal</button>
      </div>
    </LexicalComposer>
  );
}

function Modal(props: {
  objects: number[];
  open: boolean;
  closeModal: (open: boolean) => void;
}) {
  const { open, closeModal, objects } = props;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [objects]);

  function handleNext() {
    setIndex((prev) => (prev + 1 < objects.length ? prev + 1 : prev));
  }

  function handlePrevious() {
    setIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  }
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                as="div"
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
              >
                <Dialog.Title
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  Results
                </Dialog.Title>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div>
                    <p>
                      {index + 1} of {objects.length}
                    </p>
                  </div>
                  <h1 className="text-2xl font-bold">{objects[index]}</h1>
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={handlePrevious}
                      type="button"
                      className="rounded-full bg-indigo-600 p-1.5 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <ArrowSmallLeftIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={handleNext}
                      type="button"
                      className="rounded-full bg-indigo-600 p-1.5 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <ArrowSmallRightIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function Editor() {
  const document1 =
    "Sauli Väinämö Niinistö (s. 24. elokuuta 1948 Salo) on suomalainen kokoomustaustainen poliitikko ja Suomen tasavallan 12. presidentti. Hän astui virkaan 1. maaliskuuta 2012, ja hänet valittiin uudelleen presidentiksi vuonna 2018. Juristina työskennellyt Niinistö toimi Salon kaupunginvaltuustossa 1977–1992, kansanedustajana vuosina 1987–2003 ja 2007–2011 ja Kansallisen Kokoomuksen puheenjohtajana 1994–2001. Hän oli mukana Paavo Lipposen ensimmäisessä ja toisessa hallituksessa, ensin oikeusministerinä 1995–1996 ja sitten valtiovarainministerinä 1996–2003. Jälkimmäisessä virassa Niinistö tunnettiin tiukasta talouskuristaan ja työstään 1990-luvun laman jälkeisten säästöjen ja leikkausten parissa. Niinistön ministerikausien aikana Suomesta tuli Euroopan talous- ja rahaliiton jäsen ja euro otettiin käyttöön. Ministeriuran jälkeen hän siirtyi Euroopan investointipankin varapääjohtajaksi vuosiksi 2003–2007. Vuosina 2007–2011 Niinistö oli eduskunnan puhemies. Poliittisen uransa aikana Niinistö on nauttinut laajaa kansansuosiota yli puoluerajojen. Niinistö oli kokoomuksen presidenttiehdokkaana vuoden 2006 presidentinvaalissa ja uudestaan vuoden 2012 vaalissa, jossa hänet valittiin tasavallan presidentiksi toisella kierroksella. Hänestä tuli ensimmäinen kokoomuslainen presidentti sitten Juho Kusti Paasikiven. Vuoden 2018 vaalissa Niinistö oli ehdolla valitsijayhdistyksen kautta ja voitti vaalit ensimmäisellä kierroksella yli 60 prosentin äänikannatuksella. Näin hänestä tuli myös ensimmäinen Suomen tasavallan presidentti, joka on valittu suorassa kansanvaalissa virkaansa jo ensimmäisellä kierroksella.";

  const document2 =
    "Roope Pekkanen (s. 24. elokuuta 1948 Salo) on suomalainen kokoomustaustainen poliitikko ja Suomen tasavallan 12. presidentti. Hän astui virkaan 1. maaliskuuta 2012, ja hänet valittiin uudelleen presidentiksi vuonna 2018. Juristina työskennellyt Pekkanen toimi Salon kaupunginvaltuustossa 1977–1992, kansanedustajana vuosina 1987–2003 ja 2007–2011 ja Kansallisen Kokoomuksen puheenjohtajana 1994–2001. Hän oli mukana Paavo Lipposen ensimmäisessä ja toisessa hallituksessa, ensin oikeusministerinä 1995–1996 ja sitten valtiovarainministerinä 1996–2003. Jälkimmäisessä virassa Pekkanen tunnettiin tiukasta talouskuristaan ja työstään 1990-luvun laman jälkeisten säästöjen ja leikkausten parissa. Pekkasen ministerikausien aikana Suomesta tuli Euroopan talous- ja rahaliiton jäsen ja euro otettiin käyttöön. Ministeriuran jälkeen hän siirtyi Euroopan investointipankin varapääjohtajaksi vuosiksi 2003–2007. Vuosina 2007–2011 Pekkanen oli eduskunnan puhemies. Poliittisen uransa aikana Pekkanen on nauttinut laajaa kansansuosiota yli puoluerajojen. Pekkanen oli kokoomuksen presidenttiehdokkaana vuoden 2006 presidentinvaalissa ja uudestaan vuoden 2012 vaalissa, jossa hänet valittiin tasavallan presidentiksi toisella kierroksella. Hänestä tuli ensimmäinen kokoomuslainen presidentti sitten Juho Kusti Paasikiven. Vuoden 2018 vaalissa Pekkanen oli ehdolla valitsijayhdistyksen kautta ja voitti vaalit ensimmäisellä kierroksella yli 60 prosentin äänikannatuksella. Näin hänestä tuli myös ensimmäinen Suomen tasavallan presidentti, joka on valittu suorassa kansanvaalissa virkaansa jo ensimmäisellä kierroksella.";
  const [content, setContent] = useState<string>(document1);
  const [editor] = useLexicalComposerContext();

  const diff = Diff.diffWords(document1, document2);
  const addedOrPreserved = diff.filter((part) => part.added ?? !part.removed);

  const removedOrPreserved = diff.filter((part) => part.removed ?? !part.added);

  function changeObjectToLexicalNodes(changes: Diff.Change[]): LexicalNode[] {
    const children: LexicalNode[] = [];

    if (typeof window === "undefined") {
      return children;
    }
    for (const change of changes) {
      for (const [i, line] of change.value.split("\n").entries()) {
        if (i !== 0) {
          const child: LineBreakNode = new LineBreakNode();
          children.push(child);
        }

        //const value = document.createElement("p");
        if (change.added) {
          const child = new TextNode(line);
          child.setStyle("background-color: green");
          children.push(child);
          continue;
        }
        if (change.removed) {
          const child = new TextNode(line);
          child.setStyle("background-color: red");
          children.push(child);
          continue;
        }
        const child = new TextNode(line);
        children.push(child);
      }
    }
    // convert html to string
    return children;
  }

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.

  function exportDom() {
    /*
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor, null);
      console.log(html);
    });
    */
    const state = editor.getEditorState();
    const json = state.toJSON();
    console.log(state.toJSON());
  }

  function importContent() {
    editor.update(() => {
      // In the browser you can use the native DOMParser API to parse the HTML string.

      // Once you have the DOM instance it's easy to generate LexicalNodes.

      // Select the root
      $getRoot().select();

      // Insert them at a selection.
      $insertNodes(changeObjectToLexicalNodes(removedOrPreserved));
    });
  }

  return (
    <>
      <Head>
        <title>test</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-y-20 bg-gray-200">
        <div className="flex h-screen w-full flex-col items-center justify-center gap-y-10 ">
          <h1 className="text-5xl font-bold">Test</h1>
          <div className="w-3/4">
            <div className="relative mt-2">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="block h-auto w-full rounded-md border-0 p-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                }
                placeholder={
                  <div className="absolute top-0  p-2">Enter some text...</div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <MyCustomAutoFocusPlugin />
            </div>
            <button onClick={exportDom}>Export Dom</button>
            <button onClick={importContent}>Import Content</button>
          </div>
        </div>
      </main>
    </>
  );
}

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}
