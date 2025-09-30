"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Division, UserProfile, StaffProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { WorkingHistoryForm } from "./WorkingHistoryForm";
import { InventoryChecklistForm } from "./InventoryChecklist";
import { ImageUpload } from "./ImageUpload";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const staffProfileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  nic: z.string().min(1, "NIC is required."),
  designationGrade: z.string().min(1, "Designation with Grade is required."),
  divisionId: z.string().min(1, "Division is required."),
  dob: z.string().min(1, "Date of Birth is required"),
  mobileNumber: z.string().min(1, "Mobile Number is required."),
  appointmentDate: z.string().min(1, "Appointment Date is required."),
  email: z.string().email("Invalid email address."),
  basicSalary: z.coerce.number().min(0, "Basic Salary must be a positive number."),
  salaryCode: z.string().min(1, "Salary Code is required."),
  workingHistory: z.array(z.object({
    place: z.string().min(1, "Place is required."),
    designation: z.string().min(1, "Designation is required."),
  })).optional(),
  inventory: z.object({
    pcLaptop: z.boolean().default(false),
    lgnAccount: z.boolean().default(false),
    printer: z.boolean().default(false),
    printerName: z.string().optional(),
    router: z.boolean().default(false),
    ups: z.boolean().default(false),
  }).optional(),
  profileImage: z.string().optional(),
});

type StaffProfileFormValues = z.infer<typeof staffProfileSchema>;

interface CreateStaffProfileFormProps {
  userProfile: UserProfile | null;
  existingProfile?: StaffProfile | null;
  onProfileSaved: () => void;
}

export function CreateStaffProfileForm({ userProfile, existingProfile, onProfileSaved }: CreateStaffProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingProfile;

  const formatDateForInput = (date: Date | undefined | null) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'yyyy-MM-dd');
    } catch {
        return '';
    }
  }

  const form = useForm<StaffProfileFormValues>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
      divisionId: userProfile?.divisionId || "",
      nic: "",
      designationGrade: "",
      mobileNumber: "",
      dob: '',
      appointmentDate: '',
      basicSalary: 0,
      salaryCode: "",
      workingHistory: [],
      inventory: {
        pcLaptop: false,
        lgnAccount: false,
        printer: false,
        printerName: "",
        router: false,
        ups: false,
      },
      profileImage: "",
    },
  });
  
  useEffect(() => {
    if (existingProfile) {
        form.reset({
            ...existingProfile,
            dob: formatDateForInput(existingProfile.dob as Date),
            appointmentDate: formatDateForInput(existingProfile.appointmentDate as Date),
            divisionId: existingProfile.divisionId || '',
        });
    } else if (userProfile) {
        form.reset({
            name: userProfile.name,
            email: userProfile.email,
            divisionId: userProfile.divisionId || '',
            nic: '',
            designationGrade: '',
            mobileNumber: '',
            dob: '',
            appointmentDate: '',
            basicSalary: 0,
            salaryCode: '',
            workingHistory: [],
            inventory: { pcLaptop: false, lgnAccount: false, printer: false, printerName: "", router: false, ups: false },
            profileImage: ""
        });
    }
  }, [userProfile, existingProfile, form]);


  useEffect(() => {
    const unsub = onSnapshot(collection(db, "divisions"), (snapshot) => {
      const divisionsData: Division[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Division));
      setDivisions(divisionsData);
    });
    return () => unsub();
  }, []);

  const onSubmit = async (data: StaffProfileFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    setLoading(true);

    const dataToSave = {
        ...data,
        dob: parseISO(data.dob),
        appointmentDate: parseISO(data.appointmentDate),
    };

    try {
      if (isEditing && existingProfile) {
        // Update existing profile
        const profileDocRef = doc(db, "staffProfiles", existingProfile.id);
        await updateDoc(profileDocRef, dataToSave);
        toast({ title: "Staff profile updated successfully." });
      } else {
        // Create new profile
        await addDoc(collection(db, "staffProfiles"), {
          ...dataToSave,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Staff profile created successfully." });
      }
      onProfileSaved();
    } catch (error) {
      toast({ variant: "destructive", title: "Submission failed.", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter the staff member's personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><Label>Name</Label><FormControl><Input {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nic" render={({ field }) => (
                    <FormItem><Label>NIC</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem><Label>Date of Birth</Label><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                    <FormItem><Label>Mobile Number</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><Label>Email</Label><FormControl><Input type="email" {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Official Information</CardTitle>
                <CardDescription>Enter the staff member's official details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                   <FormField control={form.control} name="designationGrade" render={({ field }) => (
                    <FormItem><Label>Designation with Grade</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="divisionId" render={({ field }) => (
                    <FormItem><Label>Division</Label>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl>
                        <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   <FormField control={form.control} name="appointmentDate" render={({ field }) => (
                     <FormItem><Label>Appointment Date</Label><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="basicSalary" render={({ field }) => (
                    <FormItem><Label>Basic Salary</Label><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="salaryCode" render={({ field }) => (
                    <FormItem><Label>Salary Code</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <WorkingHistoryForm control={form.control} />
            <InventoryChecklistForm control={form.control} />
            
          </div>

          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <ImageUpload control={form.control} name="profileImage" />
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end gap-4">
             <Button type="button" variant="outline" onClick={onProfileSaved}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Profile" : "Create Profile"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
