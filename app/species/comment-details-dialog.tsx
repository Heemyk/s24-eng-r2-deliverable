"use client";

// import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  // DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
// import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// type Species = Database["public"]["Tables"]["species"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];

// We use zod (z) to define a schema for the "Add species" form.
// zod handles validation of the input values with methods like .string(), .nullable(). It also processes the form inputs with .transform() before the inputs are sent to the database.

// Define kingdom enum for use in Zod schema and displaying dropdown options in the form
// const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

// Use Zod to define the shape + requirements of a Species entry; used in form validation
// const speciesSchema = z.object({
//   scientific_name: z
//     .string()
//     .trim()
//     .min(1)
//     .transform((val) => val?.trim()),
//   common_name: z
//     .string()
//     .nullable()
//     // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
//     .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
//   kingdom: kingdoms,
//   total_population: z.number().int().positive().min(1).nullable(),
//   image: z
//     .string()
//     .url()
//     .nullable()
//     // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
//     .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
//   description: z
//     .string()
//     .nullable()
//     // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
//     .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
// });

const commentSchema = z.object({
  time_made: z.coerce.date().nullable(),
  species_id: z.number().int().positive().min(1),
  other_sugs: z
    .string()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => val?.trim()),
  author: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

// type FormData = z.infer<typeof speciesSchema>;
type CommentData = z.infer<typeof commentSchema>;

// Default values for the form fields.
/* Because the react-hook-form (RHF) used here is a controlled form (not an uncontrolled form),
fields that are nullable/not required should explicitly be set to `null` by default.
Otherwise, they will be `undefined` by default, which will raise warnings because `undefined` conflicts with controlled components.
All form fields should be set to non-undefined default values.
Read more here: https://legacy.react-hook-form.com/api/useform/
*/

export default function CommentDetailsDialog({
  comment,
  isCommenting,
  isAuthor,
  speciesID,
}: {
  comment: Comment;
  isCommenting: boolean;
  isAuthor: boolean;
  speciesID: number;
}) {
  const router = useRouter();

  // Control open/closed state of the dialog
  // const [isEditing, setIsEditing] = useState(false);

  // const [isCommenting, setIsCommenting] = useState(false);

  // const [open, setOpen] = useState<boolean>(false);
  const defaultCommentValues: Partial<CommentData> = {
    time_made: comment.time_made,
    other_sugs: comment.other_sugs,
    species_id: speciesID,
    author: comment.author,
  };

  // const defaultValues: Partial<FormData> = {
  //   scientific_name: species.scientific_name,
  //   common_name: species.common_name,
  //   kingdom: species.kingdom,
  //   total_population: species.total_population,
  //   image: species.image,
  //   description: species.description,
  // };

  const updateDefaultCommentValues = async (commentID: number) => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.from("comments").select().eq("commentid", commentID).maybeSingle();
    if (!error && !(data === null)) {
      defaultCommentValues.time_made = data.time_made;
      defaultCommentValues.other_sugs = data.other_sugs;
    }

    if (error) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    return;
  };

  // Instantiate form functionality with React Hook Form, passing in the Zod schema (for validation) and default values
  // const form = useForm<FormData>({
  //   resolver: zodResolver(speciesSchema),
  //   defaultValues,
  //   mode: "onChange",
  // });

  const commentForm = useForm<CommentData>({
    resolver: zodResolver(commentSchema),
    defaultValues: defaultCommentValues,
    mode: "onChange",
  });

  const onDeleteComment = async (commentID: number) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("comments").delete().eq("commentid", commentID);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    // setIsCommenting(false);
    await updateDefaultCommentValues(comment.commentid);
    commentForm.reset(defaultCommentValues);
    router.refresh();

    return toast({
      title: "Changes saved!",
      description: "Successfully deleted species.",
    });
  };

  const onCommentSubmit = async (Input: CommentData) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("comments").update(Input).eq("commentid", comment.commentid);
    console.log("YES SUBMISSION");

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    // setIsCommenting(false);
    await updateDefaultCommentValues(comment.commentid);
    commentForm.reset(defaultCommentValues);
    router.refresh();

    // return toast({
    //   title: "yes",
    //   description: "yesyes",
    // });
  };

  // const onSubmit = async (input: FormData) => {
  //   // The `input` prop contains data that has already been processed by zod. We can now use it in a supabase query
  //   const supabase = createBrowserSupabaseClient();
  //   const { error } = await supabase.from("species").update(input).eq("id", species.id);

  //   // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
  //   if (error) {
  //     return toast({
  //       title: "Something went wrong.",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  //   setIsEditing(false);

  //   // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit

  //   // Reset form values to the default (empty) values.
  //   // Practically, this line can be removed because router.refresh() also resets the form. However, we left it as a reminder that you should generally consider form "cleanup" after an add/edit operation.
  //   await updateDefaultValues(species.id);
  //   form.reset(defaultValues); // These 2 lines could be replaced with form.reset(input) but making a defaultValues function, whilst increasing processing time, reduces the risk of errors, in case the form is not processed properly (as we draw defaultValues directly from the database rather than relying on the form)

  //   // setOpen(false);

  //   // Refresh all server components in the current route. This helps display the newly created species because species are fetched in a server component, species/page.tsx.
  //   // Refreshing that server component will display the new species from Supabase
  //   router.refresh();

  //   return toast({
  //     title: "Changes saved!",
  //     description: "Successfully changed " + input.scientific_name + ".",
  //   });
  // };

  // const startCommenting = (e: MouseEvent) => {
  //   e.preventDefault();
  //   setIsCommenting(true);
  // };

  // const handleDelete = (e: MouseEvent) => {
  //   e.preventDefault();
  //   if (!window.confirm("Delete this species permanently? This cannot be undone")) {
  //     return;
  //   }
  //   return () => void onDelete(species.id);
  //   // return void onDelete(speciesID).then((void form.handleSubmit(onSubmit)(e)))
  // };

  // const handleCancel = (e: MouseEvent) => {
  //   e.preventDefault();
  //   if (!window.confirm("Discard all changes?")) {
  //     return;
  //   }
  //   commentForm.reset(defaultCommentValues);
  //   // setIsCommenting(false);
  // };

  // const makeComments = (commentId:number) => {
  //   // Can't make loop in a return function, so will make the html for the comments, then call this in the main body

  //   <Form {...submissionForm}>
  //     <form onSubmit={(e: BaseSyntheticEvent) => void submissionForm.handleSubmit(onCommentSubmit)(e)}></form>
  //     <div className="comments-center grid w-full gap-4"></div>
  //   </Form>;
  // };

  // <div id="gap_form">
  //   <input type="hidden" name="PostVar"/>
  //   <a id="myLink" href="javascript:Form2.submit()">
  //     A Link
  //   </a>
  // </div>
  // (document).ready(function () {
  //   (function () {
  //       $('#gap_form').wrap('<form id="Form2" action="http://sitetopostto.com/postpage" method="post" target="_blank"></form>');
  //   })();});

  return (
    <>
      <Form {...commentForm}>
        <form onSubmit={(isCommenting) => void commentForm.handleSubmit(onCommentSubmit)(isCommenting)}>
          <div className="single-comment">
            <FormField
              control={commentForm.control}
              name="other_sugs"
              render={({ field }) => {
                // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Comment {JSON.stringify(comment.time_made)}</FormLabel>
                    <FormControl>
                      <Textarea value={value ?? ""} readOnly={!(isCommenting && isAuthor)} {...rest} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </form>
      </Form>
      <div className="flex">
        {isCommenting && isAuthor && (
          <Dialog>
            <DialogTrigger>
              <Button className="ml-1 mr-1 flex-auto" type="button">
                {" "}
                Delete comment{" "}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deleting comment...</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this comment? It will be deleted permanently
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={() => void onDeleteComment(comment.commentid)}
                type="button"
                className="ml-1 mr-1 flex-auto"
              >
                {" "}
                Delete{" "}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button className="mt-3 w-full">Learn more</Button>
//       </DialogTrigger>
//       <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
//         <DialogHeader>
//           <DialogTitle>{species.scientific_name}</DialogTitle>
//           <DialogDescription>
//             View or edit species here. Click &quot;Add Species&quot; below when you&apos;re done.
//           </DialogDescription>
//         </DialogHeader>
//         <Form {...form}>
//           <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
//             <div className="grid w-full items-center gap-4">
//               <FormField
//                 control={form.control}
//                 name="scientific_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Scientific Name</FormLabel>
//                     <FormControl>
//                       <Input readOnly={!isEditing} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="common_name"
//                 render={({ field }) => {
//                   // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
//                   const { value, ...rest } = field;
//                   return (
//                     <FormItem>
//                       <FormLabel>Common Name</FormLabel>
//                       <FormControl>
//                         <Input value={value ?? ""} readOnly={!isEditing} {...rest} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   );
//                 }}
//               />
//               <FormField
//                 control={form.control}
//                 name="kingdom"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Kingdom</FormLabel>
//                     <Select
//                       disabled={!isEditing}
//                       onValueChange={(value) => field.onChange(kingdoms.parse(value))}
//                       value={field.value}
//                     >
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a kingdom" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectGroup>
//                           {kingdoms.options.map((kingdom, index) => (
//                             <SelectItem key={index} value={kingdom}>
//                               {kingdom}
//                             </SelectItem>
//                           ))}
//                         </SelectGroup>
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="total_population"
//                 render={({ field }) => {
//                   const { value, ...rest } = field;
//                   return (
//                     <FormItem>
//                       <FormLabel>Total population</FormLabel>
//                       <FormControl>
//                         {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
//                         <Input
//                           type="number"
//                           readOnly={!isEditing}
//                           value={value ?? ""}
//                           placeholder="300000"
//                           {...rest}
//                           onChange={(event) => field.onChange(+event.target.value)}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   );
//                 }}
//               />
//               {species.author === userString && (
//                 <FormField
//                   control={form.control}
//                   name="image"
//                   render={({ field }) => {
//                     // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
//                     const { value, ...rest } = field;
//                     return (
//                       <FormItem>
//                         <FormLabel>Image URL</FormLabel>
//                         <FormControl>
//                           <Input
//                             readOnly={!isEditing}
//                             value={value ?? ""}
//                             placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_the_amazing_guinea_pig.jpg/440px-George_the_amazing_guinea_pig.jpg"
//                             {...rest}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     );
//                   }}
//                 />
//               )}
//               <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => {
//                   // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
//                   const { value, ...rest } = field;
//                   return (
//                     <FormItem>
//                       <FormLabel>Description</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           value={value ?? ""}
//                           readOnly={!isEditing}
//                           placeholder="The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
//                           {...rest}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   );
//                 }}
//               />
//               {species.author === userString && (
//                 <div className="flex">
//                   {isEditing ? (
//                     <>
//                       <Button type="submit" className="ml-1 mr-1 flex-auto">
//                         {" "}
//                         Confirm{" "}
//                       </Button>
//                       <Button onClick={handleCancel} type="submit" className="ml-1 mr-1 flex-auto" variant="secondary">
//                         {" "}
//                         Cancel
//                       </Button>
//                     </>
//                   ) : (
//                     <>
//                       <Button onClick={startEditing} type="button" className="ml-1 mr-1 flex-auto">
//                         {" "}
//                         Edit species{" "}
//                       </Button>
//                       <Dialog>
//                         <DialogTrigger>
//                           <Button className="ml-1 mr-1 flex-auto" type="button">
//                             {" "}
//                             Delete species{" "}
//                           </Button>
//                         </DialogTrigger>
//                         <DialogContent>
//                           <DialogHeader>
//                             <DialogTitle>To Delete: {species.scientific_name}</DialogTitle>
//                             <DialogDescription>
//                               Are you sure you want to delete this species? {species.scientific_name} will be deleted
//                               permanently
//                             </DialogDescription>
//                           </DialogHeader>
//                           <Button
//                             onClick={() => void onDelete(species.id)}
//                             type="button"
//                             className="ml-1 mr-1 flex-auto"
//                           >
//                             {" "}
//                             Delete{" "}
//                           </Button>
//                         </DialogContent>
//                       </Dialog>
//                     </>
//                   )}
//                 </div>
//               )}

//               <div className="flex">
//                 <Dialog>
//                   <DialogTrigger>
//                     <Button type="submit" className="ml-1 mr-1 flex-auto">
//                       {" "}
//                       Open comments{" "}
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>Comment Section for {species.scientific_name}</DialogTitle>
//                       <DialogDescription>Recent comments are listed first</DialogDescription>
//                     </DialogHeader>
//                     {/* Comment funtion to go here */}
//                   </DialogContent>
//                 </Dialog>
//               </div>
//             </div>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }
