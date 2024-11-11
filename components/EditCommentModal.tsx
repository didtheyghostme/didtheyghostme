"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { addCommentSchema, AddCommentFormValues } from "@/lib/schema/addCommentSchema";

type EditCommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  isUpdating: boolean;
  initialContent: string;
};

export function EditCommentModal({ isOpen, onClose, onSubmit, isUpdating, initialContent }: EditCommentModalProps) {
  const { control, handleSubmit } = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const handleFormSubmit = async (data: AddCommentFormValues) => {
    try {
      await onSubmit(data.content);
      onClose();
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>Edit Comment</ModalHeader>
          <ModalBody>
            <Controller
              control={control}
              name="content"
              render={({ field, fieldState }) => <Textarea {...field} errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} placeholder="Edit your comment..." />}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" isLoading={isUpdating} type="submit">
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
