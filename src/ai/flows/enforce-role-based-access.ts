'use server';

/**
 * @fileOverview Implements role-based access control using an LLM to dynamically check user permissions.
 *
 * - enforceRoleBasedAccess - A function that checks if a user has permission to perform an action.
 * - EnforceRoleBasedAccessInput - The input type for the enforceRoleBasedAccess function.
 * - EnforceRoleBasedAccessOutput - The return type for the enforceRoleBasedAccess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const EnforceRoleBasedAccessInputSchema = z.object({
  userRole: z
    .string()
    .describe('The role of the user trying to perform the action.'),
  action: z
    .string()
    .describe('The action the user is trying to perform.'),
  resource: z
    .string()
    .describe('The resource the user is trying to access.'),
  permissions: z.record(z.array(z.string())).describe(
    'A map of roles to a list of string permissions. Example: { admin: ["read", "write"] }'
  ),
});
export type EnforceRoleBasedAccessInput = z.infer<
  typeof EnforceRoleBasedAccessInputSchema
>;

const EnforceRoleBasedAccessOutputSchema = z.object({
  hasPermission: z
    .boolean()
    .describe('Whether the user has permission to perform the action.'),
  reason: z
    .string()
    .describe('The reason why the user has or does not have permission.'),
});
export type EnforceRoleBasedAccessOutput = z.infer<
  typeof EnforceRoleBasedAccessOutputSchema
>;

export async function enforceRoleBasedAccess(
  input: EnforceRoleBasedAccessInput
): Promise<EnforceRoleBasedAccessOutput> {
  return enforceRoleBasedAccessFlow(input);
}

const enforceRoleBasedAccessPrompt = ai.definePrompt({
  name: 'enforceRoleBasedAccessPrompt',
  input: {schema: EnforceRoleBasedAccessInputSchema},
  output: {schema: EnforceRoleBasedAccessOutputSchema},
  prompt: `You are an access control expert. You are given the role of a user, the action they are trying to perform, and the resource they are trying to access.

You are also given a set of permissions that define what actions each role is allowed to perform on each resource.

Determine if the user has permission to perform the action on the resource based on their role and the defined permissions.

Respond with a boolean value indicating whether the user has permission and a reason for your decision.

User Role: {{{userRole}}}
Action: {{{action}}}
Resource: {{{resource}}}
Permissions: {{{permissions}}}

Consider these permissions to decide:
{{{permissions}}}

Return a JSON object that looks like this:
{
  "hasPermission": true|false,
  "reason": "explanation"
}`,
});

const enforceRoleBasedAccessFlow = ai.defineFlow(
  {
    name: 'enforceRoleBasedAccessFlow',
    inputSchema: EnforceRoleBasedAccessInputSchema,
    outputSchema: EnforceRoleBasedAccessOutputSchema,
  },
  async input => {
    const {output} = await enforceRoleBasedAccessPrompt(input);
    return output!;
  }
);
