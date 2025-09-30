"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, Timestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StaffProfile, Division, UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreateStaffProfileForm } from "@/components/staff/CreateStaffProfileForm";
import { StaffProfileDisplay } from "@/components/staff/StaffProfileDisplay";
import { Button } from "@/components/ui/button";

export default function MyProfilePage() {
  const { user } = useAuth();
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [divisionName, setDivisionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (user?.uid) {
      setLoading(true);
      try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
              const baseProfile = userDocSnap.data() as UserProfile;
              setUserProfile(baseProfile);

              if (baseProfile.divisionId) {
                  const divisionDoc = await getDoc(doc(db, "divisions", baseProfile.divisionId));
                  if (divisionDoc.exists()) {
                      setDivisionName(divisionDoc.data().name);
                  }
              }
          }

          const q = query(collection(db, "staffProfiles"), where("createdBy", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
              const profileDoc = querySnapshot.docs[0];
              const data = profileDoc.data();
              const detailedProfile = {
                  id: profileDoc.id,
                  ...data,
                  dob: (data.dob as Timestamp)?.toDate(),
                  appointmentDate: (data.appointmentDate as Timestamp)?.toDate(),
              } as StaffProfile;
              setStaffProfile(detailedProfile);
          } else {
              setStaffProfile(null);
          }
      } catch (error) {
          console.error("Error fetching profile:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not fetch profile data."});
      } finally {
          setLoading(false);
      }
    } else if (user === null) {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProfile();
    setIsEditing(false); // Exit edit mode on refresh
  }, [user, refreshTrigger, fetchProfile]);

  const handleProfileUpdate = () => {
    setRefreshTrigger(t => t + 1);
    setIsEditing(false);
  };
  

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/4" />
        </div>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 print:hidden">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
                {isEditing ? (staffProfile ? "Edit My Profile" : "Complete Your Staff Profile") : "My Profile"}
            </h2>
        </div>
        
        {isEditing ? (
             <CreateStaffProfileForm 
                userProfile={userProfile}
                existingProfile={staffProfile}
                onProfileSaved={handleProfileUpdate}
             />
        ) : staffProfile ? (
            <StaffProfileDisplay 
                staffProfile={staffProfile} 
                divisionName={divisionName}
                onEdit={() => setIsEditing(true)}
            />
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Complete Your Staff Profile</CardTitle>
                    <CardDescription>Please fill out your detailed staff information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateStaffProfileForm 
                        userProfile={userProfile}
                        existingProfile={null}
                        onProfileSaved={() => setRefreshTrigger(t => t + 1)}
                    />
                </CardContent>
            </Card>
        )}
    </div>
  );
}
