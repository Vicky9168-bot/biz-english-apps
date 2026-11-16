import {
  BriefcaseBusiness,
  FileText,
  Handshake,
  Headphones,
  Languages,
  Newspaper,
  Presentation,
  type LucideIcon,
} from 'lucide-react'
import type { FeatureKey } from '@/lib/constants'

// 功能圖示：統一用線條風 icon 取代 emoji，維持商務質感
export const FEATURE_ICONS: Record<FeatureKey, LucideIcon> = {
  charades: Languages,
  listening: Headphones,
  speaking: Presentation,
  idioms: Handshake,
  reading: Newspaper,
  resume: FileText,
  interview: BriefcaseBusiness,
}
