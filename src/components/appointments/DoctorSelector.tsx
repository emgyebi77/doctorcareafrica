import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Doctor } from "@/types/healthcare";

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onSelect: (doctor: Doctor) => void;
  disabled?: boolean;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const statusColors = {
  online: "bg-success",
  busy: "bg-warning",
  away: "bg-muted-foreground",
  offline: "bg-muted-foreground",
};

export function DoctorSelector({
  doctors,
  selectedDoctor,
  onSelect,
  disabled = false,
}: DoctorSelectorProps) {
  if (doctors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No doctors available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Select Doctor</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {doctors.map((doctor) => {
          const isSelected = selectedDoctor?.id === doctor.id;
          return (
            <Card
              key={doctor.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary ring-2 ring-primary ring-offset-2",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={() => !disabled && onSelect(doctor)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar size="default">
                    {doctor.avatarUrl && (
                      <AvatarImage
                        src={doctor.avatarUrl}
                        alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(doctor.firstName, doctor.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      statusColors[doctor.status],
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {doctor.specialty}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doctor.availability.slice(0, 3).map((day) => (
                      <Badge key={day} variant="secondary" size="sm">
                        {day}
                      </Badge>
                    ))}
                    {doctor.availability.length > 3 && (
                      <Badge variant="outline" size="sm">
                        +{doctor.availability.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
