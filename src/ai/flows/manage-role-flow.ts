'use server';
/**
 * @fileOverview A secure flow for creating and updating roles in Firestore.
 *
 * - manageRole - A function that handles the role creation/update process.
 * - ManageRoleInput - The input type for the manageRole function.
 * - ManageRoleOutput - The return type for the manageRole function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const ManageRoleInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  permissions: z.record(z.array(z.string())),
});
export type ManageRoleInput = z.infer<typeof ManageRoleInputSchema>;

const ManageRoleOutputSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  error: z.string().optional(),
});
export type ManageRoleOutput = z.infer<typeof ManageRoleOutputSchema>;


export async function manageRole(input: ManageRoleInput): Promise<ManageRoleOutput> {
  return manageRoleFlow(input);
}

const manageRoleFlow = ai.defineFlow(
  {
    name: 'manageRoleFlow',
    inputSchema: ManageRoleInputSchema,
    outputSchema: ManageRoleOutputSchema,
  },
  async (input) => {
    const db = getFirestore();
    const { id, name, permissions } = input;

    const roleData = { name, permissions };

    try {
      if (id) {
        // Update existing role
        const roleRef = db.collection('roles').doc(id);
        await roleRef.update(roleData);
        return { success: true, id: id };
      } else {
        // Create new role
        const newRoleRef = await db.collection('roles').add(roleData);
        return { success: true, id: newRoleRef.id };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred while managing the role.',
      };
    }
  }
);
