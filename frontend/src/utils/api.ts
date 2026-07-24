// 本地开发使用 http://localhost（Nginx 监听口），生产环境或 IP 访问使用相对路径以适配真实域名
export const API_BASE =
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost'
    : '';

/**
 * 封装前端 API fetch 请求工具函数
 * 自动从 localStorage 读取 lightnews_token 并注入 Authorization: Bearer <token> 请求头
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {

  const token = localStorage.getItem('lightnews_token');
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('lightnews_token');
  }

  return res;
}

