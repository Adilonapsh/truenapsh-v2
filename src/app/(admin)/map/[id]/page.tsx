// src/app/(admin)/map/[id]/page.tsx
import { Suspense } from 'react';
import MapLayout from '@/components/ui/map/map-layout';
import { bookmark } from '@/server/bookmark';
import { get } from '@/server/dataset';
import { project } from '@/server/project';
import { Toaster } from 'react-hot-toast';

export default async function MapPage(context: { params: { id: string } }) {
    const { id } = await context.params;

    try {
        const [fetchedProject, fetchedDatasets, fetchedBookmarks] = await Promise.all([
            project(id),
            get(),
            bookmark(id)
        ]);

        return (
            <div>
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    gutter={8}
                    toastOptions={{
                        duration: 5000,
                        success: { duration: 3000 },
                    }}
                />
                <Suspense fallback={<MapSkeleton />}>
                    <MapLayout
                        layersFetch={fetchedProject?.layers ?? []}
                        datasetsFetch={fetchedDatasets?.data ?? []}
                        bookmarkFetch={Array.isArray(fetchedBookmarks?.data) ? fetchedBookmarks.data : []}
                    />
                </Suspense>
            </div>
        );
    } catch (error) {
        console.error('Error loading map data:', error);
        return <div>Error loading map. Please try again.</div>;
    }
}

function MapSkeleton() {
    return (
        <div className="h-screen w-full flex">
            <div className="w-80 bg-gray-100 animate-pulse">
                <div className="p-4 space-y-4">
                    <div className="h-6 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
            <div className="flex-1 bg-gray-200 animate-pulse">
                <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500">Loading map...</div>
                </div>
            </div>
        </div>
    );
}