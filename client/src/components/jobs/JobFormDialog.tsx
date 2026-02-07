import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CreateJobPayload } from "@/api/jobs";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const jobFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  trade: z.string().trim().min(1, "Trade is required"),
  region: optionalTrimmedString,
  country: optionalTrimmedString,
  description: optionalTrimmedString,
  privateDetails: optionalTrimmedString,
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  disableReason?: string | null;
}

export function JobFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  disableSubmit,
  disableReason,
}: JobFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      trade: "",
      region: "",
      country: "",
      description: "",
      privateDetails: "",
    },
  });

  const onFormSubmit = async (values: JobFormValues) => {
    await onSubmit({
      title: values.title.trim(),
      trade: values.trade.trim(),
      region: values.region?.trim() || undefined,
      country: values.country?.trim() || undefined,
      description: values.description?.trim() || undefined,
      privateDetails: values.privateDetails?.trim() || undefined,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a job</DialogTitle>
          {disableReason && (
            <p className="text-sm text-amber-600 mt-2">{disableReason}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} className={errors.title ? "border-red-500" : ""} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="trade">Trade</Label>
            <Input id="trade" {...register("trade")} className={errors.trade ? "border-red-500" : ""} />
            {errors.trade && <p className="text-xs text-red-500 mt-1">{errors.trade.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" {...register("region")} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Public summary</Label>
            <Textarea id="description" rows={3} {...register("description")} />
            <p className="text-xs text-slate-500 mt-1">Visible to all trades on the board.</p>
          </div>
          <div>
            <Label htmlFor="privateDetails">Private details</Label>
            <Textarea id="privateDetails" rows={3} {...register("privateDetails")} />
            <p className="text-xs text-slate-500 mt-1">
              Only visible to you and assigned collaborators. Keep sensitive access info here.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit || isSubmitting}>
              {isSubmitting ? "Posting..." : "Post job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
