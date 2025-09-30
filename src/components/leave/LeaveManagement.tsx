"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { LeaveApplication, AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LeaveApplicationForm } from "./LeaveApplicationForm";
import { UpdateLeaveStatusForm } from "./UpdateLeaveStatusForm";
import { PlusCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeavePrintView } from "./LeavePrintView";
import { LeaveSummaryTab } from "./LeaveSummaryTab";
import { MyApplicationsTab } from "./tabs/MyApplicationsTab";
import { ActingDutiesTab } from "./tabs/ActingDutiesTab";
import { RecommendationsTab } from "./tabs/RecommendationsTab";
import { ApprovalsTab } from "./tabs/ApprovalsTab";


export function LeaveManagement() {
  const { user } = useAuth();
  
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [selectedToPrint, setSelectedToPrint] = useState<LeaveApplication[]>([]);
  
  const canRecommend = user?.profile?.permissions?.leave?.includes('recommend');
  const canApprove = user?.profile?.permissions?.leave?.includes('approve');
  const canAct = user?.profile?.permissions?.leave?.includes('acting');
  const canViewSummary = user?.profile?.permissions?.leave?.includes('view_summary');

  const handleActionClick = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setIsActionDialogOpen(true);
  };
  
  const handlePrintSelected = (selectedRows: LeaveApplication[]) => {
      setSelectedToPrint(selectedRows);
      setIsPrintDialogOpen(true);
  }

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
                    <MyApplicationsTab onPrint={handlePrintSelected} />
                </TabsContent>

                {canAct && (
                    <TabsContent value="acting-duties">
                        <ActingDutiesTab onAction={handleActionClick} />
                    </TabsContent>
                )}

                {canRecommend && (
                    <TabsContent value="recommendations">
                        <RecommendationsTab onAction={handleActionClick} />
                    </TabsContent>
                )}

                {canApprove && (
                    <TabsContent value="approvals">
                        <ApprovalsTab onAction={handleActionClick} />
                    </TabsContent>
                )}

                {canViewSummary && (
                    <TabsContent value="summary">
                        <LeaveSummaryTab onPrint={handlePrintSelected}/>
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
