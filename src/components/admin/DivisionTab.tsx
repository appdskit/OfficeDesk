"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Division } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getDivisionColumns } from "./division-columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";

export function DivisionTab() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDivision, setCurrentDivision] = useState<Partial<Division> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "divisions"), (snapshot) => {
      const divisionsData: Division[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division));
      setDivisions(divisionsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentDivision || !currentDivision.name) {
      toast({ variant: "destructive", title: "Please enter a division name." });
      return;
    }

    try {
      if (currentDivision.id) {
        // Update existing division
        const divisionDoc = doc(db, "divisions", currentDivision.id);
        await updateDoc(divisionDoc, { name: currentDivision.name });
        toast({ title: "Division updated successfully." });
      } else {
        // Create new division
        await addDoc(collection(db, "divisions"), { name: currentDivision.name });
        toast({ title: "Division created successfully." });
      }
      setIsDialogOpen(false);
      setCurrentDivision(null);
    } catch (error) {
      toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this division?")) {
      try {
        await deleteDoc(doc(db, "divisions", id));
        toast({ title: "Division deleted successfully." });
      } catch (error) {
        toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
      }
    }
  };

  const openDialog = (division: Partial<Division> | null = null) => {
    setCurrentDivision(division || { name: "" });
    setIsDialogOpen(true);
  };

  const divisionColumns = getDivisionColumns({ onEdit: openDialog, onDelete: handleDelete });

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
          Add Division
        </Button>
      </div>
      <DataTable columns={divisionColumns} data={divisions} filterColumn="name" />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentDivision?.id ? "Edit Division" : "Add New Division"}</DialogTitle>
            <DialogDescription>
                {currentDivision?.id ? "Update the name of the division." : "Create a new division for your organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={currentDivision?.name || ""}
                onChange={(e) => setCurrentDivision({ ...currentDivision, name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
