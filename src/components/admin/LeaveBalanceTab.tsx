
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaveBalance, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getLeaveBalanceColumns } from "./leave-balance-columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { Loader2 } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function LeaveBalanceTab() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<Partial<LeaveBalance> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = collection(db, "leaveBalances");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const balancesData: LeaveBalance[] = snapshot.docs.map(doc => ({ ...doc.data() } as LeaveBalance));
      
      const usersQuery = query(collection(db, "users"));
      const unsubUsers = onSnapshot(usersQuery, (usersDocs) => {
          const batch = writeBatch(db);
          let hasMissingBalances = false;

          usersDocs.forEach(userDoc => {
              const user = userDoc.data() as UserProfile;
              const hasBalance = balancesData.some(b => b.id === user.uid && b.year === CURRENT_YEAR);
              if (!hasBalance) {
                  hasMissingBalances = true;
                  const newBalanceRef = doc(db, "leaveBalances", `${user.uid}_${CURRENT_YEAR}`);
                  batch.set(newBalanceRef, { 
                      id: user.uid,
                      userName: user.name,
                      casual: 21,
                      vocation: 24,
                      past: 0,
                      medical: 14,
                      year: CURRENT_YEAR
                  });
              }
          });
          if(hasMissingBalances){
              batch.commit().catch(err => console.error("Failed to create missing leave balances:", err));
          }
      });

      setBalances(balancesData.filter(b => b.year === CURRENT_YEAR));
      setLoading(false);

      return () => unsubUsers();
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentBalance || !currentBalance.id) return;
    
    setIsSubmitting(true);
    try {
        const docId = `${currentBalance.id}_${currentBalance.year}`;
        const balanceDocRef = doc(db, "leaveBalances", docId);
        const dataToSave = {
            ...currentBalance,
            casual: Number(currentBalance.casual),
            vocation: Number(currentBalance.vocation),
            past: Number(currentBalance.past),
            medical: Number(currentBalance.medical),
            year: Number(currentBalance.year),
        };
        await setDoc(balanceDocRef, dataToSave, { merge: true });
        toast({ title: "Leave balance updated successfully." });
        setIsDialogOpen(false);
        setCurrentBalance(null);
    } catch (error) {
        toast({ variant: "destructive", title: "An error occurred.", description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openDialog = (balance: LeaveBalance) => {
    setCurrentBalance(balance);
    setIsDialogOpen(true);
  };

  const balanceColumns = getLeaveBalanceColumns({ onEdit: openDialog });

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage the annual leave entitlements for each staff member. New users are automatically assigned default values for the current year.
      </p>
      <DataTable columns={balanceColumns} data={balances} filterColumn="userName" />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Balance for {currentBalance?.userName}</DialogTitle>
            <DialogDescription>
                Update the leave days available for the year {currentBalance?.year}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="casual" className="text-right">Casual</Label>
              <Input id="casual" type="number" value={currentBalance?.casual || 0} onChange={(e) => setCurrentBalance({ ...currentBalance, casual: Number(e.target.value) })} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vocation" className="text-right">Vocation</Label>
              <Input id="vocation" type="number" value={currentBalance?.vocation || 0} onChange={(e) => setCurrentBalance({ ...currentBalance, vocation: Number(e.target.value) })} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="past" className="text-right">Past</Label>
              <Input id="past" type="number" value={currentBalance?.past || 0} onChange={(e) => setCurrentBalance({ ...currentBalance, past: Number(e.target.value) })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="medical" className="text-right">Medical</Label>
              <Input id="medical" type="number" value={currentBalance?.medical || 0} onChange={(e) => setCurrentBalance({ ...currentBalance, medical: Number(e.target.value) })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
