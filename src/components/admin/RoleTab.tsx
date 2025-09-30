"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getRoleColumns } from "./role-columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PERMISSIONS } from "@/lib/permissions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { manageRole } from "@/ai/flows/manage-role-flow";

export function RoleTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "roles"), (snapshot) => {
      const rolesData: Role[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      setRoles(rolesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setCurrentRole(prev => {
        if (!prev) return null;
        const currentPermissions = prev.permissions || {};
        const [resource, action] = permission.split(':');
        
        let newResourcePermissions = currentPermissions[resource] ? [...currentPermissions[resource]] : [];

        if (checked) {
            if (!newResourcePermissions.includes(action)) {
                newResourcePermissions.push(action);
            }
        } else {
            newResourcePermissions = newResourcePermissions.filter(p => p !== action);
        }

        return {
            ...prev,
            permissions: {
                ...currentPermissions,
                [resource]: newResourcePermissions
            }
        };
    });
  };

  const handleSave = async () => {
    if (!currentRole || !currentRole.name) {
      toast({ variant: "destructive", title: "Please enter a role name." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await manageRole({
        id: currentRole.id,
        name: currentRole.name,
        permissions: currentRole.permissions || {}
      });

      if (result.success) {
        toast({ title: `Role ${currentRole.id ? 'updated' : 'created'} successfully.` });
        setIsDialogOpen(false);
        setCurrentRole(null);
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this role? This might affect users assigned to this role.")) {
      try {
        // This is a client-side delete, which will be blocked by default.
        // For full security, this should also be moved to a backend flow.
        await deleteDoc(doc(db, "roles", id));
        toast({ title: "Role deleted successfully." });
      } catch (error) {
        toast({ variant: "destructive", title: "An error occurred.", description: "You may not have permission to delete roles. Please use the Firebase Console for deletions." });
      }
    }
  };

  const openDialog = (role: Partial<Role> | null = null) => {
    setCurrentRole(role || { name: "", permissions: {} });
    setIsDialogOpen(true);
  };
  
  const roleColumns = getRoleColumns({ onEdit: openDialog, onDelete: handleDelete });

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>
      <DataTable columns={roleColumns} data={roles} filterColumn="name" />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentRole?.id ? "Edit Role" : "Add New Role"}</DialogTitle>
             <DialogDescription>
                Define a role and assign permissions to control access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={currentRole?.name || ""}
                onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                className="col-span-3"
              />
            </div>
             <div className="col-span-4">
                <Label>Permissions</Label>
                <ScrollArea className="h-72 w-full rounded-md border mt-2">
                    <div className="p-4">
                    <Accordion type="multiple" className="w-full">
                    {Object.entries(PERMISSIONS).map(([resource, config]) => (
                        <AccordionItem value={resource} key={resource}>
                            <AccordionTrigger>{config.label}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-2 gap-4">
                                {config.options.map(option => {
                                    const action = option.value.split(':')[1];
                                    const isChecked = !!currentRole?.permissions?.[resource]?.includes(action);
                                    return (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.value}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => handlePermissionChange(option.value, !!checked)}
                                            />
                                            <label htmlFor={option.value} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {option.label}
                                            </label>
                                        </div>
                                    );
                                })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                    </div>
                </ScrollArea>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
