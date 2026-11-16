import { isAxiosError } from "axios";

type ErrorEnvelope = {
  message: string;
  status: number;
  error: string;
  timestamp: string;
  path: string;
};

export type ApiFailure =
  | { kind: "canceled" }
  | ({ kind: "envelope" } & ErrorEnvelope)
  | { kind: "fields"; fields: Record<string, string> }
  | { kind: "network" }
  | { kind: "http"; status: number }
  | { kind: "unknown" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEnvelope(value: unknown): ErrorEnvelope | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.message !== "string" ||
    typeof value.status !== "number" ||
    typeof value.error !== "string" ||
    typeof value.timestamp !== "string" ||
    typeof value.path !== "string"
  ) {
    return null;
  }
  return {
    message: value.message,
    status: value.status,
    error: value.error,
    timestamp: value.timestamp,
    path: value.path,
  };
}

function readFieldMap(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) {
    return null;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return null;
  }
  const fields: Record<string, string> = {};
  for (const [field, message] of entries) {
    if (typeof message !== "string") {
      return null;
    }
    fields[field] = message;
  }
  return fields;
}

export function describeFailure(error: unknown): ApiFailure {
  if (!isAxiosError(error)) {
    return { kind: "unknown" };
  }
  if (error.code === "ERR_CANCELED") {
    return { kind: "canceled" };
  }
  const body: unknown = error.response?.data;
  const envelope = readEnvelope(body);
  if (envelope) {
    return { kind: "envelope", ...envelope };
  }
  const fields = readFieldMap(body);
  if (fields) {
    return { kind: "fields", fields };
  }
  const status = error.response?.status;
  if (status === undefined) {
    return { kind: "network" };
  }
  return { kind: "http", status };
}

export function failureMessage(failure: ApiFailure): string {
  switch (failure.kind) {
    case "envelope":
      return failure.message;
    case "fields":
      return Object.entries(failure.fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join("; ");
    case "network":
      return "Network request failed";
    case "http":
      return `Request failed (${failure.status})`;
    case "canceled":
      return "Request canceled";
    case "unknown":
      return "Request failed";
    default: {
      const unreachable: never = failure;
      return unreachable;
    }
  }
}
