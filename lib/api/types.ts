import type { ApiUser } from "@/types";

export interface ApiContext {
  request: Request;
  url: URL;
  method: string;
  segments: string[];
  body: Record<string, unknown>;
  user?: ApiUser & Record<string, unknown>;
  tokenId?: number;
}

export interface HandledResult {
  data: unknown;
  status?: number;
}
