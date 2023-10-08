import { api } from "~/utils/api";

export default function Sharepoint() {
  const context = api.useContext();
  const sites = api.sharepoint.sites.useQuery(undefined, {
    staleTime: Infinity,
  });

  const updateSitesMutation = api.sharepoint.update.useMutation({
    onSuccess: async () => {
      await context.sharepoint.invalidate(undefined);
    },
  });

  function handleCheckboxChange(
    event: React.ChangeEvent<HTMLInputElement>,
    siteId: string,
    driveId: string,
  ) {
    const { checked } = event.target;
    const site = sites.data?.find(
      (site) => site.siteId === siteId && site.driveId === driveId,
    );
    if (site === undefined) return;

    context.sharepoint.sites.setData(undefined, (prev) => {
      return prev?.map((prevSite) => {
        if (prevSite.siteId === siteId && prevSite.driveId === driveId) {
          return {
            ...prevSite,
            synced: checked,
          };
        }
        return prevSite;
      });
    });
  }

  function handleSave() {
    if (sites.data === undefined) return;
    updateSitesMutation.mutate(sites.data);
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center gap-5 bg-slate-200 p-10 ">
      <h1>Sharepoint</h1>
      {sites.isLoading && <p>Loading...</p>}
      {sites.isError && <p>Error: {sites.error.message}</p>}
      {sites.data && (
        <ul className="max-w-2xl divide-y divide-gray-800 bg-white p-10">
          {sites.data
            .sort((a, b) => {
              const res = a.siteName.localeCompare(b.siteName);
              if (res === 0) {
                return a.driveName.localeCompare(b.driveName);
              }
              return res;
            })
            .map((site) => (
              <li key={`${site.siteId}-${site.driveId}`} className="py-5">
                <div className="relative flex justify-between gap-2">
                  <div className="ml-3 text-sm leading-6">
                    <p>
                      {site.siteName} - {site.driveName}
                    </p>
                  </div>
                  <div className="flex h-6 items-center">
                    <input
                      type="checkbox"
                      onChange={(event) =>
                        handleCheckboxChange(event, site.siteId, site.driveId)
                      }
                      checked={site.synced}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}
      <button
        onClick={handleSave}
        type="button"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Save
      </button>
    </main>
  );
}
