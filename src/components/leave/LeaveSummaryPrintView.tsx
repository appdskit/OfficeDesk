
"use client";

import React from 'react';
import type { LeaveSummary, Division } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import { Printer, FileDown } from "lucide-react";
import { saveAs } from 'file-saver';
import asBlob from 'html-to-docx';


interface LeaveSummaryPrintViewProps {
    summary: LeaveSummary;
    division?: Division;
}

export function LeaveSummaryPrintView({ summary, division }: LeaveSummaryPrintViewProps) {
    const printRef = React.useRef<HTMLDivElement>(null);

    const getHtmlContent = () => {
        if (printRef.current) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Leave Summary</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; font-size: 12pt; }
                        .summary-sheet { padding: 20px; }
                        h1, h2, h3 { text-align: center; margin: 10px 0; }
                        h1 { font-size: 16pt; font-weight: bold; }
                        h2 { font-size: 14pt; }
                        .header-table { width: 100%; border-collapse: collapse; margin-block: 20px; }
                        .header-table td { border: none; padding: 4px 0; font-size: 12pt; }
                        .leave-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .leave-table td, .leave-table th { border: 1px solid #000; padding: 8px; text-align: left; }
                        .leave-table th { background-color: #f2f2f2; font-weight: bold; }
                        .leave-table td:not(:first-child), .leave-table th:not(:first-child) { text-align: center; }
                        .signature-area { margin-top: 80px; display: flex; justify-content: space-between; }
                        .signature-box p { margin: 0; }
                    </style>
                </head>
                <body>
                    ${printRef.current.innerHTML}
                </body>
                </html>
            `;
        }
        return '';
    }

    const handlePrint = () => {
        const htmlContent = getHtmlContent();
        if (htmlContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write(htmlContent);
            printWindow?.document.close();
            printWindow?.focus();
            printWindow?.print();
        }
    };
    
    const handleDownloadWord = async () => {
        const htmlContent = getHtmlContent();
        if (htmlContent) {
            try {
                const blob = await asBlob(htmlContent);
                saveAs(blob, `Leave_Summary_${summary.userName.replace(' ', '_')}.docx`);
            } catch (e) {
                console.error("Error generating Word document:", e);
            }
        }
    };

    if (!summary) {
        return <p>No summary data to print.</p>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b print:hidden flex gap-2">
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                <Button onClick={handleDownloadWord} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download as Word
                </Button>
            </div>
            <ScrollArea className="flex-grow bg-gray-100">
                <div ref={printRef} className="p-4 sm:p-8 bg-white shadow-lg my-4 mx-auto max-w-4xl">
                    <div className="summary-sheet">
                        <h1>Leave Entitlement - {summary.year}</h1>
                        
                        <table className="header-table">
                            <tbody>
                                <tr>
                                    <td style={{width: '150px'}}><strong>Name of Officer:</strong></td>
                                    <td>{summary.userName}</td>
                                </tr>
                                <tr>
                                    <td><strong>Division:</strong></td>
                                    <td>{division?.name || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <table className="leave-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Total Entitlement</th>
                                    <th>Leave Taken</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Casual</td>
                                    <td>{summary.totalCasual}</td>
                                    <td>{summary.casualTaken}</td>
                                    <td>{summary.totalCasual - summary.casualTaken}</td>
                                </tr>
                                <tr>
                                    <td>Vocation</td>
                                    <td>{summary.totalVocation}</td>
                                    <td>{summary.vocationTaken}</td>
                                    <td>{summary.totalVocation - summary.vocationTaken}</td>
                                </tr>
                                 <tr>
                                    <td>Past Leave</td>
                                    <td>{summary.totalPast}</td>
                                    <td>-</td>
                                    <td>{summary.totalPast - summary.vocationTaken > 0 ? summary.totalPast - summary.vocationTaken : 0}</td>
                                </tr>
                                <tr>
                                    <td>Medical</td>
                                    <td>{summary.totalMedical}</td>
                                    <td>{summary.medicalTaken}</td>
                                    <td>{summary.totalMedical - summary.medicalTaken}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="signature-area">
                             <div className="signature-box">
                                <p>........................................</p>
                                <p>Signature of Subject Clerk</p>
                            </div>
                            <div className="signature-box">
                                <p>........................................</p>
                                <p>Signature of Officer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
