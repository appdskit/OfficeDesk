"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LeaveSubjectOfficerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const hasPermission = user?.profile?.permissions?.leave?.includes('view_summary') && user?.profile?.permissions?.leave?.includes('manage_balance');
      if (!hasPermission) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">Leave Subject Officer Panel</h2>
      
      <Tabs defaultValue="office-staff-leave" className="space-y-4">
        <TabsList>
          <TabsTrigger value="office-staff-leave">View Office Staff Leave</TabsTrigger>
        </TabsList>
        <TabsContent value="office-staff-leave">
          <Card>
            <CardHeader>
              <CardTitle>Office Staff Leave Records</CardTitle>
              <CardDescription>View, filter, and manage office staff leave.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">The full leave summary table and filter panel are under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
