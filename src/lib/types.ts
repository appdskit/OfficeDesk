import type { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  roleId: string | null;
  divisionId: string | null;
  staffType: 'Office' | 'Field';
  designationGrade?: string;
  roleName?: string; // To hold the resolved role name
  password?: string; // Used for creation form
  permissions?: Record<string, string[]>; // Added from role
}

export interface AppUser extends FirebaseUser {
  profile: UserProfile | null;
}

export interface Division {
  id: string;
  name: string;
}

export interface Role {
  id:string;
  name: string;
  permissions: Record<string, string[]>;
}

export interface PermissionConfig {
  [key: string]: {
    label: string;
    options: {
      value: string;
      label:string;
    }[];
  };
}

export interface LeaveApplication {
    id: string;
    userId: string;
    userName: string;
    designation: string;
    divisionId: string;
    startDate: Date;
    resumeDate: Date;
    leaveDays: number;
    leaveType: string;
    reason: string;
    status: 'Pending Acting Acceptance' | 'Acting Rejected' | 'Pending' | 'Recommended' | 'Approved' | 'Rejected' | 'Cancelled';
    actingOfficerId: string;
    recommenderId: string;
    approverId: string;
    subjectInChargeId: string;
    comments?: {
      recommender?: string;
      approver?: string;
      acting?: string;
    };
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    startTime?: string;
    resumeTime?: string;
}

export interface WorkingHistoryItem {
  place: string;
  designation: string;
}

export interface InventoryChecklist {
  pcLaptop: boolean;
  lgnAccount: boolean;
  printer: boolean;
  printerName?: string;
  router: boolean;
  ups: boolean;
}

export interface StaffProfile {
  id: string;
  name: string;
  nic: string;
  designationGrade: string;
  divisionId: string;
  dob: Date | Timestamp | string;
  mobileNumber: string;
  appointmentDate: Date | Timestamp | string;
  email: string;
  basicSalary: number;
  salaryCode: string;
  workingHistory?: WorkingHistoryItem[];
  inventory?: InventoryChecklist;
  profileImage?: string;
  createdBy: string;
  createdAt: Date | Timestamp;
}

export interface LeaveBalance {
    id: string; // Should be the same as the user's UID
    userName: string;
    casual: number;
    vocation: number;
    past: number;
    year: number;
}
