import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  model: openai("gpt-5.5"),
  compaction: {
    thresholdPercent: 0.85,
  },
});
