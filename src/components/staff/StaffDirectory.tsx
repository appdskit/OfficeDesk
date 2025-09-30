"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { StaffProfile, Division } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { getStaffColumns } from "./staff-columns";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_EMAILS } from "@/lib/config";

export function StaffDirectory() {
  const { user } = useAuth();
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubDivisions = onSnapshot(collection(db, "divisions"), (snapshot) => {
      const divisionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division));
      setDivisions(divisionsData);
    });

    return () => unsubDivisions();
  }, []);

  useEffect(() => {
    if (!user || !user.profile) {
      // If user or profile is not loaded yet, do nothing.
      if (!user) setLoading(false); // If there's no user at all, stop loading.
      return;
    }

    const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
    const isDivisionHead = user.profile.roleName === 'Division Head' || user.profile.roleName === 'Head of Department';

    let profilesQuery;

    if (isAdmin) {
      // Admins see everyone
      profilesQuery = query(collection(db, "staffProfiles"));
    } else if (isDivisionHead && user.profile.divisionId) {
      // Division Heads see only their division
      profilesQuery = query(collection(db, "staffProfiles"), where("divisionId", "==", user.profile.divisionId));
    } else {
      // If user is not admin or division head, they see no one.
      setLoading(false);
      setStaffProfiles([]);
      return;
    }

    setLoading(true);
    const unsubProfiles = onSnapshot(profilesQuery, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure Timestamps are converted to Dates
        const dob = data.dob instanceof Timestamp ? data.dob.toDate() : data.dob;
        const appointmentDate = data.appointmentDate instanceof Timestamp ? data.appointmentDate.toDate() : data.appointmentDate;
        
        return {
          id: doc.id,
          ...data,
          dob,
          appointmentDate,
        } as StaffProfile;
      });
      setStaffProfiles(profilesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching staff profiles: ", error);
      setStaffProfiles([]);
      setLoading(false);
    });

    return () => {
      unsubProfiles();
    };
  }, [user]);

  const columns = getStaffColumns({ divisions });

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return <DataTable columns={columns} data={staffProfiles} filterColumn="name" />;
}
