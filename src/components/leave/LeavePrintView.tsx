
"use client";

import type { LeaveApplication } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import React from "react";
import { format } from "date-fns";

interface LeavePrintViewProps {
    applications: LeaveApplication[];
}

export function LeavePrintView({ applications }: LeavePrintViewProps) {
    const printRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>Print Leave Application</title>');
            // A very basic stylesheet for printing
            printWindow?.document.write(`
                <style>
                    body { font-family: sans-serif; line-height: 1.5; }
                    .leave-application { 
                        border: 1px solid #ccc; 
                        padding: 20px; 
                        margin-bottom: 20px; 
                        page-break-inside: avoid;
                    }
                    h1, h2, h3 { margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .no-border td { border: none; padding: 2px 8px; }
                    .signature-area { margin-top: 50px; }
                    .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 40px; }
                </style>
            `);
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printContent);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.print();
        }
    };

    if (!applications || applications.length === 0) {
        return <p>No applications to print.</p>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b">
                 <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
            <ScrollArea className="flex-grow">
                <div ref={printRef} className="p-4 sm:p-6 space-y-6">
                    {applications.map(app => (
                        <div key={app.id} className="leave-application">
                            <h2 style={{textAlign: 'center', fontWeight: 'bold'}}>Leave Application Form</h2>
                            
                            <table className="no-border">
                                <tbody>
                                    <tr><td>Name of Applicant:</td><td>{app.userName}</td></tr>
                                    <tr><td>Designation:</td><td>{app.designation}</td></tr>
                                    <tr><td>Division:</td><td>{app.divisionId} {/* Consider fetching division name */}</td></tr>
                                </tbody>
                            </table>
                            <hr style={{margin: '15px 0'}}/>
                             <table>
                                <tbody>
                                    <tr><td>Leave Type:</td><td>{app.leaveType}</td></tr>
                                    <tr><td>Number of Days:</td><td>{app.leaveDays}</td></tr>
                                    <tr>
                                        <td>Date of leaving:</td>
                                        <td>{format(app.startDate, 'PPP')} {app.startTime ? `(${app.startTime})` : ''}</td>
                                    </tr>
                                     <tr>
                                        <td>Date of resumption of duties:</td>
                                        <td>{format(app.resumeDate, 'PPP')} {app.resumeTime ? `(${app.resumeTime})` : ''}</td>
                                    </tr>
                                     <tr><td>Reason for Leave:</td><td>{app.reason}</td></tr>
                                </tbody>
                            </table>
                            <div className="signature-area grid grid-cols-2 gap-8">
                                <div>
                                    <div className="signature-line"></div>
                                    <p>Signature of Applicant</p>
                                    <p>Date: {format(app.createdAt as Date, 'PPP')}</p>
                                </div>
                                <div>
                                    <div className="signature-line"></div>
                                    <p>Signature of Acting Officer</p>
                                </div>
                            </div>
                              <hr style={{margin: '15px 0'}}/>
                              <div>
                                <h3>Recommendation of the Head of Division</h3>
                                <p>Comment: {app.comments?.recommender || '________________'}</p>
                                <div className="signature-area">
                                     <div className="signature-line"></div>
                                     <p>Signature & Date</p>
                                </div>
                              </div>
                               <hr style={{margin: '15px 0'}}/>
                              <div>
                                <h3>Approval of the Head of Department</h3>
                                <p>Comment: {app.comments?.approver || '________________'}</p>
                                <div className="signature-area">
                                     <div className="signature-line"></div>
                                     <p>Signature & Date</p>
                                </div>
                              </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
