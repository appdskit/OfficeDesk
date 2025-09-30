"use client";

import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";

interface WorkingHistoryFormProps {
    control: Control<any>;
}

export function WorkingHistoryForm({ control }: WorkingHistoryFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "workingHistory",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working History</CardTitle>
        <CardDescription>Add previous places of work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((item, index) => (
          <div key={item.id} className="flex items-end gap-4 p-4 border rounded-md relative">
             <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                    <Label htmlFor={`workingHistory.${index}.place`}>Place</Label>
                    <Input {...control.register(`workingHistory.${index}.place`)} />
                </div>
                <div>
                    <Label htmlFor={`workingHistory.${index}.designation`}>Designation</Label>
                    <Input {...control.register(`workingHistory.${index}.designation`)} />
                </div>
             </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ place: "", designation: "" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </CardContent>
    </Card>
  );
}
