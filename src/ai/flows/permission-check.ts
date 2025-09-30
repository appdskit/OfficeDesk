'use server';

/**
 * @fileOverview Implements permission checking using an LLM to dynamically verify user permissions.
 *
 * - permissionCheck - A function that checks if a user has permission to perform an action on a resource.
 * - PermissionCheckInput - The input type for the permissionCheck function.
 * - PermissionCheckOutput - The return type for the permissionCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PermissionCheckInputSchema = z.object({
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
    'A map of roles to a list of string permissions. Example: { admin: [\"read\", \"write\"] }'
  ),
});
export type PermissionCheckInput = z.infer<typeof PermissionCheckInputSchema>;

const PermissionCheckOutputSchema = z.object({
  hasPermission: z
    .boolean()
    .describe('Whether the user has permission to perform the action.'),
  reason: z
    .string()
    .describe('The reason why the user has or does not have permission.'),
});
export type PermissionCheckOutput = z.infer<typeof PermissionCheckOutputSchema>;

export async function permissionCheck(input: PermissionCheckInput): Promise<PermissionCheckOutput> {
  return permissionCheckFlow(input);
}

const permissionCheckPrompt = ai.definePrompt({
  name: 'permissionCheckPrompt',
  input: {schema: PermissionCheckInputSchema},
  output: {schema: PermissionCheckOutputSchema},
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

const permissionCheckFlow = ai.defineFlow(
  {
    name: 'permissionCheckFlow',
    inputSchema: PermissionCheckInputSchema,
    outputSchema: PermissionCheckOutputSchema,
  },
  async input => {
    const {output} = await permissionCheckPrompt(input);
    return output!;
  }
);
