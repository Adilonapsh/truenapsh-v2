import * as React from "react";
import * as Slider from "@radix-ui/react-slider";

interface DoubleRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValues?: [number, number];
  onChange?: (values: [number, number]) => void;
}

export const DoubleRangeSlider: React.FC<DoubleRangeSliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  defaultValues = [25, 75],
  onChange,
}) => {
  const [values, setValues] = React.useState<[number, number]>(defaultValues);

  const handleChange = (newValues: [number, number]) => {
    setValues(newValues);
    if (onChange) onChange(newValues);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Slider.Root
        className="relative flex items-center w-full h-10"
        min={min}
        max={max}
        step={step}
        value={values}
        onValueChange={handleChange}
      >
        <Slider.Track className="relative bg-gray-200 rounded-full h-2 flex-1">
          <Slider.Range className="absolute bg-gray-800 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="w-5 h-5 bg-white border border-gray-300 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Lower Value"
        />
        <Slider.Thumb
          className="w-5 h-5 bg-white border border-gray-300 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Upper Value"
        />
      </Slider.Root>
      {/* <div className="flex justify-between mt-4 text-sm text-gray-600">
        <span>{values[0]}</span>
        <span>{values[1]}</span>
      </div> */}
    </div>
  );
};
