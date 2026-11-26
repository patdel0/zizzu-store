import { useEffect, useState, type ChangeEvent, type FC } from "react";

interface Tag {
  id: number;
  name: string;
}

export const TagSelector: FC = () => {
  const SUGGESTION_COUNT = 3;
  const [typed, setTyped] = useState("");
  const [suggestionList, setSuggestionList] = useState([]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target == null) {
      return;
    }

    setTyped(event.target.value);
  }

  useEffect(() => {
    const fetchData = async () => {
      if (typed.length == 0) return setSuggestionList([]);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/taxonomies?size=${SUGGESTION_COUNT}&name=${typed}`);
      const data = await response.json();
      setSuggestionList(data);
    }

    fetchData();
  }, [typed]);

  return (
    <div>
      <input type="text" onChange={handleChange} />
      <ol>
        {suggestionList.map((tag: Tag) => <li key={tag.id}>{tag.name}</li>)}
      </ol>
    </div>
  )
};
