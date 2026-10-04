// A kid's round photo, or their initials when no photo has been added yet.
export function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="" className="shrink-0 rounded-full bg-chalk/10 object-cover object-top" style={{ width: size, height: size }} />
    );
  }
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-chalk/15 font-stadium font-bold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}
