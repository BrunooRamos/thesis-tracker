export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#e9e7df] dark:border-[#383c48] border-t-[#ff7c11] rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
