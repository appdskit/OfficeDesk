"use client";

import type { StaffProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Briefcase, Building, Mail, Phone, Calendar, BadgePercent, Hash, Laptop, Printer, Router, Zap, Download, Edit } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";

interface StaffProfileDisplayProps {
    staffProfile: StaffProfile;
    divisionName: string;
    onEdit: () => void;
}

const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("") : "";

const handlePrint = () => {
  try {
    window.print();
  } catch (error) {
    console.error("Print failed. This may be due to sandbox restrictions in the development environment.", error);
    alert("Printing is blocked in this preview environment. This feature will work in the deployed application.");
  }
};


export function StaffProfileDisplay({ staffProfile, divisionName, onEdit }: StaffProfileDisplayProps) {
  const {
    name,
    email,
    profileImage,
    nic,
    designationGrade,
    dob,
    mobileNumber,
    appointmentDate,
    basicSalary,
    salaryCode,
    workingHistory,
    inventory
  } = staffProfile;

  return (
    <div className="space-y-6">
        <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
            </Button>
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print / Download
            </Button>
        </div>
        <div 
            id="printable-profile" 
            className="grid grid-cols-1 xl:grid-cols-3 print:grid-cols-3 gap-6 max-w-7xl mx-auto print:gap-4"
        >
            <div className="xl:col-span-1 print:col-span-1 space-y-6 print:space-y-4">
                <Card className="shadow-md print:shadow-none print:border print:m-0">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32 print:h-24 print:w-24 border-2 border-primary">
                                <AvatarImage src={profileImage ?? ''} alt={name} />
                                <AvatarFallback className="text-4xl print:text-2xl bg-muted">{getInitials(name)}</AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <CardTitle className="text-2xl print:text-xl font-bold font-headline">{name}</CardTitle>
                                <CardDescription className="text-base print:text-sm">{email}</CardDescription>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-md print:shadow-none print:border print:m-0">
                    <CardHeader><CardTitle className="print:text-base">Inventory Checklist</CardTitle></CardHeader>
                    <CardContent className="space-y-3 print:space-y-1 print:p-4 print:pt-0">
                        {inventory?.pcLaptop && <div className="flex items-center gap-3"><Laptop className="h-5 w-5 print:h-4 print:w-4 text-primary" /><p>PC / Laptop</p></div>}
                        {inventory?.lgnAccount && <div className="flex items-center gap-3"><User className="h-5 w-5 print:h-4 print:w-4 text-primary" /><p>LGN Account</p></div>}
                        {inventory?.printer && <div className="flex items-center gap-3"><Printer className="h-5 w-5 print:h-4 print:w-4 text-primary" /><p>Printer ({inventory.printerName || 'N/A'})</p></div>}
                        {inventory?.router && <div className="flex items-center gap-3"><Router className="h-5 w-5 print:h-4 print:w-4 text-primary" /><p>Router</p></div>}
                        {inventory?.ups && <div className="flex items-center gap-3"><Zap className="h-5 w-5 print:h-4 print:w-4 text-primary" /><p>UPS</p></div>}
                        {!inventory || Object.values(inventory).every(v => !v) && <p className="text-muted-foreground">No inventory assigned.</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="xl:col-span-2 print:col-span-2 space-y-6 print:space-y-4">
                <Card className="shadow-md print:shadow-none print:border print:m-0">
                    <CardHeader><CardTitle className="print:text-base">Personal & Official Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-4 print:gap-2 print:p-4 print:pt-0">
                        <InfoItem icon={BadgePercent} label="NIC" value={nic} />
                        <InfoItem icon={Briefcase} label="Designation & Grade" value={designationGrade} />
                        <InfoItem icon={Calendar} label="Date of Birth" value={dob ? format(new Date(dob), "PPP") : 'N/A'} />
                        <InfoItem icon={Phone} label="Mobile Number" value={mobileNumber} />
                        <InfoItem icon={Building} label="Division" value={divisionName || 'N/A'} />
                        <InfoItem icon={Calendar} label="Appointment Date" value={appointmentDate ? format(new Date(appointmentDate), "PPP") : 'N/A'} />
                        <InfoItem icon={Hash} label="Salary Code" value={salaryCode} />
                        <InfoItem icon={User} label="Basic Salary" value={`LKR ${basicSalary.toLocaleString()}`} />
                    </CardContent>
                </Card>
                <Card className="shadow-md print:shadow-none print:border print:m-0">
                    <CardHeader><CardTitle className="print:text-base">Working History</CardTitle></CardHeader>
                    <CardContent className="print:p-4 print:pt-0">
                        {workingHistory && workingHistory.length > 0 ? (
                            <div className="space-y-4 print:space-y-2">
                                {workingHistory.map((history, index) => (
                                    <div key={index} className="flex items-start gap-4 p-3 border rounded-md print:p-2 print:gap-2">
                                        <Briefcase className="h-5 w-5 text-primary mt-1 print:h-4 print:w-4"/>
                                        <div>
                                            <p className="font-semibold print:text-sm">{history.place}</p>
                                            <p className="text-sm text-muted-foreground print:text-xs">{history.designation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No working history available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}


const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3 rounded-lg border p-3 print:p-2 print:gap-2">
        <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1 print:h-4 print:w-4" />
        <div>
            <p className="text-sm font-medium text-muted-foreground print:text-xs">{label}</p>
            <p className="font-semibold print:text-sm">{value}</p>
        </div>
    </div>
);
