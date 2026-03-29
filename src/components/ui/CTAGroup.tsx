import { type CTAConfig } from '@/lib/types'
import { CTAButton } from './CTAButton'
import { cn } from '@/lib/utils'

interface CTAGroupProps {
  configs: CTAConfig[]
  layout?: 'horizontal' | 'vertical' | 'grid'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CTAGroup({ configs, layout = 'horizontal', size = 'md', className }: CTAGroupProps) {
  return (
    <div
      data-testid="cta-group"
      className={cn(
        'flex gap-3',
        layout === 'horizontal' && 'flex-col sm:flex-row',
        layout === 'vertical' && 'flex-col',
        layout === 'grid' && 'flex-col sm:flex-row flex-wrap',
        className,
      )}
    >
      {configs.map((config) => (
        <CTAButton
          key={config.action}
          config={config}
          size={size}
          fullWidth={layout === 'vertical'}
          className={layout === 'horizontal' ? 'sm:flex-none' : undefined}
        />
      ))}
    </div>
  )
}
