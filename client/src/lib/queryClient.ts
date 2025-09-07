import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { method?: string; url?: string; body?: unknown },
  optionsOrUrl?: string | { method?: string; body?: unknown },
  data?: unknown,
): Promise<any> {
  let url: string;
  let method: string;
  let body: unknown;

  // Handle different calling patterns
  if (typeof urlOrOptions === 'string') {
    if (typeof optionsOrUrl === 'string') {
      // Old style: apiRequest(method, url, data)
      method = urlOrOptions;
      url = optionsOrUrl;
      body = data;
    } else {
      // New style: apiRequest(url, options) or just apiRequest(url)
      url = urlOrOptions;
      method = optionsOrUrl?.method || 'GET';
      body = optionsOrUrl?.body;
    }
  } else {
    // Object style: apiRequest({method, url, body})
    url = urlOrOptions.url || '';
    method = urlOrOptions.method || 'GET';
    body = urlOrOptions.body;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Return JSON for successful responses, or just the response
  if (res.headers.get('content-type')?.includes('application/json')) {
    return await res.json();
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${window.location.origin}${queryKey.join("/")}`, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error) => {
        // Don't retry on 401 or 403 errors
        if (error.message.includes('401') || error.message.includes('403')) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on client errors (400-499)
        if (error.message.match(/^4\d\d:/)) return false;
        return failureCount < 1;
      },
    },
  },
});
