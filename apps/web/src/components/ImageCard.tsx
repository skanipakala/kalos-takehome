import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { AspectType } from '@repo/trpc/schema'
import { trpc } from '@/lib/trpc'
import Button from './ui/Button'
import Select from './ui/Select'
import Textarea from './ui/Textarea'

interface ImageCardProps {
  image: {
    id: string
    url: string
    aspect: AspectType
    basePromptId?: string
    style?: string
    meta: {
      positivePrompt: string
      model: string
      steps: number
      cfg: number
      width: number
      height: number
    }
  }
  onImageUpdate?: (newImage: any) => void
}

const aspectOptions = [
  { value: 'HORIZONTAL_191_1', label: '1.9:1 (1216×640) - LinkedIn Post' },
  { value: 'SQUARE_1_1', label: '1:1 (1088×1088) - Square' },
  { value: 'VERTICAL_4_5', label: '4:5 (896×1152) - Portrait' }
]

const tweakChips = [
  'corporate colors',
  'professional lighting', 
  'clean background',
  'business setting',
  'modern office',
  'executive style',
  'add CTA on image'
]

export default function ImageCard({ image, onImageUpdate }: ImageCardProps) {
  const [selectedAspect, setSelectedAspect] = useState<AspectType>(image.aspect)
  const [tweakText, setTweakText] = useState('')
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  const regenerate = trpc.images.regenerate.useMutation()

  const handleChipToggle = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    )
  }

  const handleRegenerate = async () => {
    if (!image.basePromptId) {
      alert('Cannot regenerate: No base prompt ID available')
      return
    }

    try {
      const combinedTweak = [...selectedChips, tweakText.trim()].filter(Boolean).join(', ')
      
      const result = await regenerate.mutateAsync({
        imageId: image.id,
        basePromptId: image.basePromptId,
        aspect: selectedAspect,
        tweakText: combinedTweak
      })

      if (onImageUpdate) {
        onImageUpdate(result)
      }
    } catch (error) {
      console.error('Failed to regenerate image:', error)
      alert('Failed to regenerate image. Please try again.')
    }
  }

  const handleDownload = () => {
    // Open the image URL in a new tab for download
    window.open(image.url, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image Display */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
        {image.url ? (
          <img 
            src={image.url} 
            alt={`Generated ad concept: ${image.style || 'LinkedIn ad'}`}
            className="max-w-full max-h-full object-contain rounded"
            onError={(e) => {
              console.error('Image failed to load:', image.url)
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEZhaWxlZDwvdGV4dD48L3N2Zz4='
            }}
          />
        ) : (
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p>Generating...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Style Badge */}
        {image.style && (
          <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {image.style}
          </div>
        )}

        {/* Aspect Ratio Selector */}
        <Select
          label="Aspect Ratio"
          value={selectedAspect}
          onChange={(e) => setSelectedAspect(e.target.value as AspectType)}
          options={aspectOptions}
        />

        {/* Tweak Chips */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Tweaks
          </label>
          <div className="flex flex-wrap gap-2">
            {tweakChips.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipToggle(chip)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedChips.includes(chip)
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Tweak Text */}
        <Textarea
          label="Custom Tweaks"
          placeholder="Add your custom modifications..."
          value={tweakText}
          onChange={(e) => setTweakText(e.target.value)}
          rows={2}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleRegenerate}
            loading={regenerate.isLoading}
            disabled={regenerate.isLoading}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!image.url}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Meta Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Size: {image.meta.width}×{image.meta.height}</p>
          <p>Model: {image.meta.model}</p>
          <p>Steps: {image.meta.steps} | CFG: {image.meta.cfg}</p>
        </div>
      </div>
    </div>
  )
}
