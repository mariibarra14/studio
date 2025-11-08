"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
  address: z.string().min(1, { message: "Address is required." }),
  photo: z.any().optional(),
});

export function ProfileDetailsForm() {
    const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar-1");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userAvatar?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "(123) 456-7890",
      address: "123 Main St, Anytown USA",
    },
  });

  const photoRef = form.register("photo");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved.",
    });

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St, Anytown USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-start">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}
                </Button>
            </div>
        </div>
        <div className="md:col-span-1">
             <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                    <FormItem className="flex flex-col items-center text-center gap-4 p-4 border rounded-lg bg-background">
                        <FormLabel className="text-base font-semibold">Profile Photo</FormLabel>
                        <Avatar className="h-32 w-32">
                            <AvatarImage src={photoPreview || undefined} alt="Profile photo preview" />
                            <AvatarFallback className="text-4xl">JD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2 items-center">
                            <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept="image/*"
                            {...photoRef}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                setPhotoPreview(URL.createObjectURL(file));
                                }
                                field.onChange(event);
                            }}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Change Photo
                            </Button>
                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
                />
        </div>
      </form>
    </Form>
  );
}
