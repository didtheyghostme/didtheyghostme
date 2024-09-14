// hooks/useCreateNote.ts
import useSWRMutation from "swr/mutation";

import actionCreateNote from "@/app/actions/createNote";

const useCreateNote = () => {
  const { trigger, isMutating: isCreating } = useSWRMutation(
    "notesKey",
    actionCreateNote,
  );

  const createNote = (newNote: Note) => {
    return trigger(newNote, {
      optimisticData: (currentNotes: Note[] = []) => [...currentNotes, newNote],
      rollbackOnError: true,
      populateCache: (noteInserted: Note, currentNotes: Note[] = []) => [
        ...currentNotes,
        noteInserted,
      ],
      revalidate: false,
    });
  };

  return {
    createNote,
    isCreating,
  };
};

export { useCreateNote };
