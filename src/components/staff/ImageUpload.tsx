"use client";

import { useState } from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { borrowImage } from "@/ai/flows/borrow-image-flow";

interface ImageUploadProps {
  control: Control<any>;
  name: string;
}

export function ImageUpload({ control, name }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowPrompt, setBorrowPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        field.onChange(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBorrowImage = async (setValue: Function) => {
    if (!borrowPrompt.trim()) {
      toast({ variant: "destructive", title: "Please enter a prompt." });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await borrowImage(borrowPrompt);
      if (result) {
        setPreview(result);
        setValue(name, result);
        setIsBorrowing(false);
        setBorrowPrompt("");
        toast({ title: "Image generated successfully." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Image generation failed.", description: (error as Error).message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-4">
          <div className="w-full aspect-square rounded-md border border-dashed flex items-center justify-center relative overflow-hidden">
            {preview ? (
              <Image src={preview} alt="Profile preview" fill style={{ objectFit: 'cover' }} />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Upload or borrow an image</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Upload Image
              </label>
            </Button>
            <Input id="file-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, field)} />
            <Button variant="outline" onClick={() => setIsBorrowing(true)}>Borrow Image</Button>
          </div>

          <Dialog open={isBorrowing} onOpenChange={setIsBorrowing}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Borrow an Image</DialogTitle>
                <DialogDescription>
                  Describe the image you want to generate using AI.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="prompt">Image Prompt</Label>
                <Input id="prompt" value={borrowPrompt} onChange={(e) => setBorrowPrompt(e.target.value)} placeholder="e.g., 'A professional headshot of a smiling person'" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBorrowing(false)}>Cancel</Button>
                <Button onClick={() => handleBorrowImage(field.onChange)} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    />
  );
}
