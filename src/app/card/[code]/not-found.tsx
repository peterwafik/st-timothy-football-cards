export default function CardNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center font-card">
      <h1 className="text-4xl font-bold uppercase">Card not found</h1>
      <p className="text-white/70">This QR code doesn&apos;t match any player. Ask your teacher for a new one.</p>
    </main>
  );
}
