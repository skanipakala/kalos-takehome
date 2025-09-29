import { AspectType, AdInputType } from "@repo/trpc/schema";
import crypto from "crypto";

export const ASPECT_SPECS = {
  HORIZONTAL_191_1: { w: 1216, h: 640 }, // 1.9:1 ratio, multiples of 64
  SQUARE_1_1: { w: 1088, h: 1088 },      // 1:1 ratio, multiples of 64  
  VERTICAL_4_5: { w: 896, h: 1152 }     // 4:5 ratio, multiples of 64
} as const;

export const DEFAULTS = { 
  steps: 28, 
  cfg: 7.0, 
  model: "runware:101@1" // Professional model for business content
} as const;

// Ephemeral storage for base prompts (in-memory only)
const basePromptStorage = new Map<string, any>();

export function buildRunwareTask(positivePrompt: string, aspect: AspectType, model = DEFAULTS.model) {
  const { w, h } = ASPECT_SPECS[aspect] as { w: number; h: number };
  const negativePrompt = "anime, cartoon, illustration, artistic, fantasy, gaming, casual, informal, low quality, blurry, distorted, watermark, text overlay, busy background";
  
  return {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    positivePrompt,
    negativePrompt,
    height: h,
    width: w,
    model,
    steps: DEFAULTS.steps,
    CFGScale: DEFAULTS.cfg,
    numberResults: 1
  };
}

export async function runRunwareTasks(tasks: any[]) {
  const res = await fetch("https://api.runware.ai/v1/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`
    },
    body: JSON.stringify(tasks)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Runware API error ${res.status}: ${errorText}`);
  }
  const result = await res.json() as any;
  console.log('Runware API response:', JSON.stringify(result, null, 2));
  
  // Handle different response formats
  if (Array.isArray(result)) {
    return result;
  } else if (result.data && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
  }
}

export function buildFiveVariantPrompts(input: AdInputType) {
  const { companyUrl, productName, businessValue, audience, footerText, renderCtaOnImage } = input;
  
  // Extract brand name from URL
  const brand = companyUrl.replace(/(https?:\/\/)?(www\.)?/, '').split('.')[0];
  const audienceList = audience.split(',').map(a => a.trim()).slice(0, 3).join(', ');
  
  // Professional LinkedIn B2B ad context
  const baseContext = `Professional LinkedIn B2B advertisement for ${brand}${productName ? ` ${productName}` : ''}, targeting ${audienceList}. Business value proposition: ${businessValue}. Corporate marketing style, clean business aesthetic, professional photography quality.`;
  
  const ctaSuffix = renderCtaOnImage ? ` Include subtle CTA text area: "${footerText}"` : '';
  
  const variants = [
    {
      id: crypto.randomUUID(),
      prompt: `${baseContext} Corporate office environment, professional business people in modern workspace, clean corporate photography, high-end business setting, professional lighting, corporate colors, space for headline text.${ctaSuffix}`,
      aspect: "HORIZONTAL_191_1" as AspectType,
      model: DEFAULTS.model,
      style: "Professional Office Scene"
    },
    {
      id: crypto.randomUUID(),
      prompt: `${baseContext} Clean corporate dashboard or business analytics interface, professional data visualization, modern business technology, corporate blue and white color scheme, professional photography, space for marketing copy.${ctaSuffix}`,
      aspect: "HORIZONTAL_191_1" as AspectType,
      model: DEFAULTS.model,
      style: "Business Dashboard"
    },
    {
      id: crypto.randomUUID(),
      prompt: `${baseContext} Professional handshake or business meeting scene, corporate executives, modern conference room, professional photography, clean business aesthetic, corporate colors, space for headline.${ctaSuffix}`,
      aspect: "SQUARE_1_1" as AspectType,
      model: DEFAULTS.model,
      style: "Business Meeting"
    },
    {
      id: crypto.randomUUID(),
      prompt: `${baseContext} Modern corporate building exterior or office lobby, professional architecture photography, clean lines, corporate branding, professional lighting, business environment, space for text overlay.${ctaSuffix}`,
      aspect: "SQUARE_1_1" as AspectType,
      model: DEFAULTS.model,
      style: "Corporate Architecture"
    },
    {
      id: crypto.randomUUID(),
      prompt: `${baseContext} Professional business charts and graphs, corporate data visualization, clean infographic style, business analytics, professional color scheme, corporate marketing materials, space for headline text.${ctaSuffix}`,
      aspect: "VERTICAL_4_5" as AspectType,
      model: DEFAULTS.model,
      style: "Business Analytics"
    }
  ];
  
  // Store base prompts for later tweaking
  variants.forEach(variant => {
    basePromptStorage.set(variant.id, {
      basePrompt: variant.prompt,
      originalInput: input,
      model: variant.model,
      style: variant.style
    });
  });
  
  return variants;
}

export function shapeBatchResponse(runwareResults: any[], variants: any[]) {
  return runwareResults.map((result, index) => {
    const variant = variants[index];
    const aspect = variant.aspect as AspectType;
    return {
      id: crypto.randomUUID(),
      url: result.imageURL,
      aspect: aspect,
      seed: result.seed,
      cost: result.cost,
      meta: {
        model: variant.model,
        steps: DEFAULTS.steps,
        cfg: DEFAULTS.cfg,
        width: (ASPECT_SPECS[aspect] as { w: number; h: number }).w,
        height: (ASPECT_SPECS[aspect] as { w: number; h: number }).h,
        positivePrompt: variant.prompt
      },
      basePromptId: variant.id,
      style: variant.style
    };
  });
}

export function shapeSingle(runwareResult: any, baseData: any) {
  const aspect = baseData.aspect as AspectType;
  return {
    id: crypto.randomUUID(),
    url: runwareResult.imageURL,
    aspect: aspect,
    seed: runwareResult.seed,
    cost: runwareResult.cost,
    meta: {
      model: baseData.model,
      steps: DEFAULTS.steps,
      cfg: DEFAULTS.cfg,
      width: (ASPECT_SPECS[aspect] as { w: number; h: number }).w,
      height: (ASPECT_SPECS[aspect] as { w: number; h: number }).h,
      positivePrompt: baseData.prompt
    }
  };
}

export async function getBasePromptEphemeral(basePromptId: string) {
  const baseData = basePromptStorage.get(basePromptId);
  if (!baseData) {
    throw new Error(`Base prompt not found: ${basePromptId}`);
  }
  return baseData;
}

export function applyTweak(baseData: any, tweakText: string) {
  let modifiedPrompt = baseData.basePrompt;
  
  if (tweakText.trim()) {
    // Professional B2B keyword mapping
    const keywords = tweakText.toLowerCase();
    
    if (keywords.includes('corporate colors')) {
      modifiedPrompt += ' Corporate blue and white color scheme, professional branding.';
    }
    if (keywords.includes('professional lighting')) {
      modifiedPrompt += ' Professional studio lighting, clean and bright.';
    }
    if (keywords.includes('clean background')) {
      modifiedPrompt += ' Clean, uncluttered background, minimal distractions.';
    }
    if (keywords.includes('business setting')) {
      modifiedPrompt += ' Professional business environment, corporate setting.';
    }
    if (keywords.includes('modern office')) {
      modifiedPrompt += ' Modern office space, contemporary business interior.';
    }
    if (keywords.includes('executive style')) {
      modifiedPrompt += ' Executive-level professional appearance, high-end business aesthetic.';
    }
    if (keywords.includes('minimalist')) {
      modifiedPrompt += ' Minimalist clean design, lots of white space, simple composition.';
    }
    if (keywords.includes('brand colors')) {
      modifiedPrompt += ' Emphasize brand colors and corporate identity.';
    }
    
    // Add any remaining freeform text
    modifiedPrompt += ` ${tweakText}`;
  }
  
  return modifiedPrompt;
}

export const curatedModels = [
  { id: "runware:101@1", name: "Realistic", description: "High quality realistic images" },
  { id: "runware:100@1", name: "Artistic", description: "More artistic and stylized" }
];
