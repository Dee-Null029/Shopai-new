---
name: project-ppt
description: 'Create PowerPoint, PPT, presentation, slide deck, demo deck, IEEE presentation, viva, seminar, or project review content for ShopAI. Use when the user wants slides, speaker notes, a presentation outline, demo flow, or visuals for this project.'
argument-hint: 'audience, purpose, slide count, duration, tone'
user-invocable: true
---

# ShopAI Presentation Builder

## When to Use
- Build a PowerPoint or slide deck for ShopAI.
- Generate a seminar, IEEE, viva, capstone, investor, or demo presentation.
- Prepare speaker notes, slide text, visual suggestions, or a live demo flow.
- Tailor the deck for technical, academic, or product-focused audiences.

## Inputs to Confirm
1. Audience: faculty, judges, investors, engineers, or general audience.
2. Goal: overview, demo, architecture review, academic defense, or pitch.
3. Length: target slide count and speaking time.
4. Tone: formal academic, technical, concise product, or polished pitch.

If the user does not specify them, assume:
- Audience: academic/technical reviewers
- Goal: project overview plus architecture and demo
- Length: 10 to 12 slides
- Tone: concise and formal

## Procedure
1. Read the ShopAI facts in [presentation facts](./references/shopai-presentation-facts.md).
2. Read the structure in [slide outline template](./assets/slide-outline-template.md).
3. If the user asks for architecture or IEEE-style visuals, pull the relevant diagrams from [IEEE diagrams](./references/ieee-diagram-guide.md).
4. Build a deck that moves from problem to solution to architecture to core features to demo to roadmap.
5. Keep claims grounded in repository facts. Do not invent metrics, production usage, or benchmark numbers.
6. If performance, adoption, or evaluation metrics are missing, label them as proposed metrics or placeholders.

## Output Requirements
- Provide a slide-by-slide outline with titles and 3 to 5 concise bullets per slide.
- Include presenter notes when the user asks for speaking support or when the deck is for a viva, seminar, or review.
- Recommend visuals per slide: product screenshots, architecture diagrams, ranking flow, try-on flow, or chat flow.
- Call out the strongest differentiators: multi-platform aggregation, AI sentiment analysis, smart ranking, 3D try-on, and fashion chat.
- Include a realistic closing slide with current status, gaps, and next steps when the audience is technical or academic.

## Slide Construction Rules
- Lead with the user problem before listing technologies.
- Keep each slide focused on one idea.
- Prefer short bullets over paragraphs.
- Mention fallback behavior and security measures when discussing reliability.
- For academic decks, explicitly include methodology, architecture, and limitations.
- For demo decks, include a step-by-step live flow and failure fallback.

## Project-Specific Guidance
- ShopAI is a full-stack AI-powered e-commerce aggregator across Amazon, Flipkart, and Myntra.
- The most defensible technical material comes from the search pipeline, ranking engine, sentiment analysis, try-on pipeline, and chat workflow.
- Current incomplete areas should be framed as roadmap items, not completed features.

## Deliverable Variants
- Short deck: 5 to 7 slides for quick review or pitch.
- Standard deck: 10 to 12 slides for seminar, viva, or demo.
- Deep technical deck: 12 to 15 slides with architecture, algorithms, security, and roadmap.

## References
- [Presentation facts](./references/shopai-presentation-facts.md)
- [IEEE diagram guide](./references/ieee-diagram-guide.md)
- [Slide outline template](./assets/slide-outline-template.md)