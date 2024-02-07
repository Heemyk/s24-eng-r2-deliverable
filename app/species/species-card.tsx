"use client";
/*
Note: "use client" is a Next.js App Router directive that tells React to render the component as
a client component rather than a server component. This establishes the server-client boundary,
providing access to client-side functionality such as hooks and event handlers to this component and
any of its imported children. Although the SpeciesCard component itself does not use any client-side
functionality, it is beneficial to move it to the client because it is rendered in a list with a unique
key prop in species/page.tsx. When multiple component instances are rendered from a list, React uses the unique key prop
on the client-side to correctly match component state and props should the order of the list ever change.
React server components don't track state between rerenders, so leaving the uniquely identified components (e.g. SpeciesCard)
can cause errors with matching props and state in child components if the list order changes.
*/
// import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/schema";
import Image from "next/image";
import SpeciesDetailsDialog from "./species-details-dialog";
// import { useState } from "react";
type Species = Database["public"]["Tables"]["species"]["Row"];
// type Comments = Database["public"]["Tables"]["comments"]["Row"];

// // Dialog Imports:
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// Helper Functions
// const cellStyle = {
//   padding: "8px",
//   border: "1px solid #dddddd",
// };

// const headerCellStyle = {
//   ...cellStyle,
//   fontWeight: "bold",
//   backgroundColor: "#f2f2f2",
// };

export default function SpeciesCard({ species, userString }: { species: Species; userString: string }) {
  // Control open/closed state of the information display dialog
  // const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
      <h4 className="text-lg font-light italic">{species.common_name}</h4>
      <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>
      {/* Replace the button with the detailed view dialog. */}
      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-3 w-full">Learn More</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Species Information</DialogTitle>
            <DialogDescription>Information on the species is visible below:</DialogDescription>
          </DialogHeader>

          <div className="w-animal properties grid">
            <table>
              <tr>
                <td style={headerCellStyle}>Scientific Name</td>
                <td style={cellStyle}>{species.scientific_name}</td>
              </tr>
              <tr>
                <td style={headerCellStyle}>Common Name</td>
                <td style={cellStyle}>{species.common_name}</td>
              </tr>
              <tr>
                <td style={headerCellStyle}>Total Population</td>
                <td style={cellStyle}>{species.total_population}</td>
              </tr>
              <tr>
                <td style={headerCellStyle}>Kingdom</td>
                <td style={cellStyle}>{species.kingdom}</td>
              </tr>
              <tr>
                <td style={headerCellStyle}>Description</td>
                <td style={cellStyle}>{species.description}</td>
              </tr>
            </table>
          </div>

          <DialogClose asChild>
            <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
              See less
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog> */}
      <SpeciesDetailsDialog species={species} userString={userString} />
    </div>
  );
}
