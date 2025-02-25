"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";

interface DialogState {
  isOpen: boolean;
}

interface SyncDialogState extends DialogState {
  defaultIssueKey?: string;
  onSuccess?: () => void;
}

interface DialogContextType<T extends DialogState = DialogState> {
  state: T;
  open: (options?: Partial<T>) => void;
  openFromEvent: (options?: Partial<T>) => React.MouseEventHandler;
  close: () => void;
  setState: React.Dispatch<React.SetStateAction<T>>;
}

function createDialogContext<T extends DialogState = DialogState>(
  name: string
) {
  const DialogContext = createContext<DialogContextType<T> | undefined>(
    undefined
  );

  function DialogProvider({
    children,
    initialState,
  }: {
    children: React.ReactNode;
    initialState?: Partial<T>;
  }) {
    const [state, setState] = useState<T>({
      isOpen: false,
      ...initialState,
    } as T);

    const open = (options?: Partial<T>) =>
      setState((prev) => ({ ...prev, ...options, isOpen: true }));

    const openFromEvent =
      (options?: Partial<T>): React.MouseEventHandler =>
      (e) => {
        e.stopPropagation();
        open(options);
      };

    const close = () =>
      setState((prev) => ({
        ...prev,
        isOpen: false,
        defaultIssueKey: undefined,
      }));

    return (
      <DialogContext.Provider
        value={{ state, setState, open, openFromEvent, close }}
      >
        {children}
      </DialogContext.Provider>
    );
  }

  function useDialog() {
    const context = useContext(DialogContext);
    if (context === undefined) {
      throw new Error(
        `use${name}Dialog must be used within a ${name}DialogProvider`
      );
    }
    return context;
  }

  return {
    Provider: DialogProvider,
    useDialog,
  };
}

// Create and export a single instance for the sync dialog
export const { Provider: SyncDialogProvider, useDialog: useSyncDialog } =
  createDialogContext<SyncDialogState>("Sync");
