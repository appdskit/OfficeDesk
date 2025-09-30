"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveApplication } from "@/lib/types";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Activity, Users, FileText, CalendarCheck, UserCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { getLeaveColumns } from "@/components/leave/leave-columns";


export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        myLeaveRequests: 0,
        pendingMyAction: 0,
        divisionStaffCount: 0,
        activeProjects: 0, // Placeholder
    });
    const [pendingApplications, setPendingApplications] = useState<LeaveApplication[]>([]);

    const parseLeaveData = (snapshot: any): LeaveApplication[] => {
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            const now = new Date();
            // Safely convert all timestamps to JS Dates
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : now,
                resumeDate: data.resumeDate instanceof Timestamp ? data.resumeDate.toDate() : now,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : now,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : now,
            } as LeaveApplication;
        });
    };

    useEffect(() => {
        if (!user?.uid) {
            if (!user) setLoading(false);
            return;
        };

        const fetchStats = async () => {
            setLoading(true);
            try {
                // 1. Get user's leave requests
                const myLeaveQuery = query(collection(db, "leaveApplications"), where("userId", "==", user.uid));
                const myLeaveSnapshot = await getDocs(myLeaveQuery);
                const myLeaveCount = myLeaveSnapshot.size;

                // 2. Get requests pending user's action
                const pendingRecommenderQuery = query(collection(db, "leaveApplications"), where("recommenderId", "==", user.uid), where("status", "==", "Pending"));
                const pendingApproverQuery = query(collection(db, "leaveApplications"), where("approverId", "==", user.uid), where("status", "==", "Recommended"));
                
                const [recommenderSnapshot, approverSnapshot] = await Promise.all([
                    getDocs(pendingRecommenderQuery),
                    getDocs(pendingApproverQuery)
                ]);
                const pendingActionCount = recommenderSnapshot.size + approverSnapshot.size;

                setPendingApplications([
                    ...parseLeaveData(recommenderSnapshot),
                    ...parseLeaveData(approverSnapshot),
                ]);

                // 3. Get division staff count
                let divisionStaffCount = 0;
                if (user.profile?.divisionId) {
                    const divisionStaffQuery = query(collection(db, "users"), where("divisionId", "==", user.profile.divisionId));
                    const divisionStaffSnapshot = await getDocs(divisionStaffQuery);
                    divisionStaffCount = divisionStaffSnapshot.size;
                }
                
                setStats({
                    myLeaveRequests: myLeaveCount,
                    pendingMyAction: pendingActionCount,
                    divisionStaffCount: divisionStaffCount,
                    activeProjects: 0 // Replace with real data when available
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Setup listeners for pending actions
        const unsubRecommender = onSnapshot(query(collection(db, "leaveApplications"), where("recommenderId", "==", user.uid), where("status", "==", "Pending")), (snapshot) => fetchStats());
        const unsubApprover = onSnapshot(query(collection(db, "leaveApplications"), where("approverId", "==", user.uid), where("status", "==", "Recommended")), (snapshot) => fetchStats());

        return () => {
            unsubRecommender();
            unsubApprover();
        }

    }, [user]);

    const leaveColumns = getLeaveColumns();

  if (loading) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
            </div>
            <Card className="mt-6">
                <CardHeader>
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Leave Requests</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">Total applications submitted.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending My Action</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMyAction}</div>
            <p className="text-xs text-muted-foreground">Leave requests needing your approval.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff in My Division</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.divisionStaffCount}</div>
            <p className="text-xs text-muted-foreground">Total staff members in your division.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Feature coming soon.</p>
          </CardContent>
        </Card>
      </div>
      
      {pendingApplications.length > 0 && (
         <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
                <CardDescription>
                These leave applications are awaiting your review.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={leaveColumns} data={pendingApplications} filterColumn="leaveType" />
            </CardContent>
        </Card>
      )}

       {pendingApplications.length === 0 && (
         <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No pending actions or recent notifications.</p>
                </div>
            </CardContent>
        </Card>
       )}

    </div>
  );
}

    