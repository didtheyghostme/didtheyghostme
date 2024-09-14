import useSWR from "swr";

import actionReadNote from "@/app/actions/readNote";

const useReadNote = () => {
  const { data, isLoading } = useSWR<Note[]>("notesKey", actionReadNote);

  return { data, isLoading };
};

export default useReadNote;
