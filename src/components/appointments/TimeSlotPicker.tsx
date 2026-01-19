import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/stores/appointmentStore";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  disabled?: boolean;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

export function TimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
  disabled = false,
}: TimeSlotPickerProps) {
  const morningSlots = slots.filter((s) => parseInt(s.time.split(":")[0], 10) < 12);
  const afternoonSlots = slots.filter((s) => parseInt(s.time.split(":")[0], 10) >= 12);

  const renderSlots = (slotList: TimeSlot[], label: string) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slotList.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? "default" : "outline"}
            size="sm"
            disabled={!slot.available || disabled}
            onClick={() => onSelect(slot.time)}
            className={cn(
              "h-10 text-xs font-medium transition-all",
              selectedTime === slot.time && "ring-2 ring-primary ring-offset-2",
              !slot.available && "opacity-50 cursor-not-allowed line-through",
            )}
          >
            {formatTime(slot.time)}
          </Button>
        ))}
      </div>
    </div>
  );

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select a doctor and date to view available time slots</p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Available Time Slots</h3>
        <span className="text-sm text-muted-foreground">
          {availableCount} of {slots.length} available
        </span>
      </div>

      <div className="space-y-4">
        {morningSlots.length > 0 && renderSlots(morningSlots, "Morning")}
        {afternoonSlots.length > 0 && renderSlots(afternoonSlots, "Afternoon")}
      </div>
    </div>
  );
}
