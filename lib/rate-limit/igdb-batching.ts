export const IGDB_MULTIQUERY_MAX_QUERIES = 10;
export const IGDB_MULTIQUERY_ENDPOINT = "/multiquery" as const;

export type IgdbBatchQuery = {
  endpoint: string;
  name: string;
  body: string;
};

export type IgdbMultiQueryBatch = {
  endpoint: typeof IGDB_MULTIQUERY_ENDPOINT;
  queries: IgdbBatchQuery[];
  body: string;
};

function escapeName(name: string): string {
  return name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatQuery(query: IgdbBatchQuery): string {
  const endpoint = query.endpoint.trim().replace(/^\/+/, "");
  if (!/^[a-z0-9_/-]+$/i.test(endpoint)) {
    throw new TypeError("Invalid IGDB endpoint");
  }
  const name = query.name.trim();
  if (!name) throw new TypeError("IGDB query names must not be empty");
  return `query ${endpoint} "${escapeName(name)}" {\n${query.body.trim()}\n};`;
}

export function batchIgdbQueries(
  queries: readonly IgdbBatchQuery[],
): IgdbMultiQueryBatch[] {
  const batches: IgdbMultiQueryBatch[] = [];
  for (let index = 0; index < queries.length; index += IGDB_MULTIQUERY_MAX_QUERIES) {
    const batchQueries = queries.slice(index, index + IGDB_MULTIQUERY_MAX_QUERIES);
    batches.push({
      endpoint: IGDB_MULTIQUERY_ENDPOINT,
      queries: batchQueries.map((query) => ({ ...query })),
      body: batchQueries.map(formatQuery).join("\n\n"),
    });
  }
  return batches;
}
