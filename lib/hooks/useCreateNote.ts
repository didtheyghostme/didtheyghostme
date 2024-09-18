// hooks/useCreateNote.ts
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

import actionCreateNote from "@/app/actions/createNote";

const createMutationOptions = (newNote: Note): SWRMutationConfiguration<Note, any, string, Note, Note[]> => ({
  optimisticData: (currentData: Note[] = []) => [...currentData, newNote],
  rollbackOnError: true,
  populateCache: (noteInserted: Note, currentData: Note[] = []) => [...currentData, noteInserted],
  revalidate: false,
});

const useCreateNote = () => {
  const { trigger, isMutating } = useSWRMutation("notesKey", actionCreateNote);

  return {
    createNote: (newNote: Note) => {
      trigger(newNote, createMutationOptions(newNote));
    },
    isCreating: isMutating,
  };
};

export { useCreateNote };
