
import MapLayout2 from '@/components/ui/map/map-layout-2';
import { bookmark } from '@/server/bookmark';
import { get } from '@/server/dataset';
import { project } from '@/server/project';
import { Project } from '@/types/project.types';
import { redirect } from 'next/navigation';

import { Toaster } from 'react-hot-toast';

export default async function MapPage(context: { params: { id: string } }) {

    const { id } = await context.params;

    try {
        const fetchedProject: Project = await project('9ddd87f7-30a5-49ff-a7ca-07308c8060c8');
        const fetchedDatasets = await get();
        const fetchedBookmarks = await bookmark(id);
        return (
            <div>
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    gutter={8}
                    containerClassName=""
                    containerStyle={{}}
                    toastOptions={{
                        className: '',
                        duration: 5000,
                        // style: {
                        //     background: '#363636',
                        //     color: '#fff',
                        // },
                        success: {
                            duration: 3000,
                        },
                    }}
                />
                <MapLayout2 layersFetch={fetchedProject?.layers ?? []} datasetsFetch={fetchedDatasets?.data ?? []} bookmarkFetch={fetchedBookmarks?.data ?? []} />
            </div>
        )
    } catch (error) {
        console.error(error);
        redirect("/admin/dashboard");
    }


}