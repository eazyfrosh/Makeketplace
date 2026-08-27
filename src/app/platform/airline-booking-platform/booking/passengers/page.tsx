"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, User2 } from "lucide-react";
import { BookingSteps } from "@/components/airline/booking/booking-steps";
import { TripSummary } from "@/components/airline/booking/trip-summary";
import { Button } from "@/components/airline/ui/button";
import { FieldError, Input, Label, Select } from "@/components/airline/ui/input";
import { useBookingStore } from "@/lib/airline/store/booking-store";
import { passengersFormSchema, type PassengersFormValues } from "@/lib/airline/validation";
import { nationalities } from "@/lib/airline/data/nationalities";
import { useBookingHydrated } from "@/lib/airline/store/use-hydrated";
import type { PassengerInfo } from "@/lib/airline/types";

function blankPassenger(type: PassengerInfo["type"], idx: number): PassengerInfo {
  return {
    id: `p-${Date.now()}-${idx}`,
    type,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    passportNumber: "",
    gender: "male",
    email: "",
    phone: "",
  };
}

export default function PassengersPage() {
  const hydrated = useBookingHydrated();
  if (!hydrated) return null;
  return <PassengersForm />;
}

function PassengersForm() {
  const router = useRouter();
  const { itinerary, searchParams, passengers: storedPassengers, setPassengers } = useBookingStore();

  const defaultPassengers = useMemo<PassengerInfo[]>(() => {
    if (storedPassengers.length > 0) return storedPassengers;
    const counts = searchParams?.passengers ?? { adults: 1, children: 0, infants: 0 };
    const list: PassengerInfo[] = [];
    for (let i = 0; i < counts.adults; i++) list.push(blankPassenger("adult", list.length));
    for (let i = 0; i < counts.children; i++) list.push(blankPassenger("child", list.length));
    for (let i = 0; i < counts.infants; i++) list.push(blankPassenger("infant", list.length));
    return list.length > 0 ? list : [blankPassenger("adult", 0)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PassengersFormValues>({
    resolver: zodResolver(passengersFormSchema),
    defaultValues: { passengers: defaultPassengers },
  });

  const { fields } = useFieldArray({ control, name: "passengers" });

  useEffect(() => {
    if (itinerary.filter(Boolean).length === 0) {
      router.replace("/platform/airline-booking-platform#search-widget");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: PassengersFormValues) {
    setPassengers(values.passengers);
    router.push("/platform/airline-booking-platform/booking/extras");
  }

  if (itinerary.filter(Boolean).length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingSteps current="passengers" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Passenger information</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Enter details exactly as they appear on each traveler&apos;s passport.
            </p>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <User2 size={15} />
                </span>
                <h2 className="font-semibold capitalize">
                  Passenger {index + 1} <span className="font-normal text-foreground/50">({field.type})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>First name</Label>
                  <Input {...register(`passengers.${index}.firstName`)} placeholder="Jane" />
                  <FieldError>{errors.passengers?.[index]?.firstName?.message}</FieldError>
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input {...register(`passengers.${index}.lastName`)} placeholder="Doe" />
                  <FieldError>{errors.passengers?.[index]?.lastName?.message}</FieldError>
                </div>
                <div>
                  <Label>Date of birth</Label>
                  <Input type="date" {...register(`passengers.${index}.dateOfBirth`)} />
                  <FieldError>{errors.passengers?.[index]?.dateOfBirth?.message}</FieldError>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select {...register(`passengers.${index}.gender`)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div>
                  <Label>Nationality</Label>
                  <Select {...register(`passengers.${index}.nationality`)} defaultValue="">
                    <option value="" disabled>Select nationality</option>
                    {nationalities.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                  <FieldError>{errors.passengers?.[index]?.nationality?.message}</FieldError>
                </div>
                <div>
                  <Label>Passport number</Label>
                  <Input {...register(`passengers.${index}.passportNumber`)} placeholder="X1234567" />
                  <FieldError>{errors.passengers?.[index]?.passportNumber?.message}</FieldError>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register(`passengers.${index}.email`)} placeholder="jane@example.com" />
                  <FieldError>{errors.passengers?.[index]?.email?.message}</FieldError>
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input type="tel" {...register(`passengers.${index}.phone`)} placeholder="+1 555 000 1234" />
                  <FieldError>{errors.passengers?.[index]?.phone?.message}</FieldError>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Continue to extras <ArrowRight size={17} />
            </Button>
          </div>
        </form>

        <div>
          <TripSummary />
        </div>
      </div>
    </div>
  );
}
