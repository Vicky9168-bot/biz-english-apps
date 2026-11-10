import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../../site-nav'

const TEMPLATE_LINES: string[] = [
  "Dear [HR Manager's Name],",
  '',
  'My name is [Your Name], and I am a [recent graduate / experienced professional] with a strong background in [mention your field, e.g., Economics, Marketing, Finance, etc.]. I am excited to apply for the [position name] at [Company Name], which I discovered through [mention how you found out about the job: a job board, networking event, LinkedIn].',
  '',
  'After researching your company and learning about its values and achievements, such as [mention something you admire about the company, e.g., innovation, culture, or growth], I am confident that my skills in [mention 2-3 key skills / experiences relevant to the role] make me an excellent fit for this position.',
]

const USEFUL_PATTERNS: Array<{ pattern: string; use: string }> = [
  {
    pattern: 'I was introduced to your firm via [channel].',
    use: '說明你怎麼知道這家公司（介紹人、活動、平台）',
  },
  {
    pattern: 'I am interested in pursuing a [specific position] position in your firm.',
    use: '直接表明你想申請的職位',
  },
  {
    pattern: "I admire [Company Name]'s [something special about the company].",
    use: '展示你對公司的了解與認同',
  },
  {
    pattern:
      'With my [work / internship] experience, I believe that I would make a great fit for the [specific position] position.',
    use: '把你的經歷跟職缺連起來',
  },
]

const CLOSINGS: Array<{ title: string; body: string }> = [
  {
    title: '結尾範例 1 · 正式穩健',
    body: 'I would welcome the opportunity to discuss how my qualifications and experience can contribute to the continued success of [Company Name]. I am available at your convenience and can be reached by phone at +886-XXX-XXX-XXX or via email at [your email address]. Thank you for your time and consideration. I look forward to the possibility of speaking with you soon.',
  },
  {
    title: '結尾範例 2 · 熱情積極',
    body: 'I am excited about the opportunity to contribute to the innovative work at [Company Name] and would appreciate the chance to discuss how my background aligns with your needs. Please feel free to contact me at +886-XXX-XXX-XXX or via email at [your email address] to arrange a conversation. Thank you for your consideration, and I look forward to hearing from you soon.',
  },
]

export default async function ResumeCoverLetterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/resume" backLabel="← 回履歷首頁" />

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 5 · Cover Letter]
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-pretty mb-3">
            Cover Letter 開頭到結尾範本
          </h1>
          <p className="text-slate-700 leading-relaxed">
            Cover Letter 三段就夠：自我介紹 + 為什麼是你、為什麼是這家公司、禮貌收尾。填空範本先寫完，再回頭調整口氣與細節。
          </p>
        </header>

        {/* 開頭範本 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            開頭範本（第一段 + 第二段）
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            方括號 [ ] 內是你要替換成自己資料的地方。
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
            {TEMPLATE_LINES.map((line, i) =>
              line === '' ? (
                <div key={i} className="h-2" />
              ) : (
                <p
                  key={i}
                  className="text-sm text-slate-800 leading-relaxed"
                  translate="no"
                >
                  {line}
                </p>
              )
            )}
          </div>
        </section>

        {/* 好用句型 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            四個好用句型
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            換不同表達方式，避免模板感太重。
          </p>
          <ul className="space-y-3">
            {USEFUL_PATTERNS.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <p
                  className="text-sm text-slate-800 leading-relaxed mb-2"
                  translate="no"
                >
                  &ldquo;{p.pattern}&rdquo;
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">用途：</span>
                  {p.use}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 結尾範例 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            兩種結尾範例
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            依你想給對方的印象（穩健 vs 積極）挑一種。
          </p>
          <div className="space-y-4">
            {CLOSINGS.map((c) => (
              <div
                key={c.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <div className="text-xs font-mono font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  {c.title}
                </div>
                <p
                  className="text-sm text-slate-800 leading-relaxed"
                  translate="no"
                >
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 寫作提醒 */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">
            寫作提醒
          </div>
          <ul className="space-y-1.5 text-sm text-slate-800">
            <li>· 一定要點名 HR / 主管姓名，找不到才用「Hiring Manager」</li>
            <li>· 「為什麼是這家公司」要具體 — 講出你研究過的產品、文化或成就</li>
            <li>· 全篇不超過一頁（約 300 字），比履歷更精簡</li>
            <li>· 電話、Email 一定要放結尾，方便對方直接聯繫</li>
            <li>· 寄出前用 AI 校對文法與拼字，一個錯字就出局</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/resume/experience"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            ← 看 Work Experience
          </Link>
          <Link
            href="/resume"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            回履歷首頁
          </Link>
        </div>
      </div>
    </main>
  )
}
