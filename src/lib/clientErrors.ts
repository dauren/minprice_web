export interface ClientErrorDetail {
  source: string;
  message: string;
  name?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
  }
}

export const normalizeClientError = (
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): ClientErrorDetail => {
  if (error instanceof Error) {
    return {
      source,
      message: error.message,
      name: error.name,
      stack: error.stack,
      metadata,
    };
  }

  return {
    source,
    message: typeof error === "string" ? error : "Unknown client error",
    metadata: {
      ...metadata,
      rawError: error,
    },
  };
};

export const reportClientError = (
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): ClientErrorDetail => {
  const detail = normalizeClientError(source, error, metadata);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ClientErrorDetail>("minprice:client_error", { detail }));

    const eventPayload = {
      event: "client_error",
      product_area: "client_diagnostics",
      source: detail.source,
      message: detail.message,
      name: detail.name,
      ...detail.metadata,
    };

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(eventPayload);
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "client_error", eventPayload);
    }
  }

  return detail;
};
