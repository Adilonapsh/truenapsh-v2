import { Layer } from '@/types/map.types'
import { Icon, ImageIcon, SmileIcon, TextIcon } from 'lucide-react'
import { ImageError } from 'next/dist/server/image-optimizer'
import React from 'react'
import { BiGlobe } from 'react-icons/bi'
import { FaVectorSquare } from 'react-icons/fa6'

function IconLayerType({ layer, size = "13pt" }: { layer: Layer | null, size: string }) {
    return (
        <div>
            {layer?.map_service_vendor === 'Image' ? (
                <ImageIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === 'Text' ? (
                <TextIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === 'Icon' ? (
                <SmileIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === 'Geoserver' || layer?.map_service_vendor === 'ArcGIS' ? (
                <BiGlobe size={size} className='opacity-25' />
            ) : (
                <FaVectorSquare size={size} className='opacity-25' />
            )}
        </div>
    )
}

export default IconLayerType