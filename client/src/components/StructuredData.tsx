import { useEffect, useMemo } from "react";

type StructuredDataProps = {
  id: string;
  data: Record<string, unknown>;
};

export function StructuredData({ id, data }: StructuredDataProps) {
  const json = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    const selector = `script[data-structured-data="${id}"]`;
    let script = document.head.querySelector<HTMLScriptElement>(selector);

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.structuredData = id;
      document.head.appendChild(script);
    }

    script.text = json;

    return () => {
      script?.remove();
    };
  }, [id, json]);

  return null;
}
