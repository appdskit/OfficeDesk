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

interface RecommendationsTabProps {
    onAction: (application: LeaveApplication) => void;
}

export function RecommendationsTab({ onAction }: RecommendationsTabProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const recommendQuery = query(collection(db, "leaveApplications"), where("recommenderId", "==", user.uid), where("status", "in", ["Pending", "Acting Rejected"]), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(recommendQuery, (snapshot) => {
            setRecommendations(parseLeaveData(snapshot));
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch recommendations:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch recommendations." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

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
        <DataTable columns={actionColumns} data={recommendations} filterColumn="userName" />
    );
}
