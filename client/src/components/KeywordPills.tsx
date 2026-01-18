import { cn } from "@/lib/utils";

type KeywordPillsProps = {
  keywords: string[];
  className?: string;
};

export function KeywordPills({ keywords, className }: KeywordPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-full text-slate-600"
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}
