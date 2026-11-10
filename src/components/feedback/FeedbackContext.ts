import { createContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export type FeedbackContextValue = {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};
