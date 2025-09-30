"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { Division, Role } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  staffType: z.enum(["Office", "Field"], { required_error: "Staff type is required." }),
  divisionId: z.string().min(1, { message: "Division is required." }),
});

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "divisions"), (snapshot) => {
      const divisionsData: Division[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division));
      setDivisions(divisionsData);
    });
    return () => unsub();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.name });

      // Find the 'Staff' role to assign as default
      let defaultRoleId: string | null = null;
      const roleQuery = query(collection(db, "roles"), where("name", "==", "Staff"));
      const roleSnapshot = await getDocs(roleQuery);
      if (!roleSnapshot.empty) {
        defaultRoleId = roleSnapshot.docs[0].id;
      } else {
        // Fallback or error handling if 'Staff' role doesn't exist
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Default 'Staff' role not found. Please contact an administrator.",
        });
        setIsLoading(false);
        return;
      }
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        staffType: values.staffType,
        divisionId: values.divisionId,
        roleId: defaultRoleId,
      });

      toast({
        title: "Account Created",
        description: "Your account has been successfully created with a default role.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.code === 'auth/email-already-in-use' 
            ? 'An account with this email already exists.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={form.control} name="divisionId" render={({ field }) => (
            <FormItem><FormLabel>Division</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a division" /></SelectTrigger></FormControl>
                <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="staffType" render={({ field }) => (
            <FormItem className="space-y-3"><FormLabel>Staff Type</FormLabel>
                <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Office" /></FormControl>
                        <FormLabel className="font-normal">Office</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Field" /></FormControl>
                        <FormLabel className="font-normal">Field</FormLabel>
                    </FormItem>
                </RadioGroup>
                </FormControl>
            <FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
