export type JsonRecord = Record<string, unknown>;

export type DbRow = Record<string, unknown>;

export interface ApiUser extends DbRow {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "customer";
  is_active: number | boolean;
}

export interface AuthenticatedRequest {
  user: ApiUser;
  tokenId: number;
}

export type FieldKind =
  | "text"
  | "email"
  | "password"
  | "number"
  | "currency"
  | "textarea"
  | "boolean"
  | "select"
  | "json"
  | "image";

export interface ResourceField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  readonly?: boolean;
  defaultValue?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface ResourceMeta {
  key: string;
  label: string;
  singular: string;
  description: string;
  icon: string;
  primaryKey: string;
  columns: Array<{ key: string; label: string; format?: string }>;
  fields: ResourceField[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deleteLabel?: string;
  deleteDescription?: string;
}
