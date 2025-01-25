
import MapLayout from '@/components/ui/map/map-layout';
import authUserSession from '@/lib/auth';
import { get } from '@/server/dataset';
import { project } from '@/server/project';
import { Project } from '@/types/project.types';
import { redirect } from 'next/navigation';

import { Toaster } from 'react-hot-toast';

export default async function MapPage(context: { params: { id: string } }) {

    const { id } = await context.params;
    const user = await authUserSession();
    const status = user ? 'authenticated' : 'unauthenticated';

    if (status == "unauthenticated") {
        redirect("/auth/login");
    }


    try {
        const fetchedProject: Project = await project(id);
        const fetchedDatasets = await get();
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
                <MapLayout layersFetch={fetchedProject?.layers ?? []} datasetsFetch={fetchedDatasets?.data ?? []} />
            </div>
        )
    } catch (error) {
        console.error(error);
        redirect("/dashboard");
    }


}