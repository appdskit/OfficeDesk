'use server';
/**
 * @fileOverview A secure flow for updating the status of a leave application.
 *
 * - updateLeaveStatus - A function that handles the status update process.
 * - UpdateLeaveStatusInput - The input type for the updateLeaveStatus function.
 * - UpdateLeaveStatusOutput - The return type for the updateLeaveStatus function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import type { LeaveApplication } from '@/lib/types';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const UpdateLeaveStatusInputSchema = z.object({
  applicationId: z.string(),
  action: z.enum(["Recommend", "Approve", "Reject", "Accept Acting", "Reject Acting"]),
  comment: z.string().optional(),
  actorId: z.string(),
});
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusInputSchema>;

const UpdateLeaveStatusOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type UpdateLeaveStatusOutput = z.infer<typeof UpdateLeaveStatusOutputSchema>;

export async function updateLeaveStatus(input: UpdateLeaveStatusInput): Promise<UpdateLeaveStatusOutput> {
  return updateLeaveStatusFlow(input);
}

const updateLeaveStatusFlow = ai.defineFlow(
  {
    name: 'updateLeaveStatusFlow',
    inputSchema: UpdateLeaveStatusInputSchema,
    outputSchema: UpdateLeaveStatusOutputSchema,
  },
  async (input) => {
    const { applicationId, action, comment, actorId } = input;
    const appDocRef = db.collection("leaveApplications").doc(applicationId);

    try {
      const appDoc = await appDocRef.get();
      if (!appDoc.exists) {
        return { success: false, error: "Application not found." };
      }
      const application = appDoc.data() as LeaveApplication;

      let newStatus: LeaveApplication['status'] | null = null;
      let updateData: any = {};

      const actorDoc = await db.collection("users").doc(actorId).get();
      const actorRoleDoc = actorDoc.exists && actorDoc.data()?.roleId ? await db.collection('roles').doc(actorDoc.data()!.roleId).get() : null;
      const isHod = actorRoleDoc?.exists && actorRoleDoc.data()?.name === 'Head of Department';

      // Handle Acting Officer Actions
      if (action === "Accept Acting" || action === "Reject Acting") {
        if (application.status !== "Pending Acting Acceptance" || application.actingOfficerId !== actorId) {
          return { success: false, error: "You are not authorized to take this action on this application at its current stage." };
        }
        newStatus = action === "Accept Acting" ? "Pending" : "Acting Rejected";
        updateData['comments.acting'] = comment;
      }
      // Handle Recommender Actions
      else if (action === "Recommend") {
        if (application.status !== "Pending" || application.recommenderId !== actorId) {
          return { success: false, error: "You are not authorized to recommend this application." };
        }
        newStatus = "Recommended";
        updateData['comments.recommender'] = comment;
      }
      // Handle Approver Actions
      else if (action === "Approve") {
        if (application.status !== "Recommended" || (application.approverId !== actorId && !isHod)) {
            return { success: false, error: "You are not authorized to approve this application." };
        }
        newStatus = "Approved";
        updateData['comments.approver'] = comment;
      }
      // Handle Reject Action (can be done by Recommender, Approver, or HOD)
      else if (action === "Reject") {
        const isRecommender = application.status === "Pending" && application.recommenderId === actorId;
        const isApprover = application.status === "Recommended" && application.approverId === actorId;
        const isHodRejecting = application.status === "Recommended" && isHod;

        if (!isRecommender && !isApprover && !isHodRejecting) {
             return { success: false, error: "You are not authorized to reject this application at its current stage." };
        }
        
        newStatus = "Rejected";
        if (isRecommender) {
            updateData['comments.recommender'] = comment;
        } else { // Approver or HOD
            updateData['comments.approver'] = comment;
        }
      }

      if (!newStatus) {
        return { success: false, error: "Invalid action for the current application status." };
      }

      updateData.status = newStatus;
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await appDocRef.update(updateData);

      return { success: true };

    } catch (error: any) {
      console.error("Error in updateLeaveStatusFlow:", error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred.',
      };
    }
  }
);
