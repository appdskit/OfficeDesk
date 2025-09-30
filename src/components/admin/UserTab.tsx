
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, Role, Division } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getUserColumns } from "./user-columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { createUser } from "@/ai/flows/create-user-flow";


export function UserTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const { toast } = useToast();

  const isEditing = !!editingUser?.uid;

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData: UserProfile[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
      setLoading(false);
    });
    const unsubRoles = onSnapshot(collection(db, "roles"), (snapshot) => {
      const rolesData: Role[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      setRoles(rolesData);
    });
    const unsubDivisions = onSnapshot(collection(db, "divisions"), (snapshot) => {
      const divisionsData: Division[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division));
      setDivisions(divisionsData);
    });
    return () => {
        unsubUsers();
        unsubRoles();
        unsubDivisions();
    };
  }, []);

  const handleSave = async () => {
    if (!editingUser) return;
    const { name, email, roleId, divisionId, staffType, password } = editingUser;

    if (isEditing) { // Update existing user
        if (!name || !email || !roleId || !divisionId || !staffType) {
            toast({ variant: "destructive", title: "Please fill all fields for updating." });
            return;
        }
         setIsSubmitting(true);
         try {
            const userDoc = doc(db, "users", editingUser.uid!);
            await updateDoc(userDoc, { name, email, roleId, divisionId, staffType });
            toast({ title: "User updated successfully." });
            closeForm();
         } catch (error) {
             toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
         } finally {
             setIsSubmitting(false);
         }
    } else { // Create new user
        if (!name || !email || !password || !roleId || !divisionId || !staffType) {
            toast({ variant: "destructive", title: "Please fill all fields for creating." });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createUser({ name, email, password, roleId, divisionId, staffType });
            if (result.success) {
                toast({ title: "User created successfully!", description: `User ${name} can now log in.` });
                closeForm();
            } else {
                throw new Error(result.error || "Unknown error occurred.");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to create user.", description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    }
  };


  const handleDelete = async (uid: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        toast({ title: "User deleted successfully." });
        // Note: This does not delete the user from Firebase Auth. That must be done manually in the Firebase console for security reasons.
      } catch (error) {
        toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
      }
    }
  };

  const openForm = (user: Partial<UserProfile> | null = null) => {
    if (user) { // Editing existing user
        setEditingUser(user);
    } else { // Creating new user
        setEditingUser({ name: '', email: '', password: '', roleId: null, divisionId: null, staffType: 'Office' });
    }
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  }
  
  const userColumns = getUserColumns({ roles, divisions, onEdit: openForm, onDelete: handleDelete });

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
        <Button onClick={() => openForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>
      <DataTable columns={userColumns} data={users} filterColumn="name" />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
             <DialogDescription>
                {isEditing ? "Update user details. Roles and divisions can be assigned here." : "Create a new user account and profile."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Name</Label>
                  <Input value={editingUser?.name || ""} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Email</Label>
                  <Input type="email" value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="col-span-3" disabled={isEditing}/>
              </div>
              {!isEditing && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Password</Label>
                    <Input type="password" value={editingUser?.password || ""} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="col-span-3" placeholder="Set temporary password" />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Division</Label>
                   <Select value={editingUser?.divisionId || undefined} onValueChange={(value) => setEditingUser({...editingUser, divisionId: value})}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a division" /></SelectTrigger>
                      <SelectContent>
                          {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Role</Label>
                  <Select value={editingUser?.roleId || undefined} onValueChange={(value) => setEditingUser({...editingUser, roleId: value})}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                      <SelectContent>
                          {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Staff Type</Label>
                   <RadioGroup value={editingUser?.staffType || "Office"} onValueChange={(value: "Office" | "Field") => setEditingUser({...editingUser, staffType: value as "Office" | "Field"})} className="col-span-3 flex gap-4">
                       <div className="flex items-center space-x-2">
                           <RadioGroupItem value="Office" id="office" />
                           <Label htmlFor="office">Office</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                           <RadioGroupItem value="Field" id="field" />
                           <Label htmlFor="field">Field</Label>
                       </div>
                   </RadioGroup>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
