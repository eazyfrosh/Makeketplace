import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FieldError, Input, Label, Select } from "@/components/logistics/ui/input";
import { COUNTRIES } from "@/lib/logistics/data/countries";
import type { ShipmentFormInput } from "@/lib/logistics/validation";

export function ContactFields({
  prefix,
  register,
  errors,
}: {
  prefix: "sender" | "receiver";
  register: UseFormRegister<ShipmentFormInput>;
  errors: FieldErrors<ShipmentFormInput>;
}) {
  const err = errors[prefix];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Full name</Label>
        <Input {...register(`${prefix}.name`)} placeholder="Jane Doe" />
        <FieldError>{err?.name?.message}</FieldError>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...register(`${prefix}.email`)} placeholder="jane@example.com" />
        <FieldError>{err?.email?.message}</FieldError>
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register(`${prefix}.phone`)} placeholder="+1 555 000 1234" />
        <FieldError>{err?.phone?.message}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label>Address</Label>
        <Input {...register(`${prefix}.address`)} placeholder="123 Main Street" />
        <FieldError>{err?.address?.message}</FieldError>
      </div>
      <div>
        <Label>City</Label>
        <Input {...register(`${prefix}.city`)} placeholder="Austin" />
        <FieldError>{err?.city?.message}</FieldError>
      </div>
      <div>
        <Label>Postal code</Label>
        <Input {...register(`${prefix}.postalCode`)} placeholder="73301" />
        <FieldError>{err?.postalCode?.message}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label>Country</Label>
        <Select {...register(`${prefix}.country`)} defaultValue="">
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <FieldError>{err?.country?.message}</FieldError>
      </div>
    </div>
  );
}
