'use server';

import { updateLeaveStatus, UpdateLeaveStatusInput } from "@/ai/flows/update-leave-status-flow";
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * A server action to securely update the status of a leave application.
 * This function is callable from client components.
 */
export async function updateLeaveStatusAction(input: UpdateLeaveStatusInput) {
  // You could add extra server-side validation here if needed
  return await updateLeaveStatus(input);
}


/**
 * A server action to securely cancel a leave application.
 */
export async function cancelLeaveApplicationAction(applicationId: string): Promise<{success: boolean, error?: string}> {
    try {
      const appDocRef = db.collection("leaveApplications").doc(applicationId);
      await appDocRef.update({
        status: 'Cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error cancelling application in action:", error);
      return { success: false, error: "Could not cancel the application." };
    }
}
