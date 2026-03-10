import type { TracedPixelPoint } from '@/types/dyno'

interface DotMark {
  pixelX: number
  pixelY: number
  color: string
  label: string
}

interface DynoCanvasProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  dots?: DotMark[]
  tracedPoints?: TracedPixelPoint[]
  onClick?: (pixelX: number, pixelY: number) => void
  onImageLoad?: (width: number, height: number) => void
  interactive?: boolean
}

export default function DynoCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  dots = [],
  tracedPoints = [],
  onClick,
  onImageLoad,
  interactive = false,
}: DynoCanvasProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick || !interactive || imageWidth === 0 || imageHeight === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pixelX = Math.round(((e.clientX - rect.left) / rect.width) * imageWidth)
    const pixelY = Math.round(((e.clientY - rect.top) / rect.height) * imageHeight)
    onClick(pixelX, pixelY)
  }

  return (
    <div
      className={[
        'relative select-none overflow-hidden rounded-lg border border-line bg-lift',
        interactive ? 'cursor-crosshair' : '',
      ].join(' ')}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt="Dyno graph"
        className="block w-full h-auto"
        onLoad={e => {
          const img = e.currentTarget as HTMLImageElement
          onImageLoad?.(img.naturalWidth, img.naturalHeight)
        }}
        draggable={false}
      />

      {imageWidth > 0 && imageHeight > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          preserveAspectRatio="none"
        >
          {/* Traced polyline overlay */}
          {tracedPoints.length > 1 && (
            <polyline
              points={tracedPoints.map(p => `${p.pixelX},${p.pixelY}`).join(' ')}
              fill="none"
              stroke="#22c55e"
              strokeWidth={3}
              opacity={0.75}
            />
          )}

          {/* Calibration dots */}
          {dots.map((dot, i) => (
            <g key={i}>
              <circle
                cx={dot.pixelX}
                cy={dot.pixelY}
                r={10}
                fill={dot.color}
                stroke="#fff"
                strokeWidth={2}
                opacity={0.9}
              />
              <text
                x={dot.pixelX + 14}
                y={dot.pixelY + 5}
                fill={dot.color}
                fontSize={18}
                fontWeight="bold"
                fontFamily='"Barlow Condensed", sans-serif'
              >
                {dot.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
