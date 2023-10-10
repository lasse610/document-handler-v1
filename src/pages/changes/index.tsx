import { api } from "~/utils/api";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/20/solid";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { CustomTextNode } from "../components/editor/nodes/textNode";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { OverflowNode } from "@lexical/overflow";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HeadingNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { TextNode, ParagraphNode, $getRoot, $insertNodes } from "lexical";
import {
  InvisibleDelNode,
  VisibleDelNode,
} from "../components/editor/nodes/delNode";
import { CustomHeadingNode } from "../components/editor/nodes/headingNode";
import { InsNode } from "../components/editor/nodes/insNode";
import {
  CustomListNode,
  CustomListItemNode,
} from "../components/editor/nodes/listNode";
import { CustomParagraphNode } from "../components/editor/nodes/paragraphNode";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { GetFileChangesOutput } from "~/types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import htmlDiff from "node-htmldiff";
import { DisplayChangesEditor } from "../components/editor/displayChangesEditor";

export default function Changes() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<GetFileChangesOutput[number] | null>(
    null,
  );

  const context = api.useContext();
  api.fileChanges.changeSubscription.useSubscription(undefined, {
    onData: (data) => {
      void context.fileChanges.invalidate(undefined);
    },
  });
  const changes = api.fileChanges.getFileChanges.useQuery();

  function handleShowChanges(selectedChange: GetFileChangesOutput[number]) {
    setSelected(selectedChange);
    setOpen(true);
  }

  function onChangeModalClose() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center  gap-10 bg-slate-200 p-10">
      <h1>Changes</h1>

      <ul role="list" className="flex flex-col gap-5">
        {changes.data?.map((change) => (
          <li
            key={change.sharepointFileChange.id}
            className=" rounded-lg bg-white shadow"
          >
            <div className="grid  grid-cols-3 p-4  ">
              <div className=" col-span-2 grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 gap-1   sm:gap-5">
                  <div className="flex flex-row gap-1">
                    <p className="text-xs font-medium md:text-sm">Filename:</p>
                    <p className="text-xs md:text-sm">
                      {change.sharepointFile.name}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1">
                    <p className="text-xs font-medium md:text-sm">Drive:</p>
                    <p className="text-xs md:text-sm">
                      {change.sharepointDrive.driveName}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1">
                    <p className="text-xs font-medium md:text-sm">Site:</p>
                    <p className="text-xs md:text-sm">
                      {change.sharepointDrive.siteName}
                    </p>
                  </div>
                  <p className="text-xs font-extralight text-slate-500">{`Updated at ${change.sharepointFileChange.createdAt.toLocaleTimeString()}`}</p>
                </div>
              </div>
              <div className="grid grid-cols-1  gap-1">
                <div className="flex justify-center">
                  <div>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {change.sharepointFileChange.changeType}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div>
                    <button
                      onClick={() => handleShowChanges(change)}
                      type="button"
                      className="w-32 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      View Changes
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div>
                    <button
                      type="button"
                      className="w-32 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Run Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {selected && (
        <ChangesModal
          newContent={selected.sharepointFileChange.newContent}
          oldContent={selected.sharepointFileChange.oldContent}
          open={open}
          onClose={onChangeModalClose}
        />
      )}
    </main>
  );
}

function ChangesModal(props: {
  open: boolean;
  onClose: (open: boolean) => void;
  oldContent: string | null;
  newContent: string;
}) {
  const { open, onClose } = props;
  const diff = htmlDiff(props.oldContent ?? "", props.newContent);
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <DisplayChangesEditor diff={diff} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
