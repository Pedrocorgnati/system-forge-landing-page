import { loadMessages } from '@config/content'

const m = loadMessages()

const projects = [
  { name: 'ServiziPerCasa', video: '/video/servizipercasa.mp4' },
  { name: 'Stork Logistics', video: '/video/stork-logistics.mp4' },
  { name: 'Piemontech', video: '/video/piemontech.mp4' },
  { name: 'BicoJá', video: '/video/bicoja.mp4' },
  { name: 'Sistema Garantido', video: '/video/sistema-garantido.mp4' },
  { name: 'QuackCoin', video: '/video/Quackcoin.mp4' },
  { name: 'Health Technologies', video: '/video/HealthTechnologies.mp4' },
  { name: 'Divulga Fácil', video: '/video/divulga-facil-dashboard.mp4' },
]

const doubled = [...projects, ...projects]

export function ClientLogosStrip() {
  return (
    <div
      data-testid="section-logos"
      aria-label={m.sections.clients.ariaLabel}
      className="w-full bg-surface border-y border-border py-8 overflow-hidden"
    >
      <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-medium mb-6">
        Empresas que confiaram na SystemForge
      </p>

      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-surface to-transparent z-10" aria-hidden="true" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-surface to-transparent z-10" aria-hidden="true" />

        <div
          className="flex gap-4 animate-marquee"
          aria-hidden="true"
          style={{ width: 'max-content' }}
        >
          {doubled.map((project, i) => (
            <div
              key={`${project.name}-${i}`}
              className="shrink-0 flex flex-col gap-2 w-[180px]"
            >
              {/* Thumbnail de vídeo */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-card">
                <video
                  src={project.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Nome do projeto */}
              <span className="text-xs font-semibold text-muted-foreground text-center truncate px-1">
                {project.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
