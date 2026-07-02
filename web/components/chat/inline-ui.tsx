"use client";

import * as React from "react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { registry } from "@/lib/render/registry";
import { cn } from "@/lib/utils";

export interface InlineUiSpecProps {
  spec: Spec;
  state?: Record<string, unknown>;
  className?: string;
}

/**
 * Renders a `present_ui` json-render spec inline inside a chat bubble.
 */
export function InlineUiSpec({ spec, state = {}, className }: InlineUiSpecProps) {
  return (
    <div className={cn("my-2 w-full min-w-0", className)}>
      <JSONUIProvider registry={registry} initialState={state}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
    </div>
  );
}
