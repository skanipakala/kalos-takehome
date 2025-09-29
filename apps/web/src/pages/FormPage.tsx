import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AdInput, AdInputType } from '@repo/trpc/schema'
import { trpc } from '@/lib/trpc'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

const STORAGE_KEY = 'image-generation-form-data'

export default function FormPage() {
  const navigate = useNavigate()
  const generateImages = trpc.images.generateBatch.useMutation()

  const form = useForm<AdInputType>({
    resolver: zodResolver(AdInput),
    defaultValues: {
      companyUrl: '',
      productName: '',
      businessValue: '',
      audience: '',
      bodyText: '',
      footerText: '',
      renderCtaOnImage: false
    }
  })

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        form.reset(data)
      } catch (error) {
        console.error('Failed to load saved form data:', error)
      }
    }
  }, [form])

  // Save to localStorage on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save form data:', error)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data: AdInputType) => {
    try {
      console.log('Generating images with data:', data)
      const result = await generateImages.mutateAsync(data)
      
      // Navigate to studio with the generated images
      navigate('/studio', { 
        state: { 
          images: result,
          originalInput: data 
        } 
      })
    } catch (error) {
      console.error('Failed to generate images:', error)
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to generate images. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Invalid API key. Please check your Runware API key.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  }

  const fillSampleData = () => {
    const sampleData: AdInputType = {
      companyUrl: 'https://superhuman.com',
      productName: 'Superhuman',
      businessValue: 'Get through your inbox twice as fast',
      audience: 'CEO, Founder, Executive Assistant',
      bodyText: 'Email is the #1 productivity killer. Superhuman gives you superpowers to fly through your inbox with keyboard shortcuts, AI assistance, and lightning-fast performance.',
      footerText: 'Try Superhuman Free',
      renderCtaOnImage: false
    }
    form.reset(sampleData)
  }

  const { errors } = form.formState

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Image Generation Studio
                  </h1>
                  <p className="text-gray-600">
                    Create 5 distinct LinkedIn-style ad images from your business details.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillSampleData}
                  className="ml-4"
                >
                  📝 Fill Sample Data
                </Button>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Company URL"
                placeholder="https://example.com"
                required
                {...form.register('companyUrl')}
                error={errors.companyUrl?.message}
              />

              <Input
                label="Product Name"
                placeholder="Your product or service name (optional)"
                {...form.register('productName')}
                error={errors.productName?.message}
              />

              <Textarea
                label="Business Value"
                placeholder="What value does your product/service provide? (e.g., 'Save 2 hours daily on email management')"
                required
                rows={3}
                {...form.register('businessValue')}
                error={errors.businessValue?.message}
              />

              <Input
                label="Target Audience"
                placeholder="Comma-separated roles (e.g., 'CEO, Marketing Director, Sales Manager')"
                required
                {...form.register('audience')}
                error={errors.audience?.message}
              />

              <Textarea
                label="Body Text"
                placeholder="Pre-image ad copy that provides context..."
                required
                rows={4}
                {...form.register('bodyText')}
                error={errors.bodyText?.message}
              />

              <Input
                label="Footer Text (CTA)"
                placeholder="Learn More | Get Started | Try Free"
                required
                {...form.register('footerText')}
                error={errors.footerText?.message}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="renderCtaOnImage"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  {...form.register('renderCtaOnImage')}
                />
                <label htmlFor="renderCtaOnImage" className="text-sm text-gray-700">
                  Render CTA text directly on images
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  loading={generateImages.isLoading}
                  disabled={generateImages.isLoading}
                  size="lg"
                  className="w-full"
                >
                  {generateImages.isLoading ? 'Generating Images...' : 'Generate 5 Images'}
                </Button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800">💡 Quick Start</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fillSampleData}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Use This Example
                </Button>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Company:</strong> superhuman.com</p>
                <p><strong>Product:</strong> Superhuman</p>
                <p><strong>Value:</strong> Get through your inbox twice as fast</p>
                <p><strong>Audience:</strong> CEO, Founder, Executive Assistant</p>
                <p><strong>CTA:</strong> Try Superhuman Free</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
