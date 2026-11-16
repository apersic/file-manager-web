import axios, {
  isAxiosError,
  type AxiosAdapter,
  type AxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";
import { env, normalizeApiUrl } from "@/config/env";
import { describeFailure, failureMessage } from "@/lib/api-failure";

declare module "axios" {
  interface AxiosRequestConfig {
    formFields?: boolean;
    gone?: boolean;
  }
}

export type ApiClient = {
  get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse>;
  post<TResponse>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<TResponse>;
  delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse>;
};

type ApiClientOptions = {
  baseURL: string;
  adapter?: AxiosAdapter;
};

function responseBody<TResponse>(
  request: Promise<unknown>,
): Promise<TResponse> {
  // The success interceptor returns response.data. Axios still types the promise as the response.
  return request as Promise<TResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const settings: { baseURL: string; adapter?: AxiosAdapter } = {
    baseURL: normalizeApiUrl(options.baseURL),
  };
  if (options.adapter !== undefined) {
    settings.adapter = options.adapter;
  }

  const instance = axios.create(settings);
  instance.interceptors.response.use(
    (response) => response.data,
    (error: unknown) => {
      const failure = describeFailure(error);
      const shownOnForm =
        failure.kind === "fields" &&
        isAxiosError(error) &&
        error.config?.formFields === true;
      const alreadyGone =
        isAxiosError(error) &&
        error.config?.gone === true &&
        error.response?.status === 404;
      if (failure.kind !== "canceled" && !shownOnForm && !alreadyGone) {
        toast.error(failureMessage(failure));
      }
      return Promise.reject(error);
    },
  );

  return {
    get: <TResponse>(url: string, config?: AxiosRequestConfig) =>
      responseBody<TResponse>(
        config === undefined ? instance.get(url) : instance.get(url, config),
      ),
    post: <TResponse>(
      url: string,
      body?: unknown,
      config?: AxiosRequestConfig,
    ) =>
      responseBody<TResponse>(
        config === undefined
          ? instance.post(url, body)
          : instance.post(url, body, config),
      ),
    delete: <TResponse>(url: string, config?: AxiosRequestConfig) =>
      responseBody<TResponse>(
        config === undefined
          ? instance.delete(url)
          : instance.delete(url, config),
      ),
  };
}

export const apiClient = createApiClient({ baseURL: env.apiUrl });
