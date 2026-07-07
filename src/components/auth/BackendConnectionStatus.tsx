'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  fetchBackendTest,
  type BackendTestResponse,
} from '@/lib/request/api/health.requests';

export function BackendConnectionStatus() {
  const [data, setData] = useState<BackendTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchBackendTest()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '后端连接失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Alert className="max-w-md">
        <AlertTitle>后端连接检测</AlertTitle>
        <AlertDescription>正在请求 /api/test …</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>后端未连通</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data?.ok) {
    return (
      <Alert variant="warning" className="max-w-md">
        <AlertTitle>后端响应异常</AlertTitle>
        <AlertDescription>接口返回 ok=false</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="max-w-md border-emerald-500/50 bg-emerald-500/10">
      <AlertTitle>后端已连通</AlertTitle>
      <AlertDescription>
        {data.message}（{data.env}，{data.timestamp}）
      </AlertDescription>
    </Alert>
  );
}
