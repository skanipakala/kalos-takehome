import { z } from "zod";

export const AdInput = z.object({
  companyUrl: z.string().url(),
  productName: z.string().optional().default(""),
  businessValue: z.string().min(3),
  audience: z.string().min(3), // comma-separated
  bodyText: z.string().min(3),
  footerText: z.string().min(2),
  renderCtaOnImage: z.boolean().optional().default(false)
});

export const Aspect = z.enum(["HORIZONTAL_191_1", "SQUARE_1_1", "VERTICAL_4_5"]);

export const TweakInput = z.object({
  imageId: z.string(),
  basePromptId: z.string(),
  aspect: Aspect,
  tweakText: z.string().optional().default("")
});

export type GeneratedImage = {
  id: string;
  url: string;
  aspect: z.infer<typeof Aspect>;
  seed?: number;
  cost?: number;
  meta: {
    model: string;
    steps: number;
    cfg: number;
    width: number;
    height: number;
    positivePrompt: string;
  };
};

export type AdInputType = z.infer<typeof AdInput>;
export type TweakInputType = z.infer<typeof TweakInput>;
export type AspectType = z.infer<typeof Aspect>;
