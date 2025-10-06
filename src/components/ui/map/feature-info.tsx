import React from 'react'
import {
    InfoFeature,
    MapIsLoading
} from "@/types/map.types";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from '@/components/ui/accordion';
import M3U8VideoPlayer from '../hls';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type Props = {
    infoFeatures: InfoFeature[]
    isLoading: MapIsLoading
}

const FeatureInfo = ({ infoFeatures, isLoading }: Props) => {
    return (
        <div className="h-full overflow-auto">
            {infoFeatures.map((layer, index) => (
                <Accordion key={index} type="single" collapsible>
                    <AccordionItem
                        value={`item-${index}`}
                        className="border-none"
                    >
                        <AccordionTrigger className="capitalize hover:no-underline">
                            {layer?.layer_name}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs">
                            <table className="w-full border">
                                <tbody>
                                    {Object.keys(layer.properties).map((body, i) =>
                                        body.includes("video") ? (
                                            <tr key={i}>
                                                <th className="border border-accent text-start text-wrap w-[100px] capitalize px-2 py-1">
                                                    {body.replaceAll("_", " ")}
                                                </th>
                                                <td className="px-2 border border-accent text-wrap">
                                                    {typeof layer.properties[
                                                        body as keyof typeof layer.properties
                                                    ] === "string" &&
                                                        (
                                                            layer.properties[
                                                            body as keyof typeof layer.properties
                                                            ] as string
                                                        ).startsWith("http") ? (
                                                        <M3U8VideoPlayer
                                                            src={
                                                                layer.properties[
                                                                body as keyof typeof layer.properties
                                                                ]
                                                            }
                                                            placeholderImage="/assets/placeholder.svg"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {
                                                                layer.properties[
                                                                body as keyof typeof layer.properties
                                                                ]
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={i}>
                                                <th className="border border-accent text-start text-wrap w-[100px] capitalize px-2 py-1">
                                                    {body.replaceAll("_", " ")}
                                                </th>
                                                <td className="px-2 border border-accent text-wrap">
                                                    {
                                                        layer.properties[
                                                        body as keyof typeof layer.properties
                                                        ]
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            ))}
            {isLoading.featureInfo ? (
                <div className="flex justify-center items-center mb-5">
                    <AiOutlineLoading3Quarters
                        size={"20"}
                        className="animate-spin"
                    />
                </div>
            ) : (
                ""
            )}
        </div>
    )
}

export default FeatureInfo