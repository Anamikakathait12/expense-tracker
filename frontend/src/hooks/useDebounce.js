import { useEffect, useState } from "react";

export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // typing again cancels the pending update
  }, [value, delay]);

  return debounced;
}