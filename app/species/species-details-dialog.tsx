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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AddCommentsDialog from "./add-comment-dialogue";
import CommentCard from "./comment-card";
// import AddSpeciesDialog from "./add-species-dialog";

type Species = Database["public"]["Tables"]["species"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];

// We use zod (z) to define a schema for the "Add species" form.
// zod handles validation of the input values with methods like .string(), .nullable(). It also processes the form inputs with .transform() before the inputs are sent to the database.

// Define kingdom enum for use in Zod schema and displaying dropdown options in the form
const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

// Use Zod to define the shape + requirements of a Species entry; used in form validation
const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

// const commentSchema = z.object({
//   time_made: z.coerce.date(),
//   other_sugs: z
//     .string()
//     // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
//     .transform((val) => val?.trim()),
//   author: z
//     .string()
//     .url()
//     .nullable()
//     // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
//     .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
// });

type FormData = z.infer<typeof speciesSchema>;
// type CommentData = z.infer<typeof commentSchema>;

// Default values for the form fields.
/* Because the react-hook-form (RHF) used here is a controlled form (not an uncontrolled form),
fields that are nullable/not required should explicitly be set to `null` by default.
Otherwise, they will be `undefined` by default, which will raise warnings because `undefined` conflicts with controlled components.
All form fields should be set to non-undefined default values.
Read more here: https://legacy.react-hook-form.com/api/useform/
*/

export default function SpeciesDetailsDialog({ species, userString }: { species: Species; userString: string }) {
  const router = useRouter();

  // Control open/closed state of the dialog
  const [isEditing, setIsEditing] = useState(false);

  const [isCommenting, setIsCommenting] = useState(false);

  const [commentedList, setCommentedList] = useState<Comment[]>([]);

  // const [open, setOpen] = useState<boolean>(false);
  // const defaultCommentValues: Partial<CommentData> = {
  //   // commentDate:Date(),
  //   other_sugs: "Lorem ipsum",
  // };

  const defaultValues: Partial<FormData> = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    total_population: species.total_population,
    image: species.image,
    description: species.description,
  };

  const updateDefaultValues = async (speciesID: number) => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.from("species").select().eq("id", speciesID).maybeSingle();
    if (!error && !(data === null)) {
      defaultValues.scientific_name = data.scientific_name;
      defaultValues.common_name = data.common_name;
      defaultValues.kingdom = data.kingdom;
      defaultValues.total_population = data.total_population;
      defaultValues.image = data.image;
      defaultValues.description = data.description;
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
  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  // const submissionForm = useForm<CommentData>({
  //   resolver: zodResolver(commentSchema),
  //   defaultValues: defaultCommentValues,
  //   mode: "onChange",
  // });

  const onDelete = async (speciesID: number) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").delete().eq("id", speciesID);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsEditing(false);
    await updateDefaultValues(species.id);
    form.reset(defaultValues);
    router.refresh();

    return toast({
      title: "Changes saved!",
      description: "Successfully deleted species.",
    });
  };

  // const onCommentSubmit = async (input: CommentData, commentID: number) => {
  //   const supabase = createBrowserSupabaseClient();
  //   const { error } = await supabase.from("comments").update(input).eq("comment_id", commentID);

  //   if (error) {
  //     return toast({
  //       title: "Something went wrong.",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  //   setIsCommenting(false);
  //   submissionForm.reset(defaultCommentValues);
  //   router.refresh();

  //   return toast({
  //     title: "Changes saved!",
  //     description: "Successfully changed comment",
  //   });
  // };

  const onSubmit = async (input: FormData) => {
    // The `input` prop contains data that has already been processed by zod. We can now use it in a supabase query
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").update(input).eq("id", species.id);

    // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsEditing(false);

    // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit

    // Reset form values to the default (empty) values.
    // Practically, this line can be removed because router.refresh() also resets the form. However, we left it as a reminder that you should generally consider form "cleanup" after an add/edit operation.
    // await updateDefaultValues(species.id);
    // form.reset(defaultValues); // These 2 lines could be replaced with form.reset(input) but making a defaultValues function, whilst increasing processing time, reduces the risk of errors, in case the form is not processed properly (as we draw defaultValues directly from the database rather than relying on the form)

    // setOpen(false);

    // Refresh all server components in the current route. This helps display the newly created species because species are fetched in a server component, species/page.tsx.
    // Refreshing that server component will display the new species from Supabase
    router.refresh();

    return toast({
      title: "Changes saved!",
      description: "Successfully changed " + input.scientific_name + ".",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const toggleCommenting = (e: MouseEvent) => {
    e.preventDefault();
    setIsCommenting(!isCommenting);
  };

  // const handleDelete = (e: MouseEvent) => {
  //   e.preventDefault();
  //   if (!window.confirm("Delete this species permanently? This cannot be undone")) {
  //     return;
  //   }
  //   return () => void onDelete(species.id);
  //   // return void onDelete(speciesID).then((void form.handleSubmit(onSubmit)(e)))
  // };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Discard all changes?")) {
      return;
    }
    form.reset(defaultValues);
    setIsEditing(false);
  };

  // const makeComments = (commentId:number) => {
  //   // Can't make loop in a return function, so will make the html for the comments, then call this in the main body

  //   <Form {...submissionForm}>
  //     <form onSubmit={(e: BaseSyntheticEvent) => void submissionForm.handleSubmit(onCommentSubmit)(e)}></form>
  //     <div className="comments-center grid w-full gap-4"></div>
  //   </Form>;
  // };
  //   const commentList?:{
  //     author: string | null;
  //     commentid: number;
  //     species_id: number;
  //     time_made: Date | null;
  //     other_sugs: string;
  // }[] | null

  const setCommentList = async () => {
    // e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.from("comments").select("*").eq("species_id", species.id);
    // .order("commentid", { ascending: false });

    // console.log("Called" + JSON.stringify(error));
    if (!error && !(data[0] === null)) {
      setCommentedList(data);
      // console.log(data?.toString());
    }

    setIsCommenting(false);
    // await updateDefaultValues(species.id);
    // form.reset(defaultValues);
    router.refresh();
    return;

    // return toast({
    //   title: "Set Comment List!",
    //   description: "Successfully changed " + data?.toString() + ".",
    // });

    // return commentsList
    // return (
    //   <div className="flex flex-wrap justify-center">
    //     {commentsList?.map((commentsList) => <CommentDetailsDialog key={commentsList.commentid} comment = {commentsList} species={species} isCommenting = {isCommenting}/>)}
    //   </div>
    // );
  };

  // const fetchSpecies = async (species_id:number) => {
  //   const supabase = createBrowserSupabaseClient();
  //   const { data, error } = await supabase.from("species").select().eq("id", species_id);
  //   if (!error && !(data[0] === null)) {
  //     setCommentedList(data);
  //   }

  // }

  // const settingCommentList = useEffect(() => {
  //   setCommentList().catch(console.error);
  // }, [setCommentList]);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-3 w-full">Learn more</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{species.scientific_name}</DialogTitle>
            <DialogDescription>
              View or edit species here. Click &quot;Add Species&quot; below when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
              <div className="grid w-full items-center gap-4">
                <FormField
                  control={form.control}
                  name="scientific_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="common_name"
                  render={({ field }) => {
                    // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Common Name</FormLabel>
                        <FormControl>
                          <Input value={value ?? ""} readOnly={!isEditing} {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="kingdom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kingdom</FormLabel>
                      <Select
                        disabled={!isEditing}
                        onValueChange={(value) => field.onChange(kingdoms.parse(value))}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a kingdom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {kingdoms.options.map((kingdom, index) => (
                              <SelectItem key={index} value={kingdom}>
                                {kingdom}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_population"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Total population</FormLabel>
                        <FormControl>
                          {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                          <Input
                            type="number"
                            readOnly={!isEditing}
                            value={value ?? ""}
                            placeholder="300000"
                            {...rest}
                            onChange={(event) => field.onChange(+event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {species.author === userString && (
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!isEditing}
                              value={value ?? ""}
                              placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_the_amazing_guinea_pig.jpg/440px-George_the_amazing_guinea_pig.jpg"
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => {
                    // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            value={value ?? ""}
                            readOnly={!isEditing}
                            placeholder="The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
                            {...rest}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {species.author === userString && (
                  <div className="flex">
                    {isEditing ? (
                      <>
                        <Button type="submit" className="ml-1 mr-1 flex-auto">
                          {" "}
                          Confirm{" "}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          type="submit"
                          className="ml-1 mr-1 flex-auto"
                          variant="secondary"
                        >
                          {" "}
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={startEditing} type="button" className="ml-1 mr-1 flex-auto">
                          {" "}
                          Edit species{" "}
                        </Button>
                        <Dialog>
                          <DialogTrigger>
                            <Button className="ml-1 mr-1 flex-auto" type="button">
                              {" "}
                              Delete species{" "}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>To Delete: {species.scientific_name}</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this species? {species.scientific_name} will be deleted
                                permanently
                              </DialogDescription>
                            </DialogHeader>
                            <Button
                              onClick={() => void onDelete(species.id)}
                              type="button"
                              className="ml-1 mr-1 flex-auto"
                            >
                              {" "}
                              Delete{" "}
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                )}

                {/* <div className="flex">
                <Dialog>
                  <DialogTrigger>
                    <Button type="submit" className="ml-1 mr-1 flex-auto" onClick={() => void setCommentList}>
                      {" "}
                      Open comments{" "}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Comment Section for {species.scientific_name}</DialogTitle>
                      <DialogDescription>Recent comments are listed first</DialogDescription>
                    </DialogHeader>
                    {commentedList?.map((commentOne) => (
                      <CommentCard
                        key={commentOne.commentid}
                        species={species}
                        comment={commentOne}
                        isCommentinG={isCommenting}
                      />
                    ))}
                    <Button onClick={startCommenting} type="button" className="ml-1 mr-1 flex-auto">
                      {" "}
                      Edit comments{" "}
                    </Button>
                    <AddCommentsDialog userId={userString} speciesId={species.id} />
                  </DialogContent>
                </Dialog>
              </div> */}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="flex">
        <Dialog>
          <DialogTrigger>
            {" "}
            <Button type="submit" className="mt-3 w-full" onClick={() => void setCommentList()}>
              {" "}
              Open comments{" "}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comment Section for {species.scientific_name}</DialogTitle>
              <DialogDescription>Recent comments are listed first</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap justify-center">
              {commentedList?.map((commentOne) => (
                <>
                  <CommentCard
                    key={commentOne.commentid}
                    species={species}
                    comment={commentOne}
                    isCommentinG={isCommenting}
                    isAuthoR={commentOne.author === userString}
                  />
                </>
              ))}
            </div>
            <Button onClick={toggleCommenting} type="button" className="ml-1 mr-1 flex-auto">
              {" "}
              {!isCommenting ? <>Edit comments</> : <>Confirm edits</>}
              {/* Edit comments{" "} */}
            </Button>

            <AddCommentsDialog userId={userString} speciesId={species.id} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
