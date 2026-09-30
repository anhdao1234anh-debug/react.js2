// Toast store tối giản (không thư viện): gọi toast.success('...') ở bất kỳ đâu,
// <Toaster /> (render 1 lần ở RootLayout) sẽ hiển thị.
import { useSyncExternalStore } from 'react';

const DEFAULT_DURATION = 4000;

let toasts = [];
let nextId = 0;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export const toast = {
  /** @param {{ type?: 'success'|'error'|'info', title: string, description?: string, duration?: number }} options */
  show({ type = 'info', title, description, duration = DEFAULT_DURATION }) {
    nextId += 1;
    const item = { id: nextId, type, title, description };
    toasts = [...toasts, item];
    emit();
    if (duration > 0) setTimeout(() => toast.dismiss(item.id), duration);
    return item.id;
  },
  success: (title, description) => toast.show({ type: 'success', title, description }),
  error: (title, description) => toast.show({ type: 'error', title, description }),
  info: (title, description) => toast.show({ type: 'info', title, description }),
  dismiss(id) {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
  },
  clear() {
    toasts = [];
    emit();
  },
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => toasts;

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
