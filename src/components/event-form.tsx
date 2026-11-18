import { Form, Select, Submit, TextArea, TextInput } from "@/components/ui";
import { wallClock } from "@/domain/format";
import type { EventView, UnitView } from "@/server/read";

export function EventForm({ event, units }: { event?: EventView | null; units: UnitView[] }) {
  const returnTo = event ? `/calendar/${event.id}` : "/calendar";
  return (
    <Form op="save-event" returnTo={returnTo}>
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}
      <TextInput label="Title" name="title" defaultValue={event?.title} required />
      <div className="row">
        <TextInput label="Starts" name="starts_at" type="datetime-local" defaultValue={wallClock(event?.starts_at)} required />
        <TextInput label="Ends" name="ends_at" type="datetime-local" defaultValue={wallClock(event?.ends_at)} required />
      </div>
      <div className="row">
        <Select
          label="Kind"
          name="kind"
          value={event?.kind || "showing"}
          options={["showing", "meeting", "reminder", "blocked"].map((value) => ({ value, label: value }))}
        />
        <Select
          label="Status"
          name="status"
          value={event?.status || "confirmed"}
          options={["confirmed", "tentative", "cancelled"].map((value) => ({ value, label: value }))}
        />
      </div>
      <Select
        label="Unit"
        name="unit_id"
        value={event?.unit_id || ""}
        options={[{ value: "", label: "No unit" }, ...units.map((unit) => ({ value: unit.id, label: `${unit.property_name} ${unit.label}` }))]}
      />
      <div className="row">
        <TextInput label="Attendee email" name="attendee_email" defaultValue={event?.attendee_email || ""} />
        <TextInput label="Attendee name" name="attendee_name" defaultValue={event?.attendee_name || ""} />
      </div>
      <TextInput label="Location" name="location" defaultValue={event?.location || ""} />
      <TextArea label="Details" name="details" defaultValue={event?.details || ""} />
      <Submit>Save event</Submit>
    </Form>
  );
}
