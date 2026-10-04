import { isFlagCode } from '@/lib/flags';

export function Flag({ code }: { code: string }) {
  const c = isFlagCode(code) ? code : 'EG';
  return <img src={`/flags/${c}.svg`} alt={c} className="block h-auto w-full shadow" />;
}
