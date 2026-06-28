'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@/lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'shrink-0 bg-[oklch(0.62_0.11_78)]/80 shadow-[0_1px_0_oklch(0_0_0_/_0.45)] data-horizontal:h-[2px] data-horizontal:w-full data-vertical:w-[2px] data-vertical:self-stretch',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
