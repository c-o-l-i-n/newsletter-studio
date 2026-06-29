// All UI icons are Lucide. This module just maps Lucide icons to the names the
// app already imports, so call sites stay unchanged.
import { Circle, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export {
  FilePlus as NewIcon,
  FolderOpen as OpenIcon,
  Save as SaveIcon,
  Printer as PrintIcon,
  Check as CheckIcon,
  Copy as PagesIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  AlertCircle as AlertIcon,
  Volume2 as SoundOnIcon,
  VolumeX as SoundOffIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Heading3 as HeadingIcon,
  Quote as QuoteIcon,
  List as BulletListIcon,
  ListOrdered as NumberListIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Trash2 as BombIcon,
  ScrollText as QuillScrollIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  X as CloseIcon,
} from 'lucide-react';

// A small filled status dot (saved / unsaved indicators).
export const DotIcon = ({ className, ...props }: LucideProps) => (
  <Circle className={cn('fill-current', className)} {...props} />
);
