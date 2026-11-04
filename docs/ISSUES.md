# Choreograph AI — Technical Audit & Issue Register

**Audit date:** October–November 2026  
**Scope:** Frontend (`/client`), Backend services (`/server/gateway`, `/server/services/*`), and Cross-cutting architecture  
**Product:** Autonomous AI agent orchestration workbench (Coding, Search, PPT, PDF, Image, Auto agents)

---

## Overview & Status

| Scope | Category | Open | Resolved / In Progress | Priority |
| :--- | :--- | :---: | :---: | :---: |
| Frontend | [Frontend Code Bugs](#a-frontend-code-bugs) | 8 | 0 | P0 |
| Frontend | [AI-Generated Design Tells](#b-frontend-design-tells) | 4 | 1 (Rebranding complete) | P1 |
| Frontend | [Component UX & Ergonomics](#c-frontend-ux-deficiencies) | 20 | 1 (C5.2 resolved) | P1–P2 |
| Backend | [Agent & Generation Services](#d-backend-agent--generation-services) | 3 | 3 (PPT, PDF, Image S3) | P0–P1 |
| Backend | [Gateway & Routing](#e-backend-gateway--routing) | 2 | 1 (Billing proxy added) | P1 |
| Backend | [Auth & Session Management](#f-backend-auth--session-management) | 3 | 0 (WIP: credit/plan sync) | P0–P1 |
| Backend | [Billing & Payments Service](#g-backend-billing--payments-service) | 4 | 0 (WIP: Razorpay webhook) | P0–P1 |

---

## A. Frontend Code Bugs

### A1. Ternary trapped inside template literal — `ChatInput.jsx:189–194`
```jsx
className={`
  isActive ? "text-white" : "text-slate-500"
`}
```
**Problem:** Missing `${}`. The browser receives literal text as class names, so active agent icon color does not toggle.  
**Fix:** `` className={`${isActive ? "text-white" : "text-slate-500"}`} ``

### A2. Invalid Tailwind arbitrary value — `ChatInput.jsx:181`
```jsx
shadow-[0_1px_8px_rgba(99, 102, 241, .35)]
```
**Problem:** Spaces in arbitrary brackets break Tailwind CSS parser.  
**Fix:** `shadow-[0_1px_8px_rgba(99,102,241,0.35)]`

### A3. Mixed Tailwind v3 and v4 gradient syntax
- v3 `bg-gradient-to-r/br` (`ChatInput.jsx:181`, `MessageBubble.jsx:28`)
- v4 `bg-linear-to-r/br` (`SideBar.jsx:279`, `MessageList.jsx:24`, `NotFound.jsx:42`)  
**Fix:** Standardize and migrate to solid states with cyan focus borders.

### A4. State updates during render — `ChatInput.jsx:36–40`
**Problem:** Direct state updater in component render body causing React lifecycle warnings.  
**Fix:** Wrap inside `useEffect` keyed on `initialPrompt`.

### A5. Direct DOM mutation — `MessageBubble.jsx:39`
```jsx
onError={(e) => e.currentTarget.remove()}
```
**Problem:** Direct DOM removal bypasses React reconciliation.  
**Fix:** Maintain image error status in state and render fallback.

### A6. Title truncation mismatch — `ChatInput.jsx:66–68`
**Problem:** Prompt condition checks `> 20` but slices `(0, 40) + "..."`.  
**Fix:** Standardize truncation threshold (e.g., `prompt.length > 32 ? prompt.slice(0, 32) + "..." : prompt`).

### A7. Loose equality — `MessageBubble.jsx:119`
**Problem:** `copiedCode == value` uses loose equality.  
**Fix:** Replace with strict equality `===`.

### A8. Monolithic syntax highlighter import — `MessageBubble.jsx:6`
**Problem:** Full package import bloats bundle over 1.6MB.  
**Fix:** Switch to `prism-light` and register targeted languages only.

---

## B. Frontend Design Tells

- [x] **B0. Rebrand Consistency:** Replaced legacy AgentForge branding across client metadata, header, sidebar, login, and agent prompts with Choreograph AI.
- [ ] **B1. Heavy Gradients:** Indigo-violet gradients on sidebar, buttons, and bubbles; replace with crisp solid borders and state-driven accents.
- [ ] **B2. Neon Blur Spheres:** Remove `bg-indigo-500/10 blur-2xl` decoration in `NotFound.jsx`.
- [ ] **B3. Uppercase Eyebrow Labels:** Convert all-caps tags to sentence case.
- [ ] **B4. Dark Theme Palette Fragmentation:** Standardize onto Forge Basalt design tokens.
- [ ] **B5. Generic Boilerplate Copy:** Replace tutorial-style placeholders with real engineering agent tasks.

---

## C. Frontend UX Deficiencies

- **C1. Nav Header:** Hardcoded mobile offsets; lacks active agent indicator, connection status, and model badges.
- **C2. Sidebar:** Monolithic implementation (`SideBar.jsx`); needs modular split, chat history search/filter (`Ctrl+K`), and keyboard accessibility.
- **C3. Chat Canvas:** Empty states need engineering prompts; assistant responses need standardized cards and action bars (copy/retry/export).
- **C4. Chat Input:** Agent selector needs responsive horizontal scrolling/dropdown; textarea requires auto-grow; attachment and voice buttons need proper state handlers.
- **C5. Artifacts:** Rename `Articraft.jsx` to `ArtifactPanel.jsx` (Imports clean); ensure dynamically generated artifacts pipe seamlessly into panel.
- **C6. Login & Error Pages:** Revamp login to two-column terminal design; modernize 404 with diagnostic details (`ERR_SESSION_NOT_FOUND`).

---

## D. Backend: Agent & Generation Services

- [x] **D1. Presentation Deck Generation (PPT Agent):** Implemented `pptxgenjs` deck generation (`generate-ppt.js`) supporting cover slides, structured bullet cards, metric layouts, and conclusion summaries.
- [x] **D2. S3 Asset Upload & Dynamic Presigned URLs:** Presigned URL expiry centralized via `URL_EXPIRY`; PDF and PPT agents upload buffers to S3 with correct MIME types and presigned download links.
- [x] **D3. System Prompts & LLM Temperature Alignment:** Prompts updated for Choreograph AI; temperature set for creative formatting and structured JSON responses.
- [ ] **D4. Agent Error Fallback & Resilience:** When LLM fails to return strict JSON in PPT/PDF agents, implement resilient regex parsing or schema repair before failing.
- [ ] **D5. Streaming Agent Feedback:** PPT and PDF generation take 3-8s; provide intermediary status events (generating outline -> rendering -> uploading) over socket/SSE.
- [ ] **D6. Temporary Asset Cleanup / Lifecycle:** Configure S3 lifecycle policy or bucket cleanup job for temporary generated download assets.

---

## E. Backend: Gateway & Routing

- [x] **E1. Service Proxy Routing:** Added proxy route for `/api/v1/billing` in gateway.
- [ ] **E2. Rate Limiting & Throttling:** Gateway needs per-user/IP rate limiting to protect agent LLM generation endpoints from abuse.
- [ ] **E3. Centralized Request Tracing & Correlation IDs:** Attach `x-request-id` header in gateway and forward across auth, chat, billing, and agent microservices.

---

## F. Backend: Auth & Session Management

- [ ] **F1. User Credits & Plan Schema Integration:** User model updated with plan tier (`free`, `starter`, `pro`), credit balance, and validity; controller and repo methods for payment update need completion and test verification.
- [ ] **F2. Inter-Service Auth Token Verification:** Secure communication between Gateway, Billing service, and Auth service for balance updates.
- [ ] **F3. Session Expiration & Invalidation:** Verify session cleanup across Redis and token invalidation on password/session reset.

---

## G. Backend: Billing & Payments Service

- [ ] **G1. Incomplete Razorpay Integration:** `services/billing` contains initial Razorpay configuration, payment models, and routes that need end-to-end webhook verification.
- [ ] **G2. Webhook Signature Verification:** Ensure Razorpay payment capture webhooks are cryptographically validated before incrementing user plan credits.
- [ ] **G3. Idempotent Payment Processing:** Guarantee duplicate webhook deliveries do not credit user accounts multiple times.
- [ ] **G4. Service Resilience & Fallback:** Handle failures when auth service is unreachable during post-payment credit provisioning.

---

## Appendix: Forge Basalt Tokens

| Token | Value | Use |
| :--- | :--- | :--- |
| `--surface-canvas` | `#090B0E` | Root background |
| `--surface-panel` | `#0E1217` | Sidebar, header, input dock |
| `--surface-card` | `#151921` | Assistant cards, modals, chips |
| `--surface-active` | `#1E2430` | Selected row, active agent, code header |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Dividers, card borders |
| `--border-active` | `rgba(56,189,248,0.30)` | Focus and selected states |
| `--accent-cyan` | `#38BDF8` | Primary highlight, links, focus ring |
| `--accent-amber` | `#F59E0B` | Credits, compute, warnings |
| `--text-primary` | `#F8FAFC` | Headings, core text |
| `--text-secondary` | `#94A3B8` | Subheads, meta |
| `--text-muted` | `#64748B` | Timestamps, hints |


Semantic status colors: success `#10B981`, error `#F43F5E`.
**Type:** Inter (UI, with `tnum`) and JetBrains Mono (code, token counts, IDs). Scale: 11 / 12 / 13 / 14 / 16 / 20 px.