"use client";

import { CreateStaffProfileForm } from "@/components/staff/CreateStaffProfileForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateStaffPage() {
    const { user } = useAuth();
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Create Staff Profile</h2>
            </div>
            {/* We pass a dummy onProfileCreated because this page is for admins creating profiles, not for the user's own profile */}
            <CreateStaffProfileForm userProfile={null} onProfileCreated={() => {}} />
        </div>
    );
}
