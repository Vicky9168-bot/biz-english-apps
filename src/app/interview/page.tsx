import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_META,
  QuestionCategory,
  getQuestionsByCategory,
} from '@/lib/interview/questions'
import { LEADERSHIP_FRAMEWORKS } from '@/lib/interview/leadership'
import { AppNav } from '../site-nav'
import {
  Callout,
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
} from '../page-kit'

export default async function InterviewHome() {
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

  const categories = (Object.keys(CATEGORY_META) as QuestionCategory[])
    .map((cat) => ({
      slug: cat,
      ...CATEGORY_META[cat],
      count: getQuestionsByCategory(cat).length,
    }))
    .sort((a, b) => a.order - b.order)

  const badge = (n: number) => String(n).padStart(2, '0')

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="英文模擬面試"
          subtitle="從自我介紹、行為題、談薪水到反問老闆，20 題實戰練習，回答後給你思考建議、答題大綱與外部資源。"
        />

        <Callout title="答題結構 > 英文完美">
          面試官記不住你 3 分鐘的答案，只會記得「這人講話有沒有結構」。行為題用 BAR+L（Background-Action-Result-Learning）開頭把情境交代清楚，比堆砌高級單字有效 10 倍。
        </Callout>

        <section className="mb-12">
          <SectionTitle title="選一個題型開始練" />
          <IndexList>
            {categories.map((c) => (
              <IndexRow
                key={c.slug}
                href={`/interview/${c.slug}`}
                tag={badge(c.order)}
                title={c.title}
                desc={c.desc}
                aside={`${c.count} 題`}
              />
            ))}
          </IndexList>
        </section>

        <section>
          <SectionTitle title="面試前必讀" hint="領導力框架" />
          <IndexList>
            {LEADERSHIP_FRAMEWORKS.map((f) => (
              <IndexRow
                key={f.slug}
                href={`/interview/leadership/${f.slug}`}
                title={f.title}
                desc={`${f.company} · ${f.subtitle}。${f.intro.slice(0, 70)}${f.intro.length > 70 ? '…' : ''}`}
                aside={`${f.principles.length} 條`}
              />
            ))}
          </IndexList>
        </section>
      </div>
    </main>
  )
}
