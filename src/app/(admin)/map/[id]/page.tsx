
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MapLayout from '@/components/ui/map/map-layout';
import { project } from '@/server/project';
import { Project } from '@/types/project.types';
import { appendFile, stat } from 'fs';
import { getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
import { Toaster } from 'react-hot-toast';

export default async function MapPage(context: { params: { id: string } }) {

    const { id } = context.params; // Pastikan params.id digunakan dengan benar
    const session = await getServerSession(authOptions);
    const status = session ? 'authenticated' : 'unauthenticated';

    if (status == "unauthenticated") {
        redirect("/auth/login");
    }


    try{
        const fetchedProject: Project = await project(id);
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
                <MapLayout layersFetch={fetchedProject?.layers ?? []} />
            </div>
        )
    }catch(error){
        console.error(error);
        redirect("/dashboard");
    }


}