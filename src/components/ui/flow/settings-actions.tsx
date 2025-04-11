import React from 'react'
import { Input } from "@/components/ui/input"
import { Node } from '@xyflow/react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"



const settingsInputs: { [key: string]: any[] } = {
    "http-request": [
        { id: "url", label: "Url", type: "url" },
        {
            id: "method", label: "Method", type: "select", options: [
                "GET",
                "POST",
                "PUT",
                "DELETE"
            ]
        },
    ],
    "export": [
        { id: "name", label: "Name", type: "text" },
        {
            id: "type", label: "Type", type: "select", options: [
                "Text",
                "CSV",
                "JSON",
                "GEOJSON",
                "Excel",
            ]
        },
    ]
}


function SettingActions({
    selectedNode,
    updateNodeProperties
}: {
    selectedNode: Node | null,
    updateNodeProperties: (node: Partial<Node>) => void
}) {

    const handleInputChange = (value: string, id: string) => {
        updateNodeProperties({ ...selectedNode?.data, metadata: { ...selectedNode?.data?.metadata, [id]: value } })
    }
    return (
        <div>
            <div>
                <label htmlFor="nodeLabel" className="mr-2 text-xs">Label:</label>
                <Input
                    id="nodeLabel"
                    type="text"
                    value={selectedNode?.data.label}
                    onChange={(e) => updateNodeProperties({ label: e.target.value })}
                    className="border rounded"
                />
            </div>
            <div>
                <label htmlFor="DescLabel" className="mr-2 text-xs">Description:</label>
                <Input
                    id="DescLabel"
                    type="text"
                    value={selectedNode?.data?.desc}
                    onChange={(e) => updateNodeProperties({ desc: e.target.value })}
                    className="border rounded"
                />
            </div>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className='text-xs'>Actions</AccordionTrigger>
                    <AccordionContent className='px-1'>
                        {selectedNode && selectedNode.type && settingsInputs[selectedNode.type]?.map((input: {
                            id: string;
                            label: string;
                            type: string;
                            options?: string[];
                        }) => {
                            const metadata = selectedNode.data?.metadata as Record<string, string>;
                            const value = metadata?.[input.id] ?? "";

                            return (
                                <div key={input.id}>
                                    <label htmlFor={input.id} className="mr-2 text-xs">
                                        {input.label}:
                                    </label>
                                    {input.type === "text" || input.type === "url" ? (
                                        <Input
                                            id={input.id}
                                            type={input.type}
                                            value={value}
                                            onChange={(e) => handleInputChange(e.target.value, input.id)}
                                            className="border rounded"
                                        />
                                    ) : (
                                        <Select 
                                            value={value}
                                            onValueChange={(e) => handleInputChange(e, input.id)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={`Select ${input.label}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {input.options?.map((value) => (
                                                    <SelectItem key={value} value={value}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            );
                        })}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

        </div>
    )
}

export default SettingActions