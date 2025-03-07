"use client";

import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    switch (variant) {
      case "destructive":
        return sonnerToast.error(title, { description });
      case "success":
        return sonnerToast.success(title, { description });
      case "warning":
        return sonnerToast.warning(title, { description });
      case "info":
        return sonnerToast.info(title, { description });
      default:
        return sonnerToast(title, { description });
    }
  };

  return {
    toast,
  };
}

export { useToast };
