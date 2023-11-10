import { api } from "~/utils/api";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

import {
  RunUpdateFinishedResponse,
  type GetFileChangesOutput,
  RunUpdateResponseTemporary,
} from "~/types";
import htmlDiff from "node-htmldiff";
import { DisplayChangesEditor } from "../components/editor/displayChangesEditor";
import { ResultModal } from "../components/editor/editableEditor";
import { LoadingSpinner } from "../components/loadingSpinner/loadingSpinner";

export default function Changes() {
  const context = api.useContext();

  api.fileChanges.changeSubscription.useSubscription(undefined, {
    onData: (data) => {
      void context.fileChanges.invalidate(undefined);
    },
  });
  const changes = api.fileChanges.getFileChanges.useQuery();

  return (
    <main className="flex min-h-screen w-screen flex-col items-center  gap-10 bg-slate-200 p-10">
      <h1>Changes</h1>

      <ul role="list" className="flex flex-col gap-5">
        {changes.data?.map((change) => (
          <FileChangeListItem
            key={change.sharepointFileChange.id}
            change={change}
          />
        ))}
      </ul>
    </main>
  );
}

function FileChangeListItem(props: { change: GetFileChangesOutput[number] }) {
  const [resutlModalIsOpen, setResultModalIsOpen] = useState(false);
  const [updateResult, setUpdatedResult] = useState<
    RunUpdateFinishedResponse[]
  >([]);
  const [temporaryResult, setTemporaryResult] = useState<
    RunUpdateResponseTemporary[]
  >([]);
  const [open, setOpen] = useState(false);

  const { change } = props;
  const context = api.useContext();

  const runUpdateMutation = api.fileChanges.runUpdateForChange.useMutation({
    onSuccess: async (data) => {
      // sort the data so that the order is same as in the temporary result

      setUpdatedResult(
        data
          .reverse()
          .map((item) => ({ ...item, saved: false, type: "updated" })),
      );
      setResultModalIsOpen(true);
      await context.fileChanges.getFileChanges.invalidate(undefined);
    },
  });
  api.fileChanges.nextTokenSubscription.useSubscription(
    { changeId: change.sharepointFileChange.id },
    {
      onData: (data) => {
        if (data && resutlModalIsOpen === false) {
          setResultModalIsOpen(true);
        }
        const index = temporaryResult.findIndex(
          (doc) => doc.document.itemId === data.document.itemId,
        );
        if (index !== -1) {
          const newRes = [...temporaryResult];
          newRes[index] = { ...data, type: "temporary" };
          setTemporaryResult(newRes);
          return;
        } else {
          setTemporaryResult([
            ...temporaryResult,
            { ...data, type: "temporary" },
          ]);
          return;
        }
      },
    },
  );

  function handleShowChanges() {
    setOpen(true);
  }

  function onChangeModalClose() {
    setOpen(false);
    setTemporaryResult([]);
    runUpdateMutation.reset();
  }
  function onResultModalClose(open: boolean) {
    setResultModalIsOpen(open);
    setUpdatedResult([]);
    runUpdateMutation.reset();
    void context.documents.invalidate();
  }

  return (
    <>
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
            <div className="flex justify-center gap-2">
              <div>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {change.sharepointFileChange.changeType}
                </span>
              </div>
              <div>
                <span
                  className={`${
                    change.sharepointFileChange.processed
                      ? "bg-green-50 text-green-700  ring-green-700/10"
                      : "bg-red-50 text-red-700  ring-red-700/10"
                  } inline-flex items-center rounded-md  px-2 py-1 text-xs font-medium  ring-1 ring-inset`}
                >
                  {change.sharepointFileChange.processed
                    ? "Processed"
                    : "Not Processed"}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <div>
                <button
                  onClick={() => handleShowChanges()}
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
                  disabled={
                    runUpdateMutation.isLoading ||
                    change.sharepointFileChange.processed
                  }
                  onClick={() =>
                    runUpdateMutation.mutate({
                      changeId: change.sharepointFileChange.id,
                    })
                  }
                  type="button"
                  className="w-32 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-500"
                >
                  <div className="flex flex-row justify-center gap-1">
                    {runUpdateMutation.isLoading && <LoadingSpinner />}

                    <p>Run Update</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </li>
      <ResultModal
        open={resutlModalIsOpen}
        closeModal={onResultModalClose}
        setUpdatedResult={setUpdatedResult}
        temporaryResult={temporaryResult}
        updatedResult={updateResult}
      />
      <ChangesModal
        newContent={change.sharepointFileChange.newContent}
        oldContent={change.sharepointFileChange.oldContent}
        open={open}
        onClose={onChangeModalClose}
      />
    </>
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
              <Dialog.Panel className="relative flex h-4/5 transform flex-col gap-5 overflow-hidden rounded-lg bg-white px-4 pb-8 pt-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <Dialog.Title
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  Changes
                </Dialog.Title>

                <div>
                  <DisplayChangesEditor diff={diff} />
                </div>
                <div className="flex  items-center justify-center">
                  <button
                    onClick={() => onClose(false)}
                    type="button"
                    className="rounded bg-indigo-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
