import { Layer, MapServiceVendor } from '@/types/map.types'
import { TransparencyGridIcon } from '@radix-ui/react-icons'
import { GridIcon, Icon, ImageIcon, SmileIcon, TextIcon } from 'lucide-react'
import { ImageError } from 'next/dist/server/image-optimizer'
import React from 'react'
import { BiGlobe } from 'react-icons/bi'
import { FaVectorSquare } from 'react-icons/fa6'
import { HiCubeTransparent } from 'react-icons/hi'

function IconLayerType({ layer, size = "13pt" }: { layer: Layer | null, size: string }) {
    return (
        <div>
            {layer?.map_service_vendor === MapServiceVendor.Image ? (
                <ImageIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === MapServiceVendor.Text ? (
                <TextIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === MapServiceVendor.Icon ? (
                <SmileIcon size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === MapServiceVendor.GeoJSON || layer?.map_service_vendor === MapServiceVendor.ArcGIS ? (
                <BiGlobe size={size} className='opacity-25' />
            ) : layer?.map_service_vendor === MapServiceVendor.XYZ ? (
                <GridIcon size={size} className='opacity-25' />
            ) : (
                <FaVectorSquare size={size} className='opacity-25' />
            )}
        </div>
    )
}

export default IconLayerType