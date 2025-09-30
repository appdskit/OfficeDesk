"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { LeaveApplication, AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getLeaveColumns, getLeaveActionColumns } from "./leave-columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LeaveApplicationForm } from "./LeaveApplicationForm";
import { UpdateLeaveStatusForm } from "./UpdateLeaveStatusForm";
import { PlusCircle, Printer } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cancelLeaveApplicationAction } from "@/app/actions/leave-actions";
import { LeavePrintView } from "./LeavePrintView";
import { LeaveSummaryTab } from "./LeaveSummaryTab";


type LeaveView = 'apply' | 'recommend' | 'approve' | 'acting';

export function LeaveManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myApplications, setMyApplications] = useState<LeaveApplication[]>([]);
  const [recommendations, setRecommendations] = useState<LeaveApplication[]>([]);
  const [approvals, setApprovals] = useState<LeaveApplication[]>([]);
  const [actingDuties, setActingDuties] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({ apply: true, recommend: true, approve: true, acting: true, summary: true });
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [selectedToPrint, setSelectedToPrint] = useState<LeaveApplication[]>([]);
  
  const canRecommend = user?.profile?.permissions?.leave?.includes('recommend');
  const canApprove = user?.profile?.permissions?.leave?.includes('approve');
  const canAct = user?.profile?.permissions?.leave?.includes('acting');
  const canViewSummary = user?.profile?.permissions?.leave?.includes('view_summary');
  const isHod = user?.profile?.roleName === 'Head of Department';

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
      } as LeaveApplication
  });

  useEffect(() => {
    if (!user?.uid) {
        Object.keys(loading).forEach(k => setLoading(prev => ({...prev, [k]: false})));
        return;
    };

    const unsubs: (()=>void)[] = [];

    const myAppsQuery = query(collection(db, "leaveApplications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(myAppsQuery, (snapshot) => {
        setMyApplications(parseLeaveData(snapshot));
        setLoading(prev => ({...prev, apply: false}));
    }));

    const actingQuery = query(collection(db, "leaveApplications"), where("actingOfficerId", "==", user.uid), where("status", "==", "Pending Acting Acceptance"));
    unsubs.push(onSnapshot(actingQuery, (snapshot) => {
        setActingDuties(parseLeaveData(snapshot));
        setLoading(prev => ({...prev, acting: false}));
    }));

    if (canRecommend) {
        const recommendQuery = query(collection(db, "leaveApplications"), where("recommenderId", "==", user.uid), where("status", "in", ["Pending", "Acting Rejected"]), orderBy("createdAt", "desc"));
        unsubs.push(onSnapshot(recommendQuery, (snapshot) => {
            setRecommendations(parseLeaveData(snapshot));
            setLoading(prev => ({...prev, recommend: false}));
        }));
    } else {
        setLoading(prev => ({...prev, recommend: false}));
    }

    if (canApprove) {
        let approveQuery;
        if (isHod) {
             approveQuery = query(collection(db, "leaveApplications"), where("status", "==", "Recommended"), orderBy("createdAt", "desc"));
        } else {
             approveQuery = query(collection(db, "leaveApplications"), where("approverId", "==", user.uid), where("status", "==", "Recommended"), orderBy("createdAt", "desc"));
        }
        unsubs.push(onSnapshot(approveQuery, (snapshot) => {
            setApprovals(parseLeaveData(snapshot));
            setLoading(prev => ({...prev, approve: false}));
        }));
    } else {
       setLoading(prev => ({...prev, approve: false}));
    }
    
    if (canViewSummary) {
        setLoading(prev => ({...prev, summary: false}));
    }


    return () => unsubs.forEach(unsub => unsub());
  }, [user, canRecommend, canApprove, isHod, canViewSummary]);
  
  const handleActionClick = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setIsActionDialogOpen(true);
  };

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

  const handlePrintSelected = (selectedRows: LeaveApplication[]) => {
      const approvedToPrint = selectedRows.filter(row => row.status === 'Approved');
      if (approvedToPrint.length === 0) {
          toast({ variant: "destructive", title: "No approved applications selected", description: "You can only print applications with 'Approved' status."});
          return;
      }
      setSelectedToPrint(approvedToPrint);
      setIsPrintDialogOpen(true);
  }

  const leaveColumns = useMemo(() => getLeaveColumns({ onCancel: handleCancelApplication, onPrint: handlePrintSelected }), []);
  const actionColumns = useMemo(() => getLeaveActionColumns({ onAction: handleActionClick }), []);

  const availableTabs: {value: string, label: string, show: boolean}[] = [
      { value: "my-applications", label: "My Applications", show: true },
      { value: "acting-duties", label: "Acting Duties", show: !!canAct },
      { value: "recommendations", label: "Pending Recommendations", show: !!canRecommend },
      { value: "approvals", label: "Pending Approvals", show: !!canApprove },
      { value: "summary", label: "Leave Summary", show: !!canViewSummary },
  ];
  
  const defaultTab = availableTabs.find(t => t.show)?.value || "my-applications";

  return (
    <Card>
        <CardContent className="p-6">
            <Tabs defaultValue={defaultTab} className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList className="h-auto flex-wrap justify-start">
                        {availableTabs.filter(t => t.show).map(tab => (
                             <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                     <Button onClick={() => setIsApplyDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Application
                    </Button>
                </div>
                
                <TabsContent value="my-applications">
                    {loading.apply ? (
                        <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
                    ) : (
                        <DataTable columns={leaveColumns} data={myApplications} filterColumn="leaveType" enableRowSelection/>
                    )}
                </TabsContent>
                <TabsContent value="acting-duties">
                    {loading.acting ? (
                        <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
                    ) : (
                        <DataTable columns={actionColumns} data={actingDuties} filterColumn="userName" />
                    )}
                </TabsContent>
                {canRecommend && (
                    <TabsContent value="recommendations">
                         {loading.recommend ? (
                            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
                        ) : (
                            <DataTable columns={actionColumns} data={recommendations} filterColumn="userName" />
                        )}
                    </TabsContent>
                )}
                {canApprove && (
                    <TabsContent value="approvals">
                        {loading.approve ? (
                            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
                        ) : (
                            <DataTable columns={actionColumns} data={approvals} filterColumn="userName" />
                        )}
                    </TabsContent>
                )}
                 {canViewSummary && (
                    <TabsContent value="summary">
                        {loading.summary ? (
                            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>
                        ) : (
                            <LeaveSummaryTab onPrint={handlePrintSelected}/>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </CardContent>

        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>New Leave Application</DialogTitle>
                    <DialogDescription>Complete the form below to submit a new leave request.</DialogDescription>
                </DialogHeader>
                <LeaveApplicationForm setOpen={setIsApplyDialogOpen} />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Take Action on Leave Request</DialogTitle>
                    <DialogDescription>Review the details and take the appropriate action.</DialogDescription>
                </DialogHeader>
                {selectedApplication && <UpdateLeaveStatusForm application={selectedApplication} setOpen={setIsActionDialogOpen} user={user as AppUser} />}
            </DialogContent>
        </Dialog>

        <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
            <DialogContent className="max-w-4xl h-[90vh]">
                 <DialogHeader>
                    <DialogTitle>Print Leave Applications</DialogTitle>
                    <DialogDescription>Review and print the selected approved leave applications.</DialogDescription>
                </DialogHeader>
                <LeavePrintView applications={selectedToPrint} />
            </DialogContent>
        </Dialog>

    </Card>
  );
}
