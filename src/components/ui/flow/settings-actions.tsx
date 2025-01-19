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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"



const settingsInputs: { [key: string]: any[] } = {
    "http-request": [
        { id: "url", label: "Url", type: "url" },
        {
            id: "type", label: "Type", type: "select", options: [
                "GET",
                "POST",
                "PUT",
                "DELETE"
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
    return (
        <div>
            <div>
                <label htmlFor="nodeLabel" className="mr-2 text-xs">Label:</label>
                <Input
                    id="nodeLabel"
                    type="text"
                    value={selectedNode.data.label}
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
                        {selectedNode && settingsInputs[selectedNode?.type]?.map((input) => (
                            <div key={input.id}>
                                <label htmlFor={input.id} className="mr-2 text-xs">{input.label}:</label>
                                {input.type == "text" || input.type == "url" ? (
                                    <Input
                                        id={input.id}
                                        type={input.type}
                                        value={selectedNode.data[input.id]}
                                        onChange={(e) => updateNodeProperties({ [input.id]: e.target.value })}
                                        className="border rounded"
                                    />

                                ) : (
                                    // <Select onValueChange={(e) => console.log(e) }>
                                    <Select onValueChange={(e) => updateNodeProperties({ [input.id]: e })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={`Select ${input.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {input.options.map((value: string, index: number) => (
                                                <SelectItem key={index} value={value}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

        </div>
    )
}

export default SettingActions