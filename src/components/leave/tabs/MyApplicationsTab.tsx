"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { LeaveApplication } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { getLeaveColumns } from "../leave-columns";
import { Skeleton } from "@/components/ui/skeleton";
import { cancelLeaveApplicationAction } from "@/app/actions/leave-actions";

const parseLeaveData = (snapshot: any): LeaveApplication[] => snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const now = new Date();
    return {
        id: doc.id,
        ...data,
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : now,
        resumeDate: data.resumeDate instanceof Timestamp ? data.resumeDate.toDate() : now,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : now,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : now,
    } as LeaveApplication;
});

interface MyApplicationsTabProps {
    onPrint: (applications: LeaveApplication[]) => void;
}

export function MyApplicationsTab({ onPrint }: MyApplicationsTabProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [myApplications, setMyApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const myAppsQuery = query(collection(db, "leaveApplications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(myAppsQuery, (snapshot) => {
            setMyApplications(parseLeaveData(snapshot));
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch applications:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch leave applications." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleCancelApplication = async (applicationId: string) => {
        if (!window.confirm("Are you sure you want to cancel this leave application?")) return;

        try {
            const result = await cancelLeaveApplicationAction(applicationId);
            if (result.success) {
                toast({ title: "Application Cancelled", description: "Your leave application has been cancelled." });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not cancel the application." });
        }
    };
    
    const onPrintSelected = (selectedRows: LeaveApplication[]) => {
        const approvedToPrint = selectedRows.filter(row => row.status === 'Approved');
        if (approvedToPrint.length === 0) {
            toast({ variant: "destructive", title: "No approved applications selected", description: "You can only print applications with 'Approved' status."});
            return;
        }
        onPrint(approvedToPrint);
    }

    const leaveColumns = useMemo(() => getLeaveColumns({ onCancel: handleCancelApplication, onPrint: onPrintSelected }), [onPrint]);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <DataTable columns={leaveColumns} data={myApplications} filterColumn="leaveType" enableRowSelection />
    );
}
