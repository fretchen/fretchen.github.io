export interface ScwEvent {
  httpMethod: string;
  headers: Record<string, string>;
  body: string | Record<string, unknown> | null;
  path?: string;
  queryStringParameters?: Record<string, string>;
}
