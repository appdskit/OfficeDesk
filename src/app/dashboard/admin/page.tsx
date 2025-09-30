"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, KeyRound, UserPlus, CalendarCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DivisionTab } from "@/components/admin/DivisionTab";
import { RoleTab } from "@/components/admin/RoleTab";
import { UserTab } from "@/components/admin/UserTab";
import { LeaveBalanceTab } from "@/components/admin/LeaveBalanceTab";
import { useAuth } from "@/hooks/useAuth";

function AdminPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const tab = searchParams.get('tab') || 'division';
    
    const canManageBalances = user?.profile?.permissions?.leave?.includes('manage_balance');

    const onTabChange = (value: string) => {
        router.push(`/dashboard/admin?tab=${value}`, { scroll: false });
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h2>
            </div>
            <Tabs value={tab} onValueChange={onTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="division">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Division
                    </TabsTrigger>
                    <TabsTrigger value="role">
                        <KeyRound className="mr-2 h-4 w-4" />
                        Role
                    </TabsTrigger>
                    <TabsTrigger value="user">
                        <UserPlus className="mr-2 h-4 w-4" />
                        User
                    </TabsTrigger>
                    {canManageBalances && (
                        <TabsTrigger value="leave-balances">
                            <CalendarCog className="mr-2 h-4 w-4" />
                            Leave Balances
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="division">
                    <Card>
                        <CardHeader>
                            <CardTitle>Division Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <DivisionTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="role">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <RoleTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="user">
                     <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <UserTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                 {canManageBalances && (
                    <TabsContent value="leave-balances">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Balance Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <LeaveBalanceTab />
                            </CardContent>
                        </Card>
                    </TabsContent>
                 )}
            </Tabs>
        </div>
    );
}

function AdminPageFallback() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-9 w-48" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-10 w-96" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminPageFallback />}>
            <AdminPageContent />
        </Suspense>
    );
}
