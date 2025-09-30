"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function MailPage() {
  const { user } = useAuth();
  
  const canRegister = user?.profile?.permissions?.mail?.includes('register');
  const canApprove = user?.profile?.permissions?.mail?.includes('approve');
  const canTransfer = user?.profile?.permissions?.mail?.includes('transfer');
  const canReceive = user?.profile?.permissions?.mail?.includes('receive');
  const canForward = user?.profile?.permissions?.mail?.includes('forward');
  const canTodo = user?.profile?.permissions?.mail?.includes('todo');
  const canHistory = user?.profile?.permissions?.mail?.includes('history');

  const availableTabs = [
    { value: 'register', label: 'Register Mail', show: canRegister },
    { value: 'approve', label: 'Approve Mail', show: canApprove },
    { value: 'transfer', label: 'Transfer Mail', show: canTransfer },
    { value: 'receive', label: 'Receive Mail', show: canReceive },
    { value: 'forward', label: 'Forward Mail', show: canForward },
    { value: 'todo', label: 'To Do', show: canTodo },
    { value: 'history', label: 'History', show: canHistory },
  ].filter(tab => tab.show);

  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : 'no-access';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">Mailroom</h2>
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue={defaultTab} className="space-y-4">
             {availableTabs.length > 0 && (
              <TabsList className="h-auto flex-wrap justify-start">
                {availableTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            )}

            <TabsContent value={defaultTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Mail Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Mail management features are under development.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="no-access">
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">You do not have permission to view any mailroom features.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
