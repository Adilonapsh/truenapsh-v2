import MapLayout from "@/components/ui/map/map-layout";
import { bookmark } from "@/server/bookmark";
import { get } from "@/server/dataset";
import { project } from "@/server/project";
import { Bookmark, BookmarkResponse } from "@/types/bookmark.types";
import { Datasets } from "@/types/datasets.types";
import { Project } from "@/types/project.types";
import { redirect } from "next/navigation";

import { Toaster } from "react-hot-toast";

type MapPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MapPage({ params }: MapPageProps) {
  const { id } = await params;

  try {
    const [projectResult, datasetsResult, bookmarksResult] =
      await Promise.allSettled([project(id), get(), bookmark(id)]);

    const fetchedProject =
      projectResult.status === "fulfilled" ? projectResult.value : null;
    const fetchedDatasets =
      datasetsResult.status === "fulfilled" ? datasetsResult.value : null;
    const fetchedBookmarks =
      bookmarksResult.status === "fulfilled" ? bookmarksResult.value : null;

    // Handle case where project is not found or invalid
    if (!fetchedProject) {
      redirect("/admin/dashboard");
    }

    return (
      <div>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: "",
            duration: 5000,
            success: {
              duration: 3000,
            },
          }}
        />
        <MapLayout
          layersFetch={(fetchedProject as Project)?.layers ?? []}
          datasetsFetch={(fetchedDatasets as Datasets[]) ?? []}
          bookmarkFetch={
            ((fetchedBookmarks as BookmarkResponse[])
              ?.map((b) => b.data)
              .flat() as Bookmark[]) ?? []
          }
        />
      </div>
    );
  } catch (error) {
    console.error("Error in MapPage:", error);
    redirect("/admin/dashboard");
  }
}
