type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </div>
  );
}
