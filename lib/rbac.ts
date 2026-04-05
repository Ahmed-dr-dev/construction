import { type UserRole } from '@/types/database';

export type { UserRole };

// -------------------------------------------------------
// Matrice des permissions : route préfixe → rôles autorisés
// (trié du plus spécifique au plus général)
// -------------------------------------------------------
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin seul
  '/dashboard/activity-logs':      ['admin'],
  '/dashboard/comptable-accounts': ['admin'],
  // Comptabilité
  '/dashboard/comptable':          ['admin', 'comptable'],
  // Admin + Responsable
  '/dashboard/suppliers':          ['admin', 'responsable'],
  '/dashboard/supplier-orders':    ['admin', 'responsable'],
  '/dashboard/invoices':           ['admin', 'responsable', 'comptable'],
  '/dashboard/profitability':      ['admin', 'responsable'],
  '/dashboard/recommendations':    ['admin', 'responsable'],
  '/dashboard/assistant':          ['admin', 'responsable'],
  // Admin + Responsable + Personnel
  '/dashboard/products':           ['admin', 'responsable', 'personnel'],
  '/dashboard/sales':              ['admin', 'responsable', 'personnel'],
  '/dashboard/clients':            ['admin', 'responsable', 'personnel'],
  // Tous les rôles staff
  '/dashboard':                    ['admin', 'responsable', 'personnel', 'comptable', 'employee'],
};

export function hasPermission(role: UserRole, path: string): boolean {
  const sorted = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (path === route || path.startsWith(route + '/')) {
      return ROUTE_PERMISSIONS[route].includes(role);
    }
  }
  return true;
}

export function getDefaultRoute(role: UserRole): string {
  return role === 'comptable' ? '/dashboard/comptable' : '/dashboard';
}

// -------------------------------------------------------
// Permissions granulaires par fonctionnalité
// -------------------------------------------------------
export const PERMISSIONS = {
  // Produits
  products_write:       ['admin', 'responsable'] as UserRole[],
  products_read:        ['admin', 'responsable', 'personnel'] as UserRole[],
  // Ventes
  sales_write:          ['admin', 'responsable', 'personnel'] as UserRole[],
  // Commandes fournisseurs
  supplier_orders_write:['admin', 'responsable'] as UserRole[],
  // Clients
  clients_write:        ['admin', 'responsable'] as UserRole[],
  clients_read:         ['admin', 'responsable', 'personnel'] as UserRole[],
  // Fournisseurs
  suppliers_write:      ['admin', 'responsable'] as UserRole[],
  // Factures
  invoices_write:       ['admin', 'responsable'] as UserRole[],
  // Comptes utilisateurs
  users_manage:         ['admin'] as UserRole[],
  // Comptabilité
  accounting:           ['admin', 'comptable'] as UserRole[],
  // Analytics avancés
  analytics:            ['admin', 'responsable'] as UserRole[],
};

export function can(role: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as UserRole[]).includes(role);
}

// -------------------------------------------------------
// Labels et couleurs des rôles
// -------------------------------------------------------
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:       'Administrateur',
  responsable: 'Responsable',
  personnel:   'Personnel',
  comptable:   'Mariem',
  employee:    'Employé',
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin:       'bg-purple-100 text-purple-700',
  responsable: 'bg-blue-100   text-blue-700',
  personnel:   'bg-green-100  text-green-700',
  comptable:   'bg-orange-100 text-orange-700',
  employee:    'bg-gray-100   text-gray-700',
};
