'use server';
/**
 * @fileOverview A secure flow for creating a new user in Firebase Authentication and Firestore.
 *
 * - createUser - A function that handles the user creation process.
 * - CreateUserInput - The input type for the createUser function.
 * - CreateUserOutput - The return type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';


// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string(),
  roleId: z.string().nullable(),
  divisionId: z.string().nullable(),
  staffType: z.enum(['Office', 'Field']),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string().optional(),
  success: z.boolean(),
  error: z.string().optional(),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;


// Exported wrapper function
export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

// Define the Genkit flow
const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    try {
      const auth = getAuth();
      const firestore = getFirestore();

      // 1. Create user in Firebase Authentication
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.name,
      });

      // 2. Create user profile in Firestore
      const userProfileData = {
        uid: userRecord.uid,
        name: input.name,
        email: input.email,
        staffType: input.staffType,
        divisionId: input.divisionId,
        roleId: input.roleId,
      };
      
      await firestore.collection('users').doc(userRecord.uid).set(userProfileData);

      return {
        uid: userRecord.uid,
        success: true,
      };

    } catch (error: any) {
      // Handle known Firebase Admin SDK errors
      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-exists':
            errorMessage = 'The email address is already in use by another account.';
            break;
          case 'auth/invalid-password':
            errorMessage = 'The password must be a string with at least 6 characters.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
);
