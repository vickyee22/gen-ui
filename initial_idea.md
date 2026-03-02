# Project Overview: Unified Generative UI (GenUI) Architecture POC

## 1. Executive Summary
This Proof of Concept (POC) demonstrates a "Level 3" Generative UI architecture designed for an enterprise telecommunications environment. The goal is to evolve beyond standard text-based conversational agents (like early-stage AISA models) into a **Unified UI Orchestrator**. 

The system will dynamically generate and render context-aware React components (e.g., comparison tables, dynamic bundle builders) across Web, App, and Chat interfaces based on user intent.

## 2. Core Architectural Philosophy
* **Intent-Driven Orchestration, NOT Code Generation:** The LLM will *never* write raw HTML or CSS. Instead, it will output strictly typed JSON (via tool/function calling) that tells the frontend which pre-built component from our Design System to render, and with what data.
* **Decoupled Frontend:** Simulating high-speed, decoupled APIs to achieve sub-200ms latency for component hydration.
* **Token Efficiency:** Implement hybrid routing. Simple queries return static UI; complex bundling queries trigger the LLM to construct a bespoke view.
* **Design System Theme:** The primary UI components should utilize a sleek, modern aesthetic with **Black** as the primary accent color.

## 3. Technology Stack Requirements
* **Framework:** Next.js (App Router) with React Server Components.
* **AI Integration:** Vercel AI SDK (specifically leveraging `streamUI` or `streamObject` for React component streaming).
* **Styling:** Tailwind CSS + shadcn/ui (for fast, accessible base components).
* **Validation:** Zod for strict LLM output schemas.
* **Mock Backend:** Simulate decoupled microservices for retrieving plan catalog data and billing data.

## 4. Core Use Cases to Implement

### Use Case 1: The Context-Aware Comparison Table (Sales/Acquisition)
* **Trigger:** User asks, "I need a plan for my wife and me, we travel to Malaysia often and stream video."
* **LLM Action:** Classifies intent as `compare_plans`. Extracts parameters: `[family, roaming_my, high_data]`.
* **UI Output:** Renders a `<PlanComparisonCard>` component. 
* **Rules:** The table must *hide* irrelevant rows (like standard SMS rates) and prioritize/highlight "Data Roaming" and "Entertainment" add-ons.

### Use Case 2: Dynamic "Build-Your-Bundle" Widget (Cross-sell)
* **Trigger:** User asks, "I want the fastest fiber for gaming and a new mobile line."
* **LLM Action:** Classifies intent as `build_bundle`. Extracts: `[10gbps_fiber, gaming_optimized, mobile_line]`.
* **UI Output:** Renders a `<BundleBuilderWidget>`.
* **Rules:** Pre-selects a 10Gbps slider, highlights gaming routing add-ons, and attaches a mobile line toggle. Excludes TV packages to reduce cognitive load.

### Use Case 3: Visual Bill Diagnostics (Retention/Support)
* **Trigger:** User asks, "Why is my bill $15 higher this month?"
* **LLM Action:** Classifies intent as `bill_inquiry`. Queries mock billing API.
* **UI Output:** Renders a `<WaterfallChartCard>`.
* **Rules:** Visually breaks down the base plan vs. the specific anomaly (e.g., a $15 red block for "International Calling"). Includes a "Dispute Charge" button.

## 5. Data Contracts & Zod Schemas
The LLM must adhere to these schemas when calling the UI rendering tools.

```typescript
import { z } from 'zod';

// Schema for Use Case 1: Comparison Table
export const comparisonTableSchema = z.object({
  plans: z.array(z.object({
    id: z.string(),
    name: z.string(),
    monthlyPrice: z.number(),
    highlightedFeatures: z.array(z.string()), // e.g., ["10GB Malaysia Roaming"]
  })).max(3),
  hiddenMetrics: z.array(z.string()), // e.g., ["sms", "caller_id"] to declutter UI
});

// Schema for Use Case 2: Bundle Builder
export const bundleBuilderSchema = z.object({
  fiberTier: z.enum(["1Gbps", "2Gbps", "10Gbps"]),
  includeGamingAddon: z.boolean(),
  mobileLinesCount: z.number().min(0).max(4),
  suggestedAddons: z.array(z.string()),
});