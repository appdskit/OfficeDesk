"use client";

import { useState } from "react";
import type { LeaveApplication, AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { updateLeaveStatusAction } from "@/app/actions/leave-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "../ui/badge";

interface UpdateLeaveStatusFormProps {
  application: LeaveApplication;
  user: AppUser;
  setOpen: (open: boolean) => void;
}

type Action = "Recommend" | "Approve" | "Reject" | "Accept Acting" | "Reject Acting";

export function UpdateLeaveStatusForm({ application, user, setOpen }: UpdateLeaveStatusFormProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<Action | null>(null);

  if (!user?.profile) {
    return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>User not found. Please log in again.</AlertDescription></Alert>;
  }

  const canAct = user.uid === application.actingOfficerId && application.status === 'Pending Acting Acceptance';
  const canRecommend = user.uid === application.recommenderId && application.status === 'Pending';
  const isHod = user.profile.roleName === 'Head of Department';
  const canApprove = (user.uid === application.approverId || isHod) && application.status === 'Recommended';
  const canReject = (user.uid === application.recommenderId && application.status === 'Pending') || 
                    (user.uid === application.approverId && application.status === 'Recommended') ||
                    (isHod && application.status === 'Recommended');


  const handleAction = async (action: Action) => {
    setLoading(action);
    try {
      const result = await updateLeaveStatusAction({
        applicationId: application.id,
        action: action,
        comment: comment,
        actorId: user.uid,
      });

      if (result.success) {
        toast({ title: `Successfully processed action: ${action}.` });
        setOpen(false);
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Action failed.", description: (error as Error).message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
            <h4 className="font-semibold">Application Details</h4>
            <div className="flex justify-between"><span>Applicant:</span> <span className="font-medium">{application.userName}</span></div>
            <div className="flex justify-between"><span>Leave Type:</span> <Badge variant="secondary">{application.leaveType}</Badge></div>
            <div className="flex justify-between"><span>Days:</span> <span className="font-medium">{application.leaveDays}</span></div>
            <p className="text-sm text-muted-foreground pt-2">Reason: {application.reason}</p>
        </div>
      
      <div className="grid gap-2">
        <Label htmlFor="comment">Your Comment (Optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add an optional comment..."
        />
      </div>
      
      <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full pt-4">
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {canAct && (
                <>
                 <Button onClick={() => handleAction("Reject Acting")} disabled={!!loading} variant="destructive">
                    {loading === "Reject Acting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject Acting
                </Button>
                 <Button onClick={() => handleAction("Accept Acting")} disabled={!!loading} className="bg-green-600 hover:bg-green-700">
                    {loading === "Accept Acting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Accept Acting
                </Button>
                </>
            )}
            {canRecommend && (
                 <>
                <Button onClick={() => handleAction("Reject")} disabled={!!loading} variant="destructive">
                    {loading === "Reject" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                </Button>
                <Button onClick={() => handleAction("Recommend")} disabled={!!loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading === "Recommend" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Recommend
                </Button>
                </>
            )}
            {canApprove && (
                <>
                <Button onClick={() => handleAction("Reject")} disabled={!!loading} variant="destructive">
                    {loading === "Reject" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                </Button>
                 <Button onClick={() => handleAction("Approve")} disabled={!!loading} className="bg-green-600 hover:bg-green-700">
                    {loading === "Approve" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                </Button>
                </>
            )}
             {/* Fallback for HOD or other complex reject scenarios covered by the flow */}
            {canReject && !canRecommend && !canApprove && (
                 <Button onClick={() => handleAction("Reject")} disabled={!!loading} variant="destructive">
                    {loading === "Reject" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                </Button>
            )}
        </div>
      </DialogFooter>
      
       {!canAct && !canRecommend && !canApprove && !canReject && (
        <Alert>
          <AlertTitle>No Action Required</AlertTitle>
          <AlertDescription>You do not have permissions to take action on this application, or it is not in a state that requires your action.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
