-- Playing position shown on the card under the number (e.g. ST, GK). Optional.
alter table public.kids
  add column position text
  check (position in ('GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'));
