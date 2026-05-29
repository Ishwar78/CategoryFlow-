import { useState, useEffect, useCallback } from "react";

export function useQuery<T>({ queryKey, queryFn }: { queryKey: any[]; queryFn: () => Promise<T> }) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const keyString = JSON.stringify(queryKey);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await queryFn();
      setData(res);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    fetchData();
    const handler = (e: any) => {
      // Invalidate if the base queryKey matches
      if (e.detail?.queryKey && e.detail.queryKey[0] === queryKey[0]) {
        fetchData();
      }
    };
    window.addEventListener("invalidateQueries", handler);
    return () => window.removeEventListener("invalidateQueries", handler);
  }, [fetchData, keyString]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useMutation<TData = any, TVariables = void>({ mutationFn, onSuccess, onError }: any) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (variables: TVariables) => {
    setIsPending(true);
    try {
      const res = await mutationFn(variables);
      if (onSuccess) onSuccess(res);
    } catch (e) {
      if (onError) onError(e);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}

export function useQueryClient() {
  return {
    invalidateQueries: ({ queryKey }: { queryKey: any[] }) => {
      window.dispatchEvent(new CustomEvent("invalidateQueries", { detail: { queryKey } }));
    }
  };
}
