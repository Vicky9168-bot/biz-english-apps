'use client'

import { useEffect } from 'react'
import { driver, type DriveStep, type DestroyReason } from 'driver.js'
import 'driver.js/dist/driver.css'
import { TOUR_STEPS } from '@/lib/guide'

// 第一次登入時在首頁帶學員走一遍。
// 是否看過記在這個瀏覽器的 localStorage（以使用者 id 區分），所以換裝置會再出現一次。
// 想重看：新手指南頁的「重新開始導覽」會帶 ?tour=1 回到首頁。
const STORAGE_PREFIX = 'bizenglish:tour:v1:'

// 使用者自己結束導覽才算看過；元件卸載（api）或被取代（replaced）不算
const USER_ENDED: DestroyReason[] = ['done', 'close', 'escape', 'overlay']

function readSeen(key: string) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeSeen(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // 無痕模式等情況存不進去，下次會再出現，可接受
  }
}

export function HomeTour({ userId, force }: { userId: string; force: boolean }) {
  useEffect(() => {
    const key = STORAGE_PREFIX + userId
    if (!force && readSeen(key)) return

    let tour: ReturnType<typeof driver> | undefined

    // 等版面與字體穩定後再開始，高亮框才不會量錯位置
    const timer = window.setTimeout(() => {
      const steps = TOUR_STEPS.flatMap((s): DriveStep[] => {
        const popover = {
          title: s.title,
          description: s.description,
          side: s.side,
          align: s.align ?? 'start',
        }
        if (!s.target) return [{ popover }]
        const el = document.querySelector(`[data-tour="${s.target}"]`)
        // 找不到或在這個螢幕寬度下被隱藏的區塊，直接略過那一步
        if (!el || el.getClientRects().length === 0) return []
        return [{ element: el, popover }]
      })
      if (steps.length < 2) return

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      tour = driver({
        steps,
        popoverClass: 'biz-tour',
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: '下一步',
        prevBtnText: '上一步',
        doneBtnText: '開始學習',
        closeBtnLabel: '跳過導覽',
        overlayColor: '#1a2430',
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 6,
        animate: !reduceMotion,
        smoothScroll: !reduceMotion,
        onPopoverRender: (popover) => {
          // driver.js 預設沒有對話框語意，補上讓讀屏軟體知道這是導覽視窗
          popover.wrapper.setAttribute('role', 'dialog')
          popover.wrapper.setAttribute('aria-label', '網站導覽')
        },
        onDestroyed: (_el, _step, { reason }) => {
          if (!reason || !USER_ENDED.includes(reason)) return
          writeSeen(key)
          if (force) window.history.replaceState(null, '', '/')
        },
      })
      tour.drive()
    }, 700)

    return () => {
      window.clearTimeout(timer)
      tour?.destroy()
    }
  }, [userId, force])

  return null
}
