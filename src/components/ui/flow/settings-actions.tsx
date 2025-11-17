import React from "react";
import { Input } from "@/components/ui/input";
import { Node } from "@xyflow/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const settingsInputs: { [key: string]: any[] } = {
  //Trigger
  websocket: [
    { id: "url", label: "URL", type: "url" },
    { id: "body", label: "Body", type: "switch" },
  ],
  // Input/Output
  import: [
    { id: "file", label: "File", type: "file" },
    {
      id: "type",
      label: "Type",
      type: "select",
      options: ["Text", "CSV", "JSON", "GEOJSON", "Excel"],
      defaultValue: "Text",
    },
  ],
  export: [
    { id: "name", label: "Name", type: "text" },
    {
      id: "type",
      label: "Type",
      type: "select",
      options: ["Text", "CSV", "JSON", "GEOJSON", "Excel"],
      defaultValue: "Text",
    },
  ],
  map: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data GEOJSON to be mapped",
    },
    { id: "output", label: "Output", type: "text", tooltip: "Output GEOJSON" },
    {
      id: "expression",
      label: "Expression",
      type: "text",
      tooltip: "Expression to be mapped",
    },
    {
      id: "filter",
      label: "Filter",
      type: "text",
      tooltip: "Filter to be applied",
    },
  ],
  analytics: [
    {
      id: "name",
      label: "Name",
      type: "text",
      tooltip: "Name of the analytics",
    },
  ],
  "http-request": [
    {
      id: "method",
      label: "Method",
      type: "select",
      options: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
      defaultValue: "GET",
    },
    { id: "url", label: "URL", type: "url" },
    { id: "body", label: "Body", type: "switch" },
  ],
  // Data Preparation
  select: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be selected",
    },
  ],
  "order-by": [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be ordered",
    },
    {
      id: "order",
      label: "Order",
      type: "select",
      options: ["Ascending", "Descending"],
      defaultValue: "Ascending",
    },
  ],
  limit: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be limited",
    },
    {
      id: "limit",
      label: "Limit",
      type: "number",
      tooltip: "Limit of the data",
    },
  ],
  filter: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be filtered",
    },
    {
      id: "filter",
      label: "Filter",
      type: "text",
      tooltip: "Filter to be applied",
    },
  ],
  join: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be joined",
    },
    {
      id: "join",
      label: "Join",
      type: "text",
      tooltip: "Join to be applied",
    },
  ],
  "group-by": [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be grouped",
    },
    {
      id: "group",
      label: "Group",
      type: "text",
      tooltip: "Group to be applied",
    },
  ],
  count: [
    {
      id: "data",
      label: "Data",
      type: "text",
      tooltip: "Data to be counted",
    },
  ],
  // Geoprocessing
  boundary: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
    {
      id: "layer-overlay",
      label: "Layer overlay",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  buffer: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
    {
      id: "buffer",
      label: "Buffer",
      type: "number",
      tooltip: "Buffer to be applied",
    },
    {
      id: "unit",
      label: "Unit",
      type: "select",
      options: ["Meter", "Kilometer", "Mile"],
      defaultValue: "Meter",
    },
    {
      id: "buffer-type",
      label: "Buffer Type",
      type: "select",
      options: ["Simple", "Dissolve"],
      defaultValue: "Simple",
    },
  ],
  clip: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
    {
      id: "layer-overlay",
      label: "Layer overlay",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  difference: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
    {
      id: "layer-overlay",
      label: "Layer overlay",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  intersection: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
    {
      id: "layer-overlay",
      label: "Layer overlay",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  //  Geometry
  centroid: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  "lines-to-polygon": [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  "polygon-to-lines": [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  "remove-duplicates": [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  "generate-points": [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  simplify: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  // Analysis
  "hexagon-grid": [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  // Integration
  building: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
  elevation: [
    {
      id: "layer-input",
      label: "Layer Input",
      type: "text",
      tooltip: "Layer to be boundary",
    },
  ],
};

const SettingActions = ({
  selectedNode,
  updateNodeProperties,
}: {
  selectedNode: Node | null;
  updateNodeProperties: (data: object) => void;
}) => {
  const handleInputChange = (value: string, id: string) => {
    updateNodeProperties({
      parameters: {
        ...(selectedNode?.data?.parameters || {}),
        [id]: value,
      },
    });
  };
  return (
    <div>
      <div>
        <label htmlFor="nodeLabel" className="mr-2 text-xs">
          Label:
        </label>
        <Input
          id="nodeLabel"
          type="text"
          value={selectedNode?.data?.label?.toString() || ""}
          onChange={(e) =>
            updateNodeProperties({
              label: e.target.value,
            })
          }
          className="border rounded"
        />
      </div>
      <div>
        <label htmlFor="DescLabel" className="mr-2 text-xs">
          Description:
        </label>
        <Input
          id="DescLabel"
          type="text"
          value={selectedNode?.data?.desc?.toString() || ""}
          onChange={(e) =>
            updateNodeProperties({
              desc: e.target.value,
            })
          }
          className="border rounded"
        />
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xs">Actions</AccordionTrigger>
          <AccordionContent className="px-1">
            {selectedNode &&
              selectedNode.type &&
              settingsInputs[selectedNode.type]?.map(
                (input: {
                  id: string;
                  label: string;
                  type: string;
                  options?: string[];
                }) => {
                  const metadata = selectedNode.data?.parameters as Record<
                    string,
                    string
                  >;
                  const value = metadata?.[input.id] ?? "";

                  return (
                    <div
                      key={input.id}
                      className={`mt-3 ${
                        input.type === "switch"
                          ? "flex gap-2 items-center"
                          : "flex flex-col gap-2"
                      }`}
                    >
                      <label htmlFor={input.id} className="mr-2 text-xs">
                        {input.label}:
                      </label>
                      {input.type === "text" || input.type === "url" ? (
                        <Input
                          id={input.id}
                          type={input.type}
                          value={value}
                          onChange={(e) => {
                            handleInputChange(e.target.value, input.id);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const payload = e.dataTransfer.getData(
                              "application/variable"
                            );
                            if (payload) {
                              const next = value
                                ? `${value} ${payload}`
                                : payload;
                              handleInputChange(next, input.id);
                            }
                          }}
                          className="border rounded"
                        />
                      ) : input.type === "file" ? (
                        <div className="flex flex-col gap-2">
                          <Input
                            id={input.id}
                            type="file"
                            accept={(() => {
                              const t = (selectedNode?.data?.parameters as Record<string, any>)?.type;
                              if (t === "CSV") return ".csv";
                              if (t === "JSON") return ".json";
                              if (t === "GEOJSON") return ".geojson,.json";
                              if (t === "Excel") return ".xlsx,.xls";
                              return "*";
                            })()}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const content = String(reader.result ?? "");
                                updateNodeProperties({
                                  parameters: {
                                    ...(selectedNode?.data?.parameters || {}),
                                    [input.id]: content,
                                    fileName: file.name,
                                  },
                                });
                              };
                              reader.readAsText(file);
                            }}
                            className="border rounded"
                          />
                          {(selectedNode?.data?.parameters as Record<string, any>)?.fileName && (
                            <span className="text-[10px] text-muted-foreground">
                              Selected: {(selectedNode?.data?.parameters as Record<string, any>)?.fileName}
                            </span>
                          )}
                        </div>
                      ) : input.type === "switch" ? (
                        <div className="inline-flex items-center cursor-pointer">
                          <Switch
                            className="rounded-full bg-gray-300 transition-colors duration-200"
                            id={input.id}
                            checked={value === "true"}
                            defaultChecked={
                              (input as any).defaultValue === "true"
                            }
                            onCheckedChange={(checked) =>
                              handleInputChange(
                                checked ? "true" : "false",
                                input.id
                              )
                            }
                          />
                        </div>
                      ) : input.type === "number" ? (
                        <Input
                          id={input.id}
                          type="number"
                          value={value}
                          onChange={(e) =>
                            handleInputChange(e.target.value, input.id)
                          }
                          className="border rounded"
                        />
                      ) : (
                        <Select
                          value={value || (input as any).defaultValue || ""}
                          onValueChange={(e) => handleInputChange(e, input.id)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={`Select ${input.label}`}
                            />
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
                }
              )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SettingActions;
