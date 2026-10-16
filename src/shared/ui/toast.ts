"use client";

import hotToast, {
  type Renderable,
  type ToastOptions,
  type ValueOrFunction,
} from "react-hot-toast";

type ToastPromiseMessages<T> = {
  loading: Renderable;
  success?: ValueOrFunction<Renderable, T>;
  error?: ValueOrFunction<Renderable, unknown>;
};

export const toast = {
  success(message: Renderable, options?: ToastOptions) {
    return hotToast.success(message, options);
  },
  error(message: Renderable, options?: ToastOptions) {
    return hotToast.error(message, options);
  },
  loading(message: Renderable, options?: ToastOptions) {
    return hotToast.loading(message, options);
  },
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T>,
    options?: ToastOptions,
  ) {
    return hotToast.promise(promise, messages, options);
  },
  dismiss(id?: string) {
    hotToast.dismiss(id);
  },
};
