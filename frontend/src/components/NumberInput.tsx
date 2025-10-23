import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  placeholder?: string;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  decimals = 0,
  placeholder,
  className
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const validateAndUpdate = (numValue: number) => {
    // Handle invalid input
    if (isNaN(numValue)) {
      numValue = min;
    }
    
    // Clamp to min/max
    numValue = Math.max(min, Math.min(max, numValue));
    
    // Round to step
    const rounded = Math.round(numValue / step) * step;
    
    // Round to decimals
    const final = decimals > 0 
      ? parseFloat(rounded.toFixed(decimals))
      : Math.round(rounded);
    
    setInputValue(final.toString());
    onChange(final);
  };

  const handleBlur = () => {
    // Remove leading zeros and parse
    const cleaned = inputValue.replace(/^0+(?=\d)/, '');
    const numValue = parseFloat(cleaned || '0');
    validateAndUpdate(numValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  };

  const increment = () => {
    const numValue = parseFloat(inputValue) || 0;
    validateAndUpdate(Math.min(max, numValue + step));
  };

  const decrement = () => {
    const numValue = parseFloat(inputValue) || 0;
    validateAndUpdate(Math.max(min, numValue - step));
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
      />
      <div className="absolute right-1 top-1 bottom-1 flex flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex-1 flex items-center justify-center hover:bg-accent rounded-t px-1 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={decrement}
          className="flex-1 flex items-center justify-center hover:bg-accent rounded-b px-1 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}