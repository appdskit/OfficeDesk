"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Shield,
  Briefcase,
  Users,
  CalendarCheck,
  FileText,
  Boxes,
  Mail,
  Settings,
  LogOut,
  UserCircle,
  KeyRound,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_EMAILS } from "@/lib/config";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/admin",
    label: "Admin Panel",
    icon: Shield,
    adminOnly: true,
  },
  { href: "/dashboard/leave", label: "Leave", icon: CalendarCheck },
  { href: "/dashboard/file", label: "File", icon: FileText },
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/mail", label: "Mail", icon: Mail },
];

const accountMenuItems = [
    { href: "/dashboard/my-profile", label: "My Profile", icon: UserCircle },
    { href: "/dashboard/settings", label: "Account Settings", icon: Settings },
];


export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  const hasPermission = (requiredPermissions?: string[]) => {
    if (!requiredPermissions) return true; // No permissions required
    if (!user?.profile?.permissions?.leave) return false;
    
    // Check if user has ALL required permissions
    return requiredPermissions.every(p => {
        const [resource, action] = p.split(':');
        return user.profile!.permissions[resource]?.includes(action);
    });
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Logout failed." });
    }
  };

  const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("") : "?";

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold font-headline">StaffDesk</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems
            .filter(item => !item.adminOnly || isAdmin)
            .filter(item => hasPermission(item.permissions))
            .map((item) => (
             <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
            <SidebarMenuItem className="mt-4">
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase">Account</span>
            </SidebarMenuItem>
             {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                    <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.label}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>

      </SidebarContent>
       <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : <UserCircle/>}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
                <span className="text-sm font-semibold truncate">{user?.displayName ?? 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.profile?.roleName ?? user?.email}</span>
            </div>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="ml-auto h-8 w-8">
                <LogOut />
            </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </>
  );
}
