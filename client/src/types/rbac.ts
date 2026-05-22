// PIE Digital NR-10 — Role-Based Access Control (RBAC) types

export type UserRole = "admin" | "editor" | "visitor";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  nomeCompleto?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VisitorInvite {
  id: string;
  ownerUid: string;
  email: string;
  nomeCompleto?: string;
  role: "visitor";
  status: "pending" | "accepted" | "revoked";
  expiresAt?: number; // timestamp
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Permissões por role
export const PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  admin: {
    "cliente:create": true,
    "cliente:read": true,
    "cliente:update": true,
    "cliente:delete": true,
    "documento:create": true,
    "documento:read": true,
    "documento:update": true,
    "documento:delete": true,
    "relatorio:generate": true,
    "usuario:manage": true,
  },
  editor: {
    "cliente:create": false,
    "cliente:read": true,
    "cliente:update": false,
    "cliente:delete": false,
    "documento:create": true,
    "documento:read": true,
    "documento:update": true,
    "documento:delete": false,
    "relatorio:generate": true,
    "usuario:manage": false,
  },
  visitor: {
    "cliente:create": false,
    "cliente:read": true,
    "cliente:update": false,
    "cliente:delete": false,
    "documento:create": false,
    "documento:read": true,
    "documento:update": false,
    "documento:delete": false,
    "relatorio:generate": false,
    "usuario:manage": false,
  },
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  return PERMISSIONS[role]?.[permission] ?? false;
};
