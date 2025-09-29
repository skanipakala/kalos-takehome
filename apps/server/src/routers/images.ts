import { router, publicProcedure } from "@repo/trpc";
import { AdInput, TweakInput } from "@repo/trpc/schema";
import { 
  buildFiveVariantPrompts, 
  buildRunwareTask, 
  runRunwareTasks, 
  shapeBatchResponse, 
  shapeSingle,
  getBasePromptEphemeral,
  applyTweak,
  curatedModels,
  ASPECT_SPECS
} from "../services/runware";

export const imagesRouter = router({
  generateBatch: publicProcedure
    .input(AdInput)
    .mutation(async ({ input }) => {
      try {
        const variants = buildFiveVariantPrompts(input);
        const tasks = variants.map(v => buildRunwareTask(v.prompt, v.aspect, v.model));
        const res = await runRunwareTasks(tasks);
        return shapeBatchResponse(res, variants);
      } catch (error) {
        console.error('Error generating batch images:', error);
        throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  regenerate: publicProcedure
    .input(TweakInput)
    .mutation(async ({ input }) => {
      try {
        const base = await getBasePromptEphemeral(input.basePromptId);
        const prompt = applyTweak(base, input.tweakText);
        const task = buildRunwareTask(prompt, input.aspect, base.model);
        const res = await runRunwareTasks([task]);
        
        const baseData = {
          aspect: input.aspect,
          model: base.model,
          prompt: prompt
        };
        
        return shapeSingle(res[0], baseData);
      } catch (error) {
        console.error('Error regenerating image:', error);
        throw new Error(`Failed to regenerate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  models: publicProcedure.query(() => curatedModels)
});
