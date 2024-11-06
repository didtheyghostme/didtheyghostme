"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, Textarea, Button } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";
import { contactSchema, type ContactFormValues } from "@/lib/schema/contactSchema";

export default function ContactPage() {
  const { createReportAdmin, isCreating } = useCreateReportAdmin();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      mixpanel.track("Contact Page", {
        action: "contact_form_submitted",
      });

      await createReportAdmin({
        entity_type: "contact_us",
        entity_id: "00000000-0000-0000-0000-000000000000", // dummy UUID for contact form
        report_type: "Contact Us",
        report_message: data.message,
      });

      toast.success("Message sent successfully");
      setIsSubmitted(true);
      reset();
    } catch (error) {
      mixpanel.track("Contact Page", {
        action: "contact_form_error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Contact Us</h1>
        </CardHeader>
        <CardBody>
          {isSubmitted ? (
            <div className="text-center">
              <p className="mb-4">Thank you for your message! We will get back to you soon.</p>
              <Button color="primary" onPress={() => setIsSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                control={control}
                name="message"
                render={({ field, fieldState }) => (
                  <Textarea {...field} isRequired errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} label="Message" placeholder="Type your message here..." rows={6} />
                )}
              />
              <Button className="self-end" color="primary" isLoading={isCreating} type="submit">
                Send Message
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
