import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-parchment text-parchment-ink font-reading focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/30 flex field-sizing-content min-h-16 w-full rounded-[calc(var(--radius)*0.55)] border px-2.5 py-2 text-base shadow-[inset_0_2px_4px_oklch(0_0_0_/_0.28)] transition-colors outline-none placeholder:text-[oklch(0.5_0.04_60)] focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-3 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
