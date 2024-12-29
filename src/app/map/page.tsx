import MapLayout from '@/components/ui/map/map-layout';

import React from 'react'
import { Toaster } from 'react-hot-toast';

export default function MapPage() {
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
            <MapLayout />
        </div>
    )
}