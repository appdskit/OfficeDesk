"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StaffDirectory } from "@/components/staff/StaffDirectory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffPage() {
  const { user } = useAuth();
  const canViewDirectory = user?.profile?.permissions?.staff?.includes('view');
  const canCreateProfile = user?.profile?.permissions?.staff?.includes('create'); // Assuming a 'create' permission

  const availableTabs = [
    { value: 'directory', label: 'Directory', show: canViewDirectory },
    // Add other tabs here based on permissions like 'reporting', 'search' etc.
  ].filter(tab => tab.show);

  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : 'no-access';


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Staff Management</h2>
        {canCreateProfile && (
          <Link href="/dashboard/staff/create" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Staff Profile
            </Button>
          </Link>
        )}
      </div>
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
              
              {canViewDirectory && (
                <TabsContent value="directory">
                  <Card>
                    <CardHeader>
                      <CardTitle>Staff Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StaffDirectory />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
               <TabsContent value="no-access">
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">You do not have permission to view any staff management features.</p>
                  </div>
              </TabsContent>

           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
