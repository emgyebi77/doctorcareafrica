import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DoctorSelector } from "./DoctorSelector";
import { TimeSlotPicker } from "./TimeSlotPicker";
import type { Doctor, Patient } from "@/types/healthcare";
import type { TimeSlot, AppointmentType } from "@/stores/appointmentStore";

interface BookingFormProps {
  doctors: Doctor[];
  patients?: Patient[];
  selectedDoctor: Doctor | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedPatient: Patient | null;
  appointmentType: AppointmentType;
  notes: string;
  timeSlots: TimeSlot[];
  onDoctorSelect: (doctor: Doctor) => void;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  onTypeChange: (type: AppointmentType) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const appointmentTypes: { value: AppointmentType; label: string }[] = [
  { value: "checkup", label: "Check-up" },
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
  { value: "procedure", label: "Procedure" },
];

export function BookingForm({
  doctors,
  selectedDoctor,
  selectedDate,
  selectedTime,
  appointmentType,
  notes,
  timeSlots,
  onDoctorSelect,
  onDateSelect,
  onTimeSelect,
  onTypeChange,
  onNotesChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BookingFormProps) {
  const canSubmit = selectedDoctor && selectedDate && selectedTime;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            1
          </div>
          <CardTitle>Select Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorSelector
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onSelect={onDoctorSelect}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            2
          </div>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            3
          </div>
          <CardTitle>Select Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSlotPicker
            slots={timeSlots}
            selectedTime={selectedTime}
            onSelect={onTimeSelect}
            disabled={!selectedDate || !selectedDoctor}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            4
          </div>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <Select
              value={appointmentType}
              onValueChange={(value) => onTypeChange(value as AppointmentType)}
              disabled={!selectedTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              disabled={!selectedTime}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {canSubmit && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Booking Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate!, "MMMM d, yyyy")} at {selectedTime} with Dr.{" "}
                  {selectedDoctor!.firstName} {selectedDoctor!.lastName}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
