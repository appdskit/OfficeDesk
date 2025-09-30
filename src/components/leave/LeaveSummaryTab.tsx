
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { LeaveApplication, LeaveBalance, UserProfile } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENT_YEAR = new Date().getFullYear();

type LeaveSummary = {
    userId: string;
    userName: string;
    casualTaken: number;
    vocationTaken: number;
    totalCasual: number;
    totalVocation: number;
    totalPast: number;
};

export function LeaveSummaryTab({ onPrint }: { onPrint: (applications: LeaveApplication[]) => void; }) {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<LeaveSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);

      // 1. Fetch all balances for the current year
      const balancesQuery = query(collection(db, "leaveBalances"), where("year", "==", CURRENT_YEAR));
      const balancesSnapshot = await getDocs(balancesQuery);
      const balances = balancesSnapshot.docs.map(doc => doc.data() as LeaveBalance);

      // 2. Fetch all approved applications for the current year
      const applicationsQuery = query(collection(db, "leaveApplications"), where("status", "==", "Approved"));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => doc.data() as LeaveApplication);

      // 3. Process data
      const summary: LeaveSummary[] = balances.map(balance => {
        const userApplications = applications.filter(app => app.userId === balance.id);
        const casualTaken = userApplications
            .filter(app => app.leaveType === 'Casual' || app.leaveType.includes('Leave')) // Includes half-days
            .reduce((acc, app) => acc + app.leaveDays, 0);
        const vocationTaken = userApplications
            .filter(app => app.leaveType === 'Vocation')
            .reduce((acc, app) => acc + app.leaveDays, 0);

        return {
          userId: balance.id,
          userName: balance.userName,
          casualTaken: casualTaken,
          vocationTaken: vocationTaken,
          totalCasual: balance.casual,
          totalVocation: balance.vocation,
          totalPast: balance.past,
        };
      });

      setSummaryData(summary);
      setLoading(false);
    };

    fetchSummary();
    
    // Optional: Add snapshot listeners to update in real-time
    const unsubBalances = onSnapshot(query(collection(db, "leaveBalances"), where("year", "==", CURRENT_YEAR)), () => fetchSummary());
    const unsubApps = onSnapshot(query(collection(db, "leaveApplications"), where("status", "==", "Approved")), () => fetchSummary());

    return () => {
        unsubBalances();
        unsubApps();
    };
  }, []);

  const columns = useMemo(() => [
      { accessorKey: 'userName', header: 'Staff Name' },
      { accessorKey: 'totalCasual', header: 'Total Casual' },
      { accessorKey: 'casualTaken', header: 'Casual Taken' },
      {
          id: 'casualRemaining',
          header: 'Casual Remaining',
          cell: ({ row }: any) => row.original.totalCasual - row.original.casualTaken,
      },
      { accessorKey: 'totalVocation', header: 'Total Vocation' },
      { accessorKey: 'vocationTaken', header: 'Vocation Taken' },
      {
          id: 'vocationRemaining',
          header: 'Vocation Remaining',
          cell: ({ row }: any) => row.original.totalVocation - row.original.vocationTaken,
      },
      { accessorKey: 'totalPast', header: 'Past Leave' },
  ], []);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return <DataTable columns={columns} data={summaryData} filterColumn="userName" />;
}
