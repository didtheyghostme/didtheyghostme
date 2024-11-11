import { extendVariants, Chip as NextUIChip } from "@nextui-org/react";

export const CustomChip = extendVariants(NextUIChip, {
  variants: {
    variant: {
      flat: {}, // Register flat variant
    },
    color: {
      primary: {}, // Register primary color
      secondary: {}, // Register secondary color
    },
  },
  compoundVariants: [
    {
      variant: "flat",
      color: "primary",
      class: "text-primary",
    },
    {
      variant: "flat",
      color: "secondary",
      class: "text-secondary",
    },
  ],
});
