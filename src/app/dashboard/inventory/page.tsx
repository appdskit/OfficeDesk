"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function InventoryPage() {
  const { user } = useAuth();
  
  const canAdd = user?.profile?.permissions?.inventory?.includes('add');
  const canView = user?.profile?.permissions?.inventory?.includes('view');
  const canRequest = user?.profile?.permissions?.inventory?.includes('request');
  const canServiceRequest = user?.profile?.permissions?.inventory?.includes('service_request');
  const canViewHistory = user?.profile?.permissions?.inventory?.includes('history');

  const availableTabs = [
    { value: 'view-inventory', label: 'Office Inventory', show: canView },
    { value: 'add-inventory', label: 'Add Inventory', show: canAdd },
    { value: 'request-inventory', label: 'Request Item', show: canRequest },
    { value: 'service-request', label: 'Service Request', show: canServiceRequest },
    { value: 'history', label: 'History', show: canViewHistory },
  ].filter(tab => tab.show);

  const defaultTab = availableTabs.length > 0 ? availableTabs[0].value : 'no-access';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">Inventory Management</h2>
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

            {canView && (
              <TabsContent value="view-inventory">
                <Card><CardHeader><CardTitle>View Inventory</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Inventory viewing features are under development.</p></CardContent></Card>
              </TabsContent>
            )}
             {canAdd && (
              <TabsContent value="add-inventory">
                <Card><CardHeader><CardTitle>Add New Inventory</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Inventory creation features are under development.</p></CardContent></Card>
              </TabsContent>
            )}
            {canRequest && (
              <TabsContent value="request-inventory">
                <Card><CardHeader><CardTitle>Request Inventory Item</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Inventory request features are under development.</p></CardContent></Card>
              </TabsContent>
            )}
             {canServiceRequest && (
              <TabsContent value="service-request">
                <Card><CardHeader><CardTitle>Request a Service</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Service request features are under development.</p></CardContent></Card>
              </TabsContent>
            )}
             {canViewHistory && (
              <TabsContent value="history">
                <Card><CardHeader><CardTitle>Inventory & Service History</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">History features are under development.</p></CardContent></Card>
              </TabsContent>
            )}

            <TabsContent value="no-access">
                <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">You do not have permission to view any inventory management features.</p>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
