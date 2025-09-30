
"use client";

import * as React from "react";
import { createContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, AppUser, StaffProfile, Role } from "@/lib/types";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // Use onSnapshot to listen for real-time updates to the user's profile
        const unsubProfile = onSnapshot(userDocRef, async (userDoc) => {
          let userProfile: UserProfile | null = null;
          
          if (userDoc.exists()) {
            userProfile = userDoc.data() as UserProfile;

            // Fetch role name and permissions if roleId exists
            if (userProfile.roleId) {
              try {
                const roleDoc = await getDoc(doc(db, "roles", userProfile.roleId));
                if (roleDoc.exists()) {
                  const roleData = roleDoc.data() as Role;
                  userProfile.roleName = roleData.name;
                  userProfile.permissions = roleData.permissions; // Assign permissions
                }
              } catch (e) { console.error("Error fetching role", e) }
            }

            // Check for a detailed staff profile to get designation and confirm division
            const staffProfileQuery = query(collection(db, "staffProfiles"), where("createdBy", "==", firebaseUser.uid));
            // Use a snapshot listener for the staff profile as well
            const unsubStaffProfile = onSnapshot(staffProfileQuery, (staffProfileSnapshot) => {
                if (!staffProfileSnapshot.empty) {
                    const staffProfileDoc = staffProfileSnapshot.docs[0];
                    if (staffProfileDoc.exists()) {
                        const staffProfileData = staffProfileDoc.data() as StaffProfile;
                        // Create a mutable copy to update
                        const updatedProfile = { ...user, profile: { ...userProfile } } as AppUser;
                        updatedProfile.profile!.designationGrade = staffProfileData.designationGrade;
                        updatedProfile.profile!.divisionId = staffProfileData.divisionId;
                        setUser(updatedProfile);
                    }
                }
            });
            
             setUser({
                ...firebaseUser,
                profile: userProfile,
             });

          } else {
             setUser({
                ...firebaseUser,
                profile: null,
             });
          }
          
          setLoading(false);
        });

        // Detach the profile listener when the auth state changes
        return () => unsubProfile();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
