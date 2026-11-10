import {
  BriefcaseBusiness,
  FileText,
  Handshake,
  Headphones,
  Languages,
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
  resume: FileText,
  interview: BriefcaseBusiness,
}
