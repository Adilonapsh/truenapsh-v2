import { MapRef } from "react-map-gl";
import {
    bufferLayers,
    clipLayers,
    differenceLayers,
    linesToPolygonLayers,
    centroidLayers,
    polygonToLinesLayers,
    hexagonLayer,
    removeDuplicatesLayers,
    pointAlongLinesLayers,
    simplifyLayers,
    buildingLayers,
    elevationLayers,
    addGeojsonToMap
} from "./map-tools";
import { FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

export const executeOperation = async (
    operationName: string,
    options: Record<string, any>,
    mapRef: any,
    layersCount: number
): Promise<void> => {
    const map = mapRef?.current?.getMap() || mapRef;
    const lowerName = operationName.toLowerCase();

    switch (lowerName) {
        case "buffer": {
            const { targetLayer, bufferDistance, units } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = bufferLayers(data, Number(bufferDistance), units);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Buffer ${bufferDistance} ${units}`,
                });
            }
            break;
        }

        case "clip": {
            const { sourceLayer, targetLayer } = options;
            const srcSource = map?.getLayer(sourceLayer)?.source;
            const tgtSource = map?.getLayer(targetLayer)?.source;
            const srcData = srcSource ? map?.getSource(srcSource)?.serialize().data : undefined;
            const tgtData = tgtSource ? map?.getSource(tgtSource)?.serialize().data : undefined;
            const result = await clipLayers(srcData, tgtData);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Clipped ${layersCount + 1}`,
                });
            }
            break;
        }

        case "difference": {
            const { sourceLayer, targetLayer } = options;
            const srcSource = map?.getLayer(sourceLayer)?.source;
            const tgtSource = map?.getLayer(targetLayer)?.source;
            const srcData = srcSource ? map?.getSource(srcSource)?.serialize().data : undefined;
            const tgtData = tgtSource ? map?.getSource(tgtSource)?.serialize().data : undefined;
            const result = await differenceLayers(srcData, tgtData);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Difference ${layersCount + 1}`,
                });
            }
            break;
        }

        case "lines to polygon": {
            const { targetLayer } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await linesToPolygonLayers(data);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Polygon ${layersCount + 1}`,
                });
            }
            break;
        }

        case "centroid": {
            const { targetLayer } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await centroidLayers(data);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Centroid ${layersCount + 1}`,
                });
            }
            break;
        }

        case "polygon to lines": {
            const { targetLayer } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await polygonToLinesLayers(data);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Lines ${layersCount + 1}`,
                });
            }
            break;
        }

        case "hexagon grid": {
            const { targetLayer, cellSize, units, gridCode } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await hexagonLayer(data, Number(cellSize), units, gridCode);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Hexagon ${layersCount + 1}`,
                });
            }
            break;
        }

        case "remove duplicates": {
            const { targetLayer } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await removeDuplicatesLayers(data);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Clean ${layersCount + 1}`,
                });
            }
            break;
        }

        case "generate points along line": {
            const { targetLayer, interval, units } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await pointAlongLinesLayers(data, Number(interval), units);
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Points ${layersCount + 1}`,
                });
            }
            break;
        }

        case "simplify": {
            const { targetLayer, tolerance } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const result = await simplifyLayers(data, Number(tolerance));
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Simplified ${layersCount + 1}`,
                });
            }
            break;
        }

        case "building": {
            const { targetLayer, cutBuilding } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            let result = await buildingLayers(data);
            if (cutBuilding === "Extract Building" && result) {
                result = (await clipLayers(data as any, result as any)) as any;
            }
            if (result) {
                await addGeojsonToMap({
                    mapRef,
                    data: result as GeoJSON.GeoJSON,
                    layerName: `Building ${layersCount + 1}`,
                });
            }
            break;
        }

        case "elevation": {
            const { targetLayer, sourceelevation, interval, units } = options;
            const source = map?.getLayer(targetLayer)?.source;
            const data = source ? map?.getSource(source)?.serialize().data : undefined;
            const points = await pointAlongLinesLayers(data, Number(interval), units);
            if (points) {
                await elevationLayers(points as FeatureCollection<Geometry>, sourceelevation);
            }
            break;
        }

        default:
            console.warn(`Operation "${operationName}" not implemented in executor.`);
    }
};
