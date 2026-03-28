import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata: Metadata = {
  title: messages.breadcrumb.privacy,
  description: `${messages.breadcrumb.privacy} — ${config.siteName}`,
  alternates: { canonical: config.routes.privacy },
}

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.privacy, href: config.routes.privacy },
]

export default function PrivacidadePage() {
  return (
    <div data-testid="page-privacidade" className="py-12 md:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={breadcrumbs} />
          <div className="mt-8 prose">
            <h1>Política de Privacidade</h1>
            <p className="text-muted-foreground text-sm">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <h2>1. Quem somos</h2>
            <p>
              A <strong>{config.siteName}</strong> ({config.domain}) é uma software house especializada em
              desenvolvimento de software sob medida. Pedro Corgnati é o responsável pelo
              tratamento de dados pessoais neste site.
            </p>

            <h2>2. Dados que coletamos</h2>
            <p>
              Coletamos apenas os dados fornecidos voluntariamente por você ao entrar em contato
              conosco:
            </p>
            <ul>
              <li>Nome e e-mail (formulário de contato / newsletter)</li>
              <li>Informações do projeto (descrição enviada via WhatsApp ou e-mail)</li>
              <li>Dados de navegação anônimos via analytics (sem identificação pessoal)</li>
            </ul>

            <h2>3. Como usamos seus dados</h2>
            <p>Utilizamos seus dados exclusivamente para:</p>
            <ul>
              <li>Responder às suas solicitações e orçamentos</li>
              <li>Enviar comunicações sobre nossos serviços (com seu consentimento)</li>
              <li>Melhorar nosso site e experiência do usuário</li>
            </ul>

            <h2>4. Compartilhamento de dados</h2>
            <p>
              Não vendemos nem compartilhamos seus dados com terceiros, exceto ferramentas
              operacionais necessárias (ex: plataforma de e-mail) sob contrato de
              confidencialidade.
            </p>

            <h2>5. Seus direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
            <ul>
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar, corrigir ou excluir seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Portabilidade dos dados</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato:{' '}
              <a href={`mailto:${config.email}`}>{config.email}</a>
            </p>

            <h2>6. Cookies</h2>
            <p>
              Utilizamos cookies estritamente necessários para o funcionamento do site e,
              com seu consentimento, cookies de analytics anônimos. Você pode desabilitar
              cookies no seu navegador a qualquer momento.
            </p>

            <h2>7. Contato</h2>
            <p>
              Dúvidas sobre esta política? Entre em contato:{' '}
              <a href={`mailto:${config.email}`}>{config.email}</a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
