"use client";

import { Control, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface InventoryChecklistFormProps {
  control: Control<any>;
}

export function InventoryChecklistForm({ control }: InventoryChecklistFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Checklist</CardTitle>
        <CardDescription>Select the items assigned to the staff member.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Controller
          name="inventory.pcLaptop"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Checkbox id="pcLaptop" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="pcLaptop">PC / Laptop</Label>
            </div>
          )}
        />
        <Controller
          name="inventory.lgnAccount"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Checkbox id="lgnAccount" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="lgnAccount">LGN Account</Label>
            </div>
          )}
        />
        <div className="flex items-center space-x-4">
            <Controller
            name="inventory.printer"
            control={control}
            render={({ field }) => (
                <div className="flex items-center space-x-2">
                <Checkbox id="printer" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="printer">Printer</Label>
                </div>
            )}
            />
            <Controller
                name="inventory.printerName"
                control={control}
                render={({ field, fieldState }) => (
                    <Input {...field} placeholder="Printer Name/Model" className="max-w-xs" />
                )}
            />
        </div>

        <Controller
          name="inventory.router"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Checkbox id="router" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="router">Router</Label>
            </div>
          )}
        />
        <Controller
          name="inventory.ups"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Checkbox id="ups" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="ups">UPS</Label>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
