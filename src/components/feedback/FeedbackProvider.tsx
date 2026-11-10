import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  FeedbackContext,
  type ToastType,
  type ToastItem,
  type ConfirmOptions,
} from "./FeedbackContext";

function ToastIcon({ type }: { type: ToastType }) {
  const symbols: Record<ToastType, string> = {
    success: "✓",
    error: "×",
    warning: "!",
    info: "i",
  };

  return (
    <span
      className={`nesta-toast__icon nesta-toast__icon--${type}`}
      aria-hidden="true"
    >
      {symbols[type]}
    </span>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 3600);

    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={`nesta-toast nesta-toast--${item.type}`}
      role={item.type === "error" ? "alert" : "status"}
    >
      <ToastIcon type={item.type} />

      <p className="nesta-toast__message">{item.message}</p>

      <button
        type="button"
        className="nesta-toast__close"
        aria-label="Đóng thông báo"
        onClick={() => onDismiss(item.id)}
      >
        ×
      </button>
    </div>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(
    null,
  );

  const confirmResolver = useRef<((result: boolean) => void) | null>(null);

  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    const id = ++nextId.current;

    setToasts((current) => [
      ...current.slice(-3),
      { id, message: cleanMessage, type },
    ]);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    if (confirmResolver.current) {
      confirmResolver.current(false);
    }

    setConfirmOptions(options);

    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const finishConfirm = useCallback((result: boolean) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setConfirmOptions(null);
  }, []);

  useEffect(() => {
    if (!confirmOptions) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        finishConfirm(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmOptions, finishConfirm]);

  useEffect(() => {
    return () => {
      confirmResolver.current?.(false);
      confirmResolver.current = null;
    };
  }, []);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        className="nesta-toast-region"
        aria-label="Thông báo"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </div>

      {confirmOptions && (
        <div
          className="nesta-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              finishConfirm(false);
            }
          }}
        >
          <section
            className="nesta-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="nesta-dialog-title"
            aria-describedby="nesta-dialog-description"
          >
            <div className="nesta-dialog__mark" aria-hidden="true">
              ?
            </div>

            <h2 id="nesta-dialog-title" className="nesta-dialog__title">
              {confirmOptions.title ?? "Xác nhận thao tác"}
            </h2>

            <p id="nesta-dialog-description" className="nesta-dialog__message">
              {confirmOptions.message}
            </p>

            <div className="nesta-dialog__actions">
              <button
                type="button"
                className="nesta-dialog__cancel"
                onClick={() => finishConfirm(false)}
              >
                {confirmOptions.cancelText ?? "Hủy"}
              </button>

              <button
                type="button"
                autoFocus
                className={`nesta-dialog__confirm${
                  confirmOptions.danger ? " nesta-dialog__confirm--danger" : ""
                }`}
                onClick={() => finishConfirm(true)}
              >
                {confirmOptions.confirmText ?? "Xác nhận"}
              </button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
