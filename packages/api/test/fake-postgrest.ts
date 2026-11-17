/**
 * Imitación mínima de PostgREST para probar los repositorios con el cliente real de
 * supabase-js: filtros eq / not.in, select con fotos embebidas, upsert y delete.
 */
type Row = Record<string, unknown>;

export function createFakePostgrest() {
  const tables: Record<string, Row[]> = { customers: [], addresses: [], gardens: [], garden_photos: [], quotes: [] };
  const requests: string[] = [];

  const filtersOf = (params: URLSearchParams) =>
    [...params.entries()].filter(([k]) => !['select', 'columns', 'on_conflict', 'limit'].includes(k));

  const matches = (row: Row, filters: [string, string][]) =>
    filters.every(([col, expr]) => {
      const value = String(row[col]);
      if (expr.startsWith('eq.')) return value === expr.slice(3);
      if (expr.startsWith('not.in.(')) return !expr.slice(8, -1).split(',').map((v) => v.replace(/^"|"$/g, '')).includes(value);
      throw new Error(`Filtro no soportado: ${col}=${expr}`);
    });

  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? 'GET').toUpperCase();
    const table = url.pathname.replace('/rest/v1/', '');
    requests.push(`${method} ${table}?${decodeURIComponent(url.searchParams.toString())}`);
    const rows = tables[table];
    if (!rows) return new Response(JSON.stringify({ message: `no existe ${table}` }), { status: 404 });
    const filters = filtersOf(url.searchParams);
    const headers = new Headers(init?.headers);

    if (method === 'GET') {
      const select = url.searchParams.get('select') ?? '*';
      let result = rows.filter((r) => matches(r, filters)).map((r) => ({ ...r }));
      if (select.includes('garden_photos(*)')) {
        result = result.map((r) => ({ ...r, garden_photos: tables.garden_photos!.filter((p) => p.garden_id === r.id) }));
      }
      if (headers.get('Accept')?.includes('vnd.pgrst.object')) {
        if (result.length > 1) return new Response(JSON.stringify({ message: 'varias filas' }), { status: 406 });
        return new Response(result[0] ? JSON.stringify(result[0]) : 'null', { status: 200 });
      }
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Range': `0-${result.length}/*` } });
    }
    if (method === 'POST') {
      const body = JSON.parse(String(init?.body));
      for (const item of Array.isArray(body) ? body : [body]) {
        const i = rows.findIndex((r) => r.id === item.id);
        if (i === -1) rows.push(item);
        else rows[i] = { ...rows[i], ...item };
      }
      return new Response(null, { status: 201 });
    }
    if (method === 'DELETE') {
      tables[table] = rows.filter((r) => !matches(r, filters));
      return new Response(null, { status: 204 });
    }
    throw new Error(`Método no soportado: ${method}`);
  };

  return { fetch, tables, requests };
}
