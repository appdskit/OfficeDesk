"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function FilePage() {
  const { user } = useAuth();
  
  // Define what permissions the user has for the file module
  const canAdd = user?.profile?.permissions?.file?.includes('add');
  const canViewUpdate = user?.profile?.permissions?.file?.includes('view_update');
  const canManageSubject = user?.profile?.permissions?.file?.includes('manage_subject');

  // Create a list of available tabs based on permissions
  const availableTabs = [
    { value: 'shared-files', label: 'Shared Files', show: canViewUpdate },
    { value: 'add-file', label: 'Add New File', show: canAdd },
    { value: 'manage-subjects', label: 'Manage Subjects', show: canManageSubject },
  ].filter(tab => tab.show);

  // Determine the default tab to show, or a 'no-access' state
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : 'no-access';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">File Management</h2>
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue={defaultTab} className="space-y-4">
            {availableTabs.length > 0 && (
              <TabsList>
                {availableTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            )}

            {canViewUpdate && (
              <TabsContent value="shared-files">
                <Card>
                  <CardHeader><CardTitle>Shared Files</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">File viewing features are under development.</p></CardContent>
                </Card>
              </TabsContent>
            )}

            {canAdd && (
              <TabsContent value="add-file">
                 <Card>
                  <CardHeader><CardTitle>Add New File</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">File creation features are under development.</p></CardContent>
                </Card>
              </TabsContent>
            )}
            
            {canManageSubject && (
              <TabsContent value="manage-subjects">
                 <Card>
                  <CardHeader><CardTitle>Manage File Subjects</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">File subject management features are under development.</p></CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="no-access">
                <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">You do not have permission to view any file management features.</p>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
