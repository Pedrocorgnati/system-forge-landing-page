import type { ReactNode } from 'react'

/**
 * MdxBlogComponents — componentes customizados disponíveis para o MDX dos posts.
 *
 * O conteúdo MDX do blog é compilado pelo velite e executado em runtime por
 * `MDXContent.tsx` via `new Function(code)`. Diferente das páginas `@next/mdx`,
 * esse caminho NÃO consulta `mdx-components.tsx` automaticamente: qualquer
 * componente referenciado no MDX (`<FAQSchema>`, `<Callout>`) precisa ser
 * passado explicitamente via prop `components`. Sem isso, o componente resolve
 * para `undefined` e a renderização quebra com "Element type is invalid".
 *
 * Mantém apenas componentes de bloco (capitalizados) usados de fato no conteúdo
 * gerado pelo pipeline. Overrides de tags HTML (img/pre) ficam fora de propósito
 * para não alterar a renderização dos ~1200 posts existentes.
 */

type CalloutType = 'info' | 'tip' | 'warning'

const calloutStyles: Record<CalloutType, string> = {
  tip: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
}

function Callout({
  type = 'info',
  children,
}: {
  type?: CalloutType
  children: ReactNode
}) {
  return (
    <div
      className={`border-l-4 p-4 my-4 rounded-r-lg ${calloutStyles[type] ?? calloutStyles.info}`}
    >
      {children}
    </div>
  )
}

interface FAQItem {
  question: string
  answer: string
}

/**
 * FAQSchema — renderiza a seção de perguntas frequentes de um post.
 *
 * O pipeline de geração emite duas formas para o mesmo componente:
 *   1. `<FAQSchema questions={[{question, answer}, ...]} />` (self-closing)
 *   2. `<FAQSchema>` ...Q&A em markdown... `</FAQSchema>` (wrapper)
 *
 * Ambas precisam renderizar conteúdo visível. A forma 1 traz os dados no prop
 * `questions`; a forma 2 traz o markdown já compilado em `children`. O JSON-LD
 * `FAQPage` continua sendo emitido pelo bloco `<script type="application/ld+json">`
 * que acompanha o componente no MDX — este componente cuida só do visível.
 */
function FAQSchema({
  questions,
  children,
}: {
  questions?: FAQItem[]
  children?: ReactNode
}) {
  if (Array.isArray(questions) && questions.length > 0) {
    return (
      <div className="faq-schema my-6 flex flex-col gap-5">
        {questions.map((item, i) => (
          <div key={i}>
            <p className="font-semibold text-foreground">{item.question}</p>
            <p className="text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    )
  }
  return <div className="faq-schema my-6">{children}</div>
}

/**
 * Mapa passado a `MDXContent` via prop `components`. Chave = nome usado no MDX.
 */
export const mdxBlogComponents = {
  FAQSchema,
  Callout,
}
