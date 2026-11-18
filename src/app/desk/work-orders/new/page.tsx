import { Banner, Form, Select, Submit, TextArea, TextInput } from "@/components/ui";
import { listUnits } from "@/server/read";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const unit = typeof query.unit === "string" ? query.unit : undefined;
  const units = await listUnits();
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} />
      <h1>New work order</h1>
      <section className="panel">
        <Form op="save-work-order" returnTo="/desk/work-orders">
          <Select
            label="Unit"
            name="unit_id"
            value={unit}
            options={units.map((item) => ({ value: item.id, label: `${item.property_name} ${item.label}` }))}
          />
          <TextInput label="Title" name="title" required />
          <TextArea label="Description" name="description" />
          <div className="row">
            <Select
              label="Priority"
              name="priority"
              value="normal"
              options={["low", "normal", "high", "emergency"].map((value) => ({ value, label: value }))}
            />
            <Select
              label="Status"
              name="status"
              value="open"
              options={["open", "in_progress", "scheduled", "completed", "cancelled"].map((value) => ({ value, label: value.replace(/_/g, " ") }))}
            />
          </div>
          <Submit>Save work order</Submit>
        </Form>
      </section>
    </div>
  );
}
