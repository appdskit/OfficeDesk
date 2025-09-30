import type { PermissionConfig } from '@/lib/types';

export const PERMISSIONS: PermissionConfig = {
  leave: {
    label: "Leave Management",
    options: [
      { value: 'leave:apply', label: 'Apply' },
      { value: 'leave:view_history', label: 'View with History' },
      { value: 'leave:recommend', label: 'Recommend' },
      { value: 'leave:approve', label: 'Approval' },
      { value: 'leave:manage_subject', label: 'Leave Subject' },
      { value: 'leave:acting', label: 'Accept Acting Duties' },
      { value: 'leave:view_office_staff', label: 'View Office Staff Leave' },
      { value: 'leave:view_field_staff', label: 'View Field Staff Leave' },
      { value: 'leave:view_dev_officers', label: 'View Development Officers Leave' },
      { value: 'leave:manage_balance', label: 'Manage Leave Balances'},
      { value: 'leave:view_summary', label: 'View Leave Summary'},
    ]
  },
  mail: {
    label: "Mail Management",
    options: [
      { value: 'mail:register', label: 'Register' },
      { value: 'mail:approve', label: 'Approval' },
      { value: 'mail:transfer', label: 'Transfer' },
      { value: 'mail:receive', label: 'Receive' },
      { value: 'mail:forward', label: 'Forward' },
      { value: 'mail:todo', label: 'To Do' },
      { value: 'mail:history', label: 'History' },
    ]
  },
  inventory: {
    label: "Inventory and Services",
    options: [
      { value: 'inventory:add', label: 'Add Inventory' },
      { value: 'inventory:view', label: 'View Inventory (CRUD)' },
      { value: 'inventory:request', label: 'Request Inventory' },
      { value: 'inventory:receive', label: 'Receive Inventory' },
      { value: 'inventory:service_request', label: 'Service Request' },
      { value: 'inventory:history', label: 'History' },
    ]
  },
  file: {
    label: "File Management",
    options: [
      { value: 'file:add', label: 'Add File' },
      { value: 'file:view_update', label: 'View & Update File' },
      { value: 'file:manage_subject', label: 'File Subject' },
    ]
  },
  staff: {
    label: "Staff Management",
    options: [
      { value: 'staff:view', label: 'View' },
      { value: 'staff:print', label: 'Print' },
      { value: 'staff:search', label: 'Search with filter' },
    ]
  },
   account: {
    label: "Account Settings",
    options: [
      { value: 'account:update_password', label: 'Update Password' },
    ]
  },
  admin: {
    label: "Admin Panel",
    options: [
      { value: 'admin:access', label: 'Access Admin Panel' },
    ]
  },
  division: {
    label: "Division Management",
    options: [
      { value: 'division:create', label: 'Create Divisions' },
      { value: 'division:read', label: 'View Divisions' },
      { value: 'division:update', label: 'Update Divisions' },
      { value: 'division:delete', label: 'Delete Divisions' },
    ]
  },
  role: {
    label: "Role Management",
    options: [
      { value: 'role:create', label: 'Create Roles' },
      { value: 'role:read', label: 'View Roles' },
      { value: 'role:update', label: 'Update Roles' },
      { value: 'role:delete', label: 'Delete Roles' },
    ]
  },
  user: {
    label: "User Management",
    options: [
      { value: 'user:create', label: 'Create Users' },
      { value: 'user:read', label: 'View Users' },
      { value: 'user:update', label: 'Update Users' },
      { value: 'user:delete', label: 'Delete Users' },
    ]
  },
};
