"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, Textarea, Select, SelectItem } from "@nextui-org/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { contactSchema, type ContactFormValues, CONTACT_TYPES } from "@/lib/schema/contactSchema";
import { CustomButton } from "@/components/CustomButton";

const CONTACT_PLACEHOLDER_MAP = {
  "Bug Report": "Please describe the issue you encountered, including: \n• Steps to reproduce the problem\n• What you expected to happen\n• What actually happened",
  "Feature Request": "Please describe the feature you'd like to see, including: \n• What problem it would solve\n• How you envision it working",
  "Data Issue": "Please describe the incorrect information you found, including: \n• Where you found it\n• What needs to be corrected",
  "General Feedback": "Share your thoughts, suggestions, or any other feedback about the platform",
} as const satisfies Record<ContactType, string>;

export default function ContactPage() {
  const pathname = usePathname();
  const { createReportAdmin, isCreating } = useCreateReportAdmin();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactType: undefined,
      message: "",
    },
  });

  const selectedType = useWatch({
    control,
    name: "contactType",
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      mixpanel.track("Contact Page", {
        action: "contact_form_submitted",
        contact_type: data.contactType,
      });

      await createReportAdmin({
        entity_type: "contact_us",
        entity_id: "00000000-0000-0000-0000-000000000000", // dummy UUID
        report_type: data.contactType,
        report_message: data.message,
      });

      toast.success("Message sent successfully");
      setIsSubmitted(true);
      reset();
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }

      mixpanel.track("Contact Page", {
        action: "contact_form_error",
        contact_type: data.contactType,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    }
  };

  const handleSignInClick = () => {
    mixpanel.track("Contact Page", {
      action: "sign_in_button_clicked",
    });
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card className="gap-2">
        <CardHeader>
          <h1 className="font-semibold sm:text-2xl">Contact Support</h1>
        </CardHeader>
        <CardBody>
          <SignedIn>
            {isSubmitted ? (
              <div className="text-center">
                <p className="mb-4">Thank you for your message! We will get back to you soon.</p>
                <CustomButton color="primary" onPress={() => setIsSubmitted(false)}>
                  Send Another Message
                </CustomButton>
              </div>
            ) : (
              <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  control={control}
                  name="contactType"
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      isRequired
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      label="Type of Contact"
                      placeholder="Select a contact type"
                      variant="bordered"
                    >
                      {Object.entries(CONTACT_TYPES).map(([key, description]) => (
                        <SelectItem key={key} description={description}>
                          {key}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name="message"
                  render={({ field, fieldState }) => (
                    <Textarea
                      {...field}
                      isRequired
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      label="Message"
                      placeholder={CONTACT_PLACEHOLDER_MAP[selectedType] || "Type your message here..."}
                      rows={6}
                    />
                  )}
                />
                <CustomButton className="self-end" color="primary" isLoading={isCreating} type="submit">
                  Send Message
                </CustomButton>
              </form>
            )}
          </SignedIn>

          <SignedOut>
            <div className="text-center">
              <p className="mb-4">Please sign in to send us a message</p>
              <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                <CustomButton color="primary" onPress={handleSignInClick}>
                  Sign In
                </CustomButton>
              </SignInButton>
            </div>
          </SignedOut>
        </CardBody>
      </Card>
    </div>
  );
}
