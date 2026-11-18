import { Banner, StatusPill } from "@/components/ui";
import { listWorkOrders } from "@/server/read";
import Link from "next/link";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const orders = await listWorkOrders();
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <div className="row">
        <h1>Work orders</h1>
        <Link className="btn" href="/desk/work-orders/new">New work order</Link>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Unit</th><th>Title</th><th>Priority</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/desk/units/${order.unit_id}`}>{order.property_name} {order.unit_label}</Link></td>
                <td>{order.title}<div className="muted">{order.description || "No description"}</div></td>
                <td>{order.priority}</td>
                <td><StatusPill value={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
