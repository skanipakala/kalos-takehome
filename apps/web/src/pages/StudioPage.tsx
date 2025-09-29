import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ImageCard from '@/components/ImageCard'
import Button from '@/components/ui/Button'

export default function StudioPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [images, setImages] = useState<any[]>([])
  const [originalInput, setOriginalInput] = useState<any>(null)

  useEffect(() => {
    // Get images from navigation state
    if (location.state?.images) {
      setImages(location.state.images)
      setOriginalInput(location.state.originalInput)
    } else {
      // If no images in state, redirect to form
      navigate('/')
    }
  }, [location.state, navigate])

  const handleImageUpdate = (index: number, newImage: any) => {
    setImages(prev => {
      const updated = [...prev]
      updated[index] = {
        ...newImage,
        basePromptId: prev[index].basePromptId, // Preserve base prompt ID
        style: prev[index].style // Preserve style
      }
      return updated
    })
  }

  if (!images.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Image Generation Studio
          </h1>
          <p className="text-gray-600 mb-4">
            Your 5 generated images are ready! Customize each one with different aspects and tweaks.
          </p>

          {/* Original Input Summary */}
          {originalInput && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Generated from:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Company:</span> {originalInput.companyUrl}
                </div>
                {originalInput.productName && (
                  <div>
                    <span className="font-medium">Product:</span> {originalInput.productName}
                  </div>
                )}
                <div className="md:col-span-2">
                  <span className="font-medium">Value Prop:</span> {originalInput.businessValue}
                </div>
                <div>
                  <span className="font-medium">Audience:</span> {originalInput.audience}
                </div>
                <div>
                  <span className="font-medium">CTA:</span> {originalInput.footerText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <ImageCard
              key={`${image.id}-${index}`}
              image={image}
              onImageUpdate={(newImage) => handleImageUpdate(index, newImage)}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">💡 How to use the studio:</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>1. <strong>Change Aspect:</strong> Select different ratios for different LinkedIn placements</p>
            <p>2. <strong>Quick Tweaks:</strong> Click chips for instant style modifications</p>
            <p>3. <strong>Custom Tweaks:</strong> Type specific changes (e.g., "darker background", "larger text")</p>
            <p>4. <strong>Regenerate:</strong> Apply your changes to create a new version</p>
            <p>5. <strong>Download:</strong> Save the final images you like</p>
          </div>
        </div>
      </div>
    </div>
  )
}
