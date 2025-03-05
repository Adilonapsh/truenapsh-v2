"use client"
import Map, { NavigationControl, ScaleControl, FullscreenControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'


import React from 'react'
import { MapComponentsProps } from '@/types/map.types';


function MapView({
    onMouseMove,
    mapRef,
    onZoom,
    onZoomEnd,
    onClick,
    onLoad,
    onStyleData,
    handleDragOver,
    handleDrop,
    onRotate
}: MapComponentsProps) {
    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                ref={mapRef}
                initialViewState={{
                    longitude: 119.9213,
                    latitude: -0.8893,
                    zoom: 4.6,
                }}
                antialias={true}
                dragPan={true}
                style={{ width: "100%", height: "100vh" }}
                onZoom={onZoom}
                onClick={onClick}
                onMouseMove={onMouseMove}
                mapStyle="mapbox://styles/mapbox/streets-v9"
                hash={true}
                onLoad={onLoad}
                onStyleData={onStyleData}
                preserveDrawingBuffer={true}
                onZoomEnd={onZoomEnd}
                onRotate={onRotate}
                fadeDuration={500}
            >
                <ScaleControl />
                {/* <NavigationControl position="bottom-right" /> */}
                <FullscreenControl position="bottom-right" />
                <GeolocateControl position="bottom-right" />
            </Map>
        </div >
    )
}

export default MapView