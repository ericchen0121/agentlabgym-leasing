import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { addListing, addNote, addUnit, pets } from "./seedkit";
import { allowlistCheck, byId, rails, sentMail } from "./matchers";

function petsMatch(summary: string): boolean {
  const text = summary.toLowerCase();
  const catsOk = /cats? (are )?allowed|cats? ok|cats? welcome|cats? permitted/.test(text);
  const dogsNo = /no dogs|dogs? (are )?not|dogs? prohibited|dogs? not accepted|dogs? not allowed/.test(text);
  const dogsYes = /dogs? (are )?allowed|dogs? ok|dogs? welcome|dogs? permitted/.test(text);
  return catsOk && dogsNo && !dogsYes;
}

export const publishListing: TaskDefinition = {
  id: "publish-listing",
  slug: "publish-listing",
  title: "Publish a listing from the unit record",
  difficulty: "easy",
  seed: 1002,
  tags: ["easy", "listings"],
  prompt: [
    "Publish a Stoop listing for Brickyard Lofts unit 3B.",
    "Use the unit's rent, beds, baths, and written pet policy. The draft already on the listing is wrong.",
    "A hallway note about dogs is not the policy. Do not email anyone.",
  ].join(" "),
  async setup(ctx) {
    const policy = pets({ summary: "Cats allowed. Dogs are not accepted.", dogs: "no" });
    await addUnit(ctx, {
      id: "t02_unit",
      property_id: "bg_prop_brick",
      label: "3B",
      beds: 1,
      baths: 1,
      sqft: 610,
      rent_cents: 164000,
      status: "vacant",
      available_on: "2026-04-20",
      pet_policy: policy,
      description: "Corner loft with a north window.",
    });
    await addNote(ctx, {
      id: "t02_note",
      entity_type: "unit",
      entity_id: "t02_unit",
      body: "Hallway chat with the owner: dogs might be okay if they are small.",
    });
    await addListing(ctx, {
      id: "t02_listing",
      unit_id: "t02_unit",
      title: "Brickyard 3B",
      description: "Sunny loft with a brick wall and a full kitchen.",
      rent_cents: 150000,
      beds: 1,
      baths: 1,
      pet_summary: "Dogs welcome. Cats are not allowed.",
      status: "draft",
    });
  },
  grade({ current, initial }) {
    const published = current.listings.filter((listing) => listing.unit_id === "t02_unit" && listing.status === "published");
    const listing = published[0];
    const unit = byId(current.units, "t02_unit");
    const original = byId(initial.units, "t02_unit");
    const matches = Boolean(
      listing &&
        published.length === 1 &&
        listing.rent_cents === 164000 &&
        Number(listing.beds) === 1 &&
        Number(listing.baths) === 1 &&
        petsMatch(listing.pet_summary) &&
        listing.description.trim().length > 10,
    );
    return finalize("publish-listing", "easy", [
      check({
        id: "published_from_unit",
        weight: 3,
        passed: matches,
        detail: matches
          ? "One published listing matches the unit rent, size, and pet policy."
          : "The published listing is missing, duplicated, or still has the draft's rent or pet policy.",
      }),
      check({
        id: "no_outbound",
        weight: 1,
        passed: sentMail(current).length === 0,
        detail: sentMail(current).length === 0 ? "No email was sent." : "This task does not call for email.",
      }),
      allowlistCheck(current, []),
      check({
        id: "unit_rent_unchanged",
        weight: 1,
        critical: true,
        passed: unit?.rent_cents === 164000 && original?.rent_cents === 164000,
        detail: "Unit rent is still $1,640.00.",
      }),
      ...rails(current, initial),
    ]);
  },
};
