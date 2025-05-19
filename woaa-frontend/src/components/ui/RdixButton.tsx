// src/components/ui/RadixButton.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
}

const RadixButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-xs px-2 py-1 font-medium transition-colors
          bg-opacity-90 hover:bg-opacity-100 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500
          disabled:opacity-50 disabled:pointer-events-none ${className}`}
        {...props}
      />
    );
  }
);

RadixButton.displayName = "RadixButton";

export default RadixButton;
