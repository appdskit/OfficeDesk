"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile, Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const leaveSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required."),
  leaveDays: z.coerce.number().min(0.5, "Number of leave days is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  resumeDate: z.date({ required_error: "Resume date is required." }),
  reason: z.string().min(1, "Reason is required."),
  actingOfficerId: z.string().min(1, "Acting officer is required."),
  recommenderId: z.string().min(1, "Recommending officer is required."),
  approverId: z.string().min(1, "Approving officer is required."),
  subjectInChargeId: z.string().min(1, "Subject In Charge could not be automatically assigned."),
  startTime: z.string().optional(),
  resumeTime: z.string().optional(),
}).refine(data => {
    if (data.leaveDays >= 1) {
        return data.resumeDate > data.startDate;
    }
    return true; // For half-day leave, dates can be the same.
}, {
  message: "Resume date must be after start date for full-day leaves.",
  path: ["resumeDate"],
});


type LeaveFormValues = z.infer<typeof leaveSchema>;

const LEAVE_TYPES = ["Casual", "Vocation", "Short Leave", "Morning Leave", "Afternoon Leave", "Midday Leave"];

function getNextWorkingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const dayOfWeek = nextDay.getDay();

  if (dayOfWeek === 6) { // Saturday
    nextDay.setDate(nextDay.getDate() + 2);
  } else if (dayOfWeek === 0) { // Sunday
    nextDay.setDate(nextDay.getDate() + 1);
  }
  return nextDay;
}


function addBusinessDays(startDate: Date, days: number): Date {
  if (isNaN(days) || days <= 0) return startDate;

  let currentDate = new Date(startDate);
  let addedDays = 0;

  if (currentDate.getDay() === 6) { 
    currentDate.setDate(currentDate.getDate() + 2);
  } else if (currentDate.getDay() === 0) { 
    currentDate.setDate(currentDate.getDate() + 1);
  }

  while (addedDays < Math.floor(days)) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
      addedDays++;
    }
  }
  
  while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return currentDate;
}


export function LeaveApplicationForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [actingOfficers, setActingOfficers] = useState<UserProfile[]>([]);
  const [recommenders, setRecommenders] = useState<UserProfile[]>([]);
  const [approvers, setApprovers] = useState<UserProfile[]>([]);
  const [subjectInChargeOfficer, setSubjectInChargeOfficer] = useState<UserProfile | null>(null);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveDays: 1,
      subjectInChargeId: '', // Initialize to ensure it's controlled
      startTime: '',
      resumeTime: '',
    }
  });
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = form;

  const startDate = watch("startDate");
  const leaveDays = watch("leaveDays");
  const leaveType = watch("leaveType");
  const isHalfDay = leaveType?.includes("Leave");

  useEffect(() => {
    if (startDate) {
        let resumeDate: Date;
        if (leaveType === 'Morning Leave') {
            setValue('leaveDays', 0.5);
            setValue('startTime', '08:30');
            setValue('resumeTime', '12:30');
            resumeDate = new Date(startDate); // Resume same day
        } else if (leaveType === 'Afternoon Leave') {
            setValue('leaveDays', 0.5);
            setValue('startTime', '12:30');
            setValue('resumeTime', '16:30');
            resumeDate = getNextWorkingDay(startDate);
        } else if (leaveType === 'Midday Leave') {
            setValue('leaveDays', 0.5);
            setValue('startTime', '10:30');
            setValue('resumeTime', '14:30');
            resumeDate = getNextWorkingDay(startDate);
        } else if (leaveDays > 0) { // Full-day leaves
            setValue('startTime', '');
            setValue('resumeTime', '');
            resumeDate = addBusinessDays(startDate, leaveDays);
        } else {
             return;
        }
        setValue("resumeDate", resumeDate, { shouldValidate: true });
    }
  }, [startDate, leaveDays, leaveType, setValue]);


  const fetchUserAndRoleData = useCallback(async () => {
    if (!user) return; // Wait for user to be available
    
    // Fetch all users and roles once
    const usersQuery = query(collection(db, "users"));
    const rolesQuery = query(collection(db, "roles"));

    const [usersSnapshot, rolesSnapshot] = await Promise.all([
      getDocs(usersQuery),
      getDocs(rolesQuery),
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
    const rolesData = rolesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Role));

    setAllUsers(usersData);
    setRoles(rolesData);
  }, [user]);

  useEffect(() => {
    fetchUserAndRoleData();
  }, [fetchUserAndRoleData]);


  useEffect(() => {
    if (user?.profile && allUsers.length > 0 && roles.length > 0) {
        
        const usersWithRoleNames = allUsers.map(u => {
            const role = roles.find(r => r.id === u.roleId);
            return { ...u, roleName: role?.name || '' };
        });
        
        // --- Acting Officers (Same Division, not user, not senior roles) ---
        const excludedRoles = ["Division CC", "Division Head", "HOD"];
        const divisionStaff = usersWithRoleNames.filter(u => 
            u.divisionId === user.profile?.divisionId && 
            u.uid !== user.uid &&
            !excludedRoles.includes(u.roleName)
        );
        setActingOfficers(divisionStaff);

        // --- Recommenders (CC, Head, ADS) ---
        const recommenderRoles = ['Division CC', 'Division Head', 'ADS'];
        const divisionRecommenders = usersWithRoleNames.filter(u => recommenderRoles.includes(u.roleName));
        setRecommenders(divisionRecommenders);
        
        // --- Approvers (Head, ADS, HOD) ---
        const approverRoles = ['Division Head', 'ADS', 'HOD'];
        const hodApprovers = usersWithRoleNames.filter(u => approverRoles.includes(u.roleName));
        setApprovers(hodApprovers);

        // --- Automatic Subject In Charge Logic ---
        const applicantStaffType = user.profile.staffType;
        const applicantDesignation = user.profile.designationGrade?.toLowerCase() || '';
        
        let targetRoleName = '';
        if (applicantStaffType === 'Field') {
            targetRoleName = 'Leave Subject Officer (Field)';
        } else if (applicantStaffType === 'Office') {
            if (applicantDesignation.includes('do')) {
                 targetRoleName = 'Leave Subject Officer (DO)';
            } else {
                 targetRoleName = 'Leave Subject Officer (Office)';
            }
        }
        
        const sicOfficer = usersWithRoleNames.find(u => u.roleName === targetRoleName);

        if (sicOfficer) {
            setSubjectInChargeOfficer(sicOfficer);
            setValue('subjectInChargeId', sicOfficer.uid, { shouldValidate: true });
        } else {
            setSubjectInChargeOfficer(null);
            setValue('subjectInChargeId', '', { shouldValidate: true }); // Set to empty to trigger validation
        }
    }
  }, [user, allUsers, roles, setValue]);

  const onSubmit = async (data: LeaveFormValues) => {
    if (!user || !user.profile) {
      toast({ variant: "destructive", title: "You must be logged in to apply for leave." });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "leaveApplications"), {
        ...data,
        userId: user.uid,
        userName: user.profile.name,
        designation: user.profile.designationGrade || 'N/A',
        divisionId: user.profile.divisionId,
        status: "Pending Acting Acceptance",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Leave application submitted successfully." });
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Submission failed.", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={user?.profile?.name || ''} disabled />
            </div>
             <div className="grid gap-2">
                <Label>Designation</Label>
                <Input value={user?.profile?.designationGrade || 'N/A'} disabled />
            </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Controller name="leaveType" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{LEAVE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
            )} />
            {errors.leaveType && <p className="text-sm text-destructive">{errors.leaveType.message}</p>}
        </div>
        
         <div className="grid gap-2">
            <Label>Leave start date</Label>
            <Controller name="startDate" control={control} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear() + 1}
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )} />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="leaveDays">No. of leave days</Label>
            <Input id="leaveDays" type="number" step="0.5" {...register("leaveDays")} disabled={isHalfDay} />
            {errors.leaveDays && <p className="text-sm text-destructive">{errors.leaveDays.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label>Leave resume date</Label>
            <Controller name="resumeDate" control={control} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                         <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear() + 1}
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )} />
            {errors.resumeDate && <p className="text-sm text-destructive">{errors.resumeDate.message}</p>}
        </div>
      </div>
      
       {isHalfDay && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Start Time</Label>
                <Controller name="startTime" control={control} render={({ field }) => <Input type="time" {...field} />} />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="grid gap-2">
                <Label>Resume Time</Label>
                <Controller name="resumeTime" control={control} render={({ field }) => <Input type="time" {...field} />} />
                {errors.resumeTime && <p className="text-sm text-destructive">{errors.resumeTime.message}</p>}
            </div>
        </div>
      )}


       <div className="grid gap-2">
        <Label htmlFor="reason">Reason for leave</Label>
        <Textarea id="reason" placeholder="Please provide a reason for your leave" {...register("reason")} />
        {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label>Acting Officer</Label>
            <Controller name="actingOfficerId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select Staff (Same Division)" /></SelectTrigger>
                    <SelectContent>
                        {actingOfficers.length > 0 ? 
                            actingOfficers.map(p => <SelectItem key={p.uid} value={p.uid}>{p.name}</SelectItem>) :
                            <SelectItem value="none" disabled>No other eligible staff in division</SelectItem>
                        }
                    </SelectContent>
                </Select>
            )} />
              {errors.actingOfficerId && <p className="text-sm text-destructive">{errors.actingOfficerId.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label>Subject In Charge (Auto-assigned)</Label>
            <Input 
                value={subjectInChargeOfficer ? `${subjectInChargeOfficer.name} (${subjectInChargeOfficer.roleName})` : 'Finding officer...'} 
                disabled 
            />
            {errors.subjectInChargeId && !subjectInChargeOfficer && (
                <p className="text-sm text-destructive">
                    Could not find a Subject In Charge for your staff type/designation. Please ensure the relevant roles are created and assigned in the Admin Panel.
                </p>
            )}
        </div>
    </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Recommend</Label>
                <Controller name="recommenderId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select Recommender" /></SelectTrigger>
                        <SelectContent>
                            {recommenders.length > 0 ?
                                recommenders.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>) :
                                <SelectItem value="none" disabled>No Recommenders found</SelectItem>
                            }
                        </SelectContent>
                    </Select>
                )} />
                {errors.recommenderId && <p className="text-sm text-destructive">{errors.recommenderId.message}</p>}
            </div>
            <div className="grid gap-2">
                <Label>Approve</Label>
                 <Controller name="approverId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                        <SelectContent>
                            {approvers.length > 0 ?
                                approvers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>) :
                                <SelectItem value="none" disabled>No Approvers found</SelectItem>
                            }
                        </SelectContent>
                    </Select>
                )} />
                {errors.approverId && <p className="text-sm text-destructive">{errors.approverId.message}</p>}
            </div>
        </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
      </DialogFooter>
    </form>
  );
}
