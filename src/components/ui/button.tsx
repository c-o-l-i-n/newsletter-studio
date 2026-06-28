import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { sound, type SoundName } from '@/services/sound';

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.7)] border font-sans font-medium tracking-wide whitespace-nowrap outline-none select-none transition-[transform,box-shadow,filter,background-color] duration-75 focus-visible:ring-3 focus-visible:ring-ring/60 active:not-aria-[haspopup]:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Polished brass plaque
        default:
          'border-[oklch(0.4_0.07_60)] bg-gradient-to-b from-[oklch(0.86_0.13_88)] to-[oklch(0.66_0.12_72)] text-[oklch(0.22_0.05_50)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.5),0_2px_0_oklch(0_0_0_/_0.45),0_4px_8px_oklch(0_0_0_/_0.4)] hover:brightness-110 active:shadow-[inset_0_2px_4px_oklch(0_0_0_/_0.4)]',
        // Carved wood key
        outline:
          'border-[oklch(0.5_0.07_72)] bg-gradient-to-b from-[oklch(0.35_0.04_58)] to-[oklch(0.27_0.035_55)] text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.12),0_2px_0_oklch(0_0_0_/_0.5),0_4px_8px_oklch(0_0_0_/_0.32)] hover:brightness-125 hover:border-[oklch(0.62_0.1_78)] aria-expanded:brightness-125 active:shadow-[inset_0_2px_5px_oklch(0_0_0_/_0.5)]',
        // Moss enamel
        secondary:
          'border-[oklch(0.32_0.06_148)] bg-gradient-to-b from-[oklch(0.52_0.09_148)] to-[oklch(0.4_0.08_148)] text-[oklch(0.96_0.03_92)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.18),0_2px_0_oklch(0_0_0_/_0.45),0_4px_8px_oklch(0_0_0_/_0.32)] hover:brightness-115 active:shadow-[inset_0_2px_4px_oklch(0_0_0_/_0.45)]',
        // Subtle: just a wooden hollow that lights up
        ghost:
          'border-transparent text-foreground hover:bg-[oklch(0.34_0.04_58)] hover:border-[oklch(0.5_0.07_72)] aria-expanded:bg-[oklch(0.34_0.04_58)] aria-expanded:border-[oklch(0.5_0.07_72)] active:not-aria-[haspopup]:shadow-[inset_0_2px_4px_oklch(0_0_0_/_0.4)]',
        // Oxblood danger
        destructive:
          'border-[oklch(0.32_0.12_26)] bg-gradient-to-b from-[oklch(0.55_0.17_28)] to-[oklch(0.42_0.16_26)] text-[oklch(0.96_0.04_60)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.18),0_2px_0_oklch(0_0_0_/_0.45),0_4px_8px_oklch(0_0_0_/_0.32)] hover:brightness-110 active:shadow-[inset_0_2px_4px_oklch(0_0_0_/_0.45)]',
        link: 'border-transparent text-primary underline-offset-4 shadow-none hover:underline active:translate-y-0',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Sound played on press. Defaults to a tactile click; null to silence. */
    sfx?: SoundName | null;
    /** Whether to chirp on hover. */
    hoverSound?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  sfx = 'click',
  hoverSound = true,
  onPointerDown,
  onMouseEnter,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerDown={(e) => {
        if (sfx) sound.play(sfx);
        onPointerDown?.(e);
      }}
      onMouseEnter={(e) => {
        if (hoverSound) sound.play('hover');
        onMouseEnter?.(e);
      }}
      {...props}
    />
  );
}

export { Button, buttonVariants };
