const TOKEN = process.env.RESIGHTS_API_TOKEN;
const DOMAIN = process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!TOKEN) throw new Error("RESIGHTS_API_TOKEN is not set");
  const url = path.startsWith("http") ? path : `${DOMAIN}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new Error(`Resights API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

export async function getProperty(bfeNumber: string) {
  return request(`/api/v2/properties/${bfeNumber}`);
}

export async function searchProperties(body: Record<string, unknown>) {
  return request("/api/v2/properties", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getCompany(cvr: string) {
  return request(`/api/v2/cvr/companies/${cvr}`);
}

export async function searchCompanies(body: Record<string, unknown>) {
  return request("/api/v2/cvr/companies", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function searchTrades(body: Record<string, unknown>) {
  return request("/api/v2/trades", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function searchRentals(body: Record<string, unknown>) {
  return request("/api/v2/rental/v2/observations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getNetwork(cvr: string) {
  return request(`/api/v2/cvr/network/${cvr}`);
}

export async function multiIndexSearch(body: Record<string, unknown>) {
  return request("/api/v2/multi_index", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function queryDSL(): QueryDSLBuilder {
  return new QueryDSLBuilder();
}

export class QueryDSLBuilder {
  private _source: string[] = [];
  private _query: unknown[] = [];
  private _sort: unknown[] = [];
  private _aggs: Record<string, unknown> = {};
  private _size = 25;
  private _page = "";

  source(...sources: string[]) {
    this._source = sources;
    return this;
  }

  term(field: string, value: unknown) {
    this._query.push({ TermQ: { field, value } });
    return this;
  }

  terms(field: string, values: unknown[]) {
    this._query.push({ TermsQ: { field, values } });
    return this;
  }

  match(field: string, value: string) {
    this._query.push({ MatchQ: { field, value } });
    return this;
  }

  range(field: string, opts: { gte?: number; lte?: number; gt?: number; lt?: number }) {
    this._query.push({ RangeQ: { field, ...opts } });
    return this;
  }

  exists(field: string) {
    this._query.push({ ExistsQ: { field } });
    return this;
  }

  geoBBox(field: string, topLeft: [number, number], bottomRight: [number, number]) {
    this._query.push({
      GeoBBoxQ: { field, top_left: topLeft, bottom_right: bottomRight },
    });
    return this;
  }

  geoDistance(field: string, lat: number, lon: number, distance: string) {
    this._query.push({
      GeoDistanceQ: { field, lat, lon, distance },
    });
    return this;
  }

  and(...queries: unknown[]) {
    this._query.push({ Bool: { and: queries } });
    return this;
  }

  or(...queries: unknown[]) {
    this._query.push({ Bool: { or: queries } });
    return this;
  }

  not(...queries: unknown[]) {
    this._query.push({ Bool: { not: queries } });
    return this;
  }

  sortBy(field: string, order: "asc" | "desc" = "desc") {
    this._sort.push({ field, order });
    return this;
  }

  aggregate(name: string, type: string, field: string, extra?: Record<string, unknown>) {
    this._aggs[name] = { type, field, ...extra };
    return this;
  }

  limit(size: number) {
    this._size = Math.min(size, 1000);
    return this;
  }

  page(token: string) {
    this._page = token;
    return this;
  }

  build() {
    const body: Record<string, unknown> = {
      page: this._page,
      size: this._size,
    };
    if (this._source.length) body.source = this._source;
    if (this._query.length) body.query = this._query;
    if (this._sort.length) body.sort = this._sort;
    if (Object.keys(this._aggs).length) body.aggregations = this._aggs;
    return body;
  }
}
