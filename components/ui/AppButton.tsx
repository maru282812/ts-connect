"use client";

import { Button, type ButtonProps } from "@heroui/react";
import clsx from "clsx";

type AppButtonVariant = "primary" | "secondary" | "sub" | "disabled";

interface AppButtonProps
  extends Omit<ButtonProps, "color" | "radius" | "size" | "variant"> {
  variantType?: AppButtonVariant;
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  sub: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  disabled: "bg-default-100 text-default-400",
};

export function AppButton({
  variantType = "primary",
  className,
  isDisabled,
  ...props
}: AppButtonProps) {
  return (
    <Button
      radius="none"
      size="md"
      variant="solid"
      isDisabled={isDisabled}
      className={clsx(
        "h-10 min-w-[120px] px-5 text-sm font-medium rounded-none shadow-none",
        variantClasses[variantType],
        isDisabled && "cursor-default pointer-events-none opacity-100",
        className,
      )}
      {...props}
    />
  );
}
