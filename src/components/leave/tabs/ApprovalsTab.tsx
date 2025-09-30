"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { LeaveApplication } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { getLeaveActionColumns } from "../leave-columns";
import { Skeleton } from "@/components/ui/skeleton";

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

interface ApprovalsTabProps {
    onAction: (application: LeaveApplication) => void;
}

export function ApprovalsTab({ onAction }: ApprovalsTabProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [approvals, setApprovals] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const isHod = user?.profile?.roleName === 'Head of Department';

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        let approveQuery;
        if (isHod) {
             approveQuery = query(collection(db, "leaveApplications"), where("status", "==", "Recommended"), orderBy("createdAt", "desc"));
        } else {
             approveQuery = query(collection(db, "leaveApplications"), where("approverId", "==", user.uid), where("status", "==", "Recommended"), orderBy("createdAt", "desc"));
        }

        const unsubscribe = onSnapshot(approveQuery, (snapshot) => {
            setApprovals(parseLeaveData(snapshot));
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch approvals:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch approvals." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isHod, toast]);

    const actionColumns = useMemo(() => getLeaveActionColumns({ onAction }), [onAction]);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <DataTable columns={actionColumns} data={approvals} filterColumn="userName" />
    );
}
