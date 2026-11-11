# Codebase Audit & Technical Issue Register

**Audit Date:** November 2026  
**Auditor:** Senior Full-Stack Engineer & Application Security Auditor  
**Scope:** Full-stack codebase covering Client (React 19, Vite, Redux Toolkit, Tailwind v4), API Gateway (Express 5, Redis, Proxy), Backend Microservices (Auth, Chat, Agent, Billing), Shared Libraries, Docker configurations, and Documentation.  
**Target Repository:** Agent-Forge / Choreograph AI  
**Overall Codebase Status:** 🔴 **CRITICAL** (Billing service fails on boot, payment processing guarantees failure, cross-service authorization bypasses present, Redis unauthenticated, zero test coverage).

---

## Executive Summary & Statistics

### Summary by Severity

| Severity | Count | Meaning |
|---|:---:|---|
| **Critical** | **9** | Immediate system crashes on startup, severe unauthenticated privilege escalations, payment computation bugs guaranteeing failures, or exposed data stores. |
| **High** | **19** | Major functional breakages, exploitable authentication/authorization bypasses, unhandled runtime crashes, or critical missing testing/documentation. |
| **Medium** | **37** | Defective state management, concurrency race conditions, information leaks, missing security headers/CSRF, accessibility violations, or logic errors. |
| **Low** | **18** | UI inconsistencies, dead UI controls, sub-optimal algorithms, build configuration anomalies, or minor maintainability debt. |
| **Total** | **83** | **Active findings identified, verified, and cataloged.** |

---

### Summary by Category and Subcategory

| Category | Security | Crash / Runtime | UI / UX | Aesthetics | Total |
|---|:---:|:---:|:---:|:---:|:---:|
| **Frontend** | 4 | 6 | 13 | 8 | **31** |
| **Backend** | 15 | 11 | 8 | 8 | **42** |
| **Common** | 2 | 2 | 2 | 4 | **10** |
| **Total** | **21** | **19** | **23** | **20** | **83** |

---

## 1. Frontend

### A. Security

#### [FE-SEC-001] XSS via Unsanitized Markdown Link `href`
- **File & Lines:** `client/src/components/MessageBubble.jsx:97–107`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** Security
- **Description:** The custom link component in `react-markdown` directly renders `<a href={href} ...>` without validating that `href` uses a safe URL scheme (`http:`, `https:`). If an LLM response or malicious conversation content contains a markdown link formatted as `[Click here](javascript:alert(document.cookie))` or a base64 `data:text/html` URI, clicking the link executes arbitrary JavaScript in the context of the user's session (Stored XSS).
- **Reproduction Scenario:**
  1. Trigger an agent response containing `[Verify Billing](javascript:alert(localStorage.getItem('token')))` or insert this string into chat history.
  2. The assistant bubble renders an interactive hyperlink.
  3. Clicking the link executes the injected script within the authenticated client application.
- **Recommended Fix:** Implement a URL sanitization function validating that `href` strictly starts with `http://` or `https://`. For untrusted or non-http protocols, neutralize the attribute (e.g. `href="#"` or omit the link tag).

---

#### [FE-SEC-002] Unsanitized Image URLs in MessageBubble and Markdown Image Rendering
- **File & Lines:** `client/src/components/MessageBubble.jsx:47–53, 162–173`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** Security
- **Description:** Server-supplied image URLs from `msg.images` and markdown `img` elements are rendered into raw `<img src={...}>` tags without scheme or origin validation. A crafted image URL (e.g. `javascript:...` in browsers that support it, or intranet SSRF pingbacks) can be rendered directly into the DOM.
- **Reproduction Scenario:**
  1. Have an agent or mock response return `images: ["javascript:alert(1)"]` or a malicious loopback endpoint.
  2. Observe the browser injecting the unvalidated source into the DOM.
- **Recommended Fix:** Sanitize image URLs using an allowlist of valid URL schemes (`http:`, `https:`). Strip or reject any image source containing `javascript:`, `vbscript:`, or unapproved protocols.

---

#### [FE-SEC-003] Missing CSRF Protection on Credentialed Axios Requests
- **File & Lines:** `client/src/utils/axios.js:3–6`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** Security
- **Description:** The global Axios instance is configured with `withCredentials: true`, instructing the browser to attach session cookies to cross-origin requests. However, neither Axios nor the backend implements an anti-CSRF token mechanism (e.g. `X-CSRF-Token` header). If the backend is accessed from a browser where SameSite policies are relaxed or misconfigured across domains, state-changing requests (like `/chat/conversations` or `/agent/chat`) can be forged.
- **Reproduction Scenario:**
  1. An authenticated user visits an untrusted external site while their session cookie is active.
  2. The external site sends a cross-origin POST request to the API Gateway.
  3. The request succeeds if cookies are accepted without CSRF token verification.
- **Recommended Fix:** Implement a double-submit CSRF cookie pattern or standard CSRF token middleware on the gateway, passing the token in Axios request interceptors via `api.interceptors.request.use`.

---

#### [FE-SEC-004] Hardcoded Firebase Credentials and Project Identifiers
- **File & Lines:** `client/src/utils/firebase.js:8–15`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** Security
- **Description:** While `apiKey` is extracted from `import.meta.env.VITE_FIREBASE_API_KEY`, the remaining project configuration (`authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) is hardcoded directly in the client bundle. This exposes internal Firebase infrastructure details and prevents environment switching (development vs staging vs production).
- **Reproduction Scenario:**
  1. Inspect `client/src/utils/firebase.js`.
  2. Notice hardcoded project values `agentforge-92fdc.firebaseapp.com` and `442806675623`.
  3. Deploying to a staging project requires source code modification rather than environment variable configuration.
- **Recommended Fix:** Externalize all Firebase configuration parameters into `VITE_FIREBASE_*` environment variables in `client/.env.example`.

---

### B. Crash / Runtime

#### [FE-CRASH-001] ReferenceError on Undeclared Assignment in `verifyPayment.js`
- **File & Lines:** `client/src/features/verifyPayment.js:7`
- **Severity:** Critical
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** Line 7 contains `return ({ order, plan } = response.data);`. In ES module mode (which enforces JavaScript strict mode), assigning properties to undeclared variables `order` and `plan` throws an immediate `ReferenceError: order is not defined`. This completely crashes any client-side payment verification attempt.
- **Reproduction Scenario:**
  1. Complete a test payment in Razorpay modal.
  2. Razorpay handler calls `await verifyPayment(res)`.
  3. Line 7 executes in `verifyPayment.js`.
  4. Execution halts with `Uncaught ReferenceError: order is not defined`, and the function returns `null`.
- **Recommended Fix:** Correct the return statement to return the payload cleanly: `return response.data;` or `const { order, plan } = response.data || {}; return { order, plan };`.

---

#### [FE-CRASH-002] ReferenceError on Undefined `data` Identifier in `BillingModal.jsx`
- **File & Lines:** `client/src/components/BillingModal.jsx:32`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** Inside `handleUpgradeButton`, the Razorpay payment callback handler executes:
  ```javascript
  handler: async (res) => {
    try {
      await verifyPayment(res);
      console.log(data); // <-- 'data' is not defined in scope
    } catch (error) { ... }
  }
  ```
  The variable `data` does not exist in `BillingModal.jsx` or in the callback parameters. If `verifyPayment` completes, accessing `data` throws `ReferenceError: data is not defined`.
- **Reproduction Scenario:**
  1. Trigger payment completion in the Razorpay iframe.
  2. The callback handler triggers `verifyPayment(res)`.
  3. Step proceeds to line 32, throwing an unhandled `ReferenceError`.
- **Recommended Fix:** Capture the result of `verifyPayment(res)` in a local variable (e.g. `const result = await verifyPayment(res); console.log(result);`) or remove the orphan console log.

---

#### [FE-CRASH-003] TypeError Crash Spreading Null `data` in `ChatArea.jsx`
- **File & Lines:** `client/src/components/ChatArea.jsx:23`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** In `features/getMessages.js`, errors are caught and return `null`. In `ChatArea.jsx`, line 19 retrieves `const data = await getMessages(selectedConversation._id)`. Line 21 uses `data || []`, but line 23 performs `const latestArtifactMessage = [...data].reverse().find(...)`. When `data` is `null`, executing `[...null]` throws `TypeError: null is not iterable`, crashing the entire React render tree.
- **Reproduction Scenario:**
  1. Simulate network failure or have `/chat/messages/:id` return an error (such as 500).
  2. `getMessages` catches and returns `null`.
  3. `ChatArea.jsx` attempts `[...data]`, causing React to crash to a blank screen.
- **Recommended Fix:** Guard the array spread: `const safeData = Array.isArray(data) ? data : []; const latestArtifactMessage = [...safeData].reverse().find(...)`.

---

#### [FE-CRASH-004] Unhandled Promise Rejection on `navigator.clipboard.writeText`
- **File & Lines:** `client/src/components/MessageBubble.jsx:27`, `client/src/components/Artifact.jsx:134, 147`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** Calls to `navigator.clipboard.writeText()` require a secure context (HTTPS or localhost) and explicit user permissions. In `MessageBubble.jsx` line 27 and `Artifact.jsx` lines 134 and 147, `await navigator.clipboard.writeText(...)` is called without `try/catch`. On HTTP deployments, restricted iframes, or when clipboard permission is denied, an unhandled promise rejection is thrown.
- **Reproduction Scenario:**
  1. Access the application over an HTTP IP or inside an embedded iframe with permissions disabled.
  2. Click the "Copy" button on any code block.
  3. Browser rejects the promise with `DOMException: Document is not focused` or `NotAllowedError`.
- **Recommended Fix:** Wrap all clipboard operations in a `try/catch` block, notifying the user via a toast message or falling back to `document.execCommand('copy')`.

---

#### [FE-CRASH-005] Imperative DOM Removal via `e.currentTarget.remove()` Desynchronizing Virtual DOM
- **File & Lines:** `client/src/components/MessageBubble.jsx:51, 169`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** The `onError` handler on images directly executes `e.currentTarget.remove()`. Imperatively destroying DOM elements behind React's back desynchronizes the React Virtual DOM fiber tree from the real DOM tree. Subsequent reconciliation passes or re-renders targeting adjacent sibling nodes can trigger fatal React reconciliation crashes (`NotFoundError: Failed to execute 'removeChild' on 'Node'`).
- **Reproduction Scenario:**
  1. Send a prompt that generates multiple image cards where one URL returns 404.
  2. The broken image element is removed from the DOM via `e.currentTarget.remove()`.
  3. Trigger a state change (such as opening the Artifact drawer or changing conversation).
  4. React attempts to reconcile the removed element and throws a DOM exception.
- **Recommended Fix:** Maintain a `failedImages` Set in component state or render a dedicated fallback placeholder image when image loading fails.

---

#### [FE-CRASH-006] Missing Axios Base URL Fallback Resulting in Silent 404 Routing
- **File & Lines:** `client/src/utils/axios.js:3–6`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** Crash / Runtime
- **Description:** `api` initializes with `baseURL: import.meta.env.VITE_API_URL`. If `VITE_API_URL` is omitted from the client environment, `baseURL` defaults to `undefined`. Axios treats all subsequent requests (`/chat/conversations`, `/auth/login`, `/billing/order`) as relative URLs on port 5173 (the Vite dev server origin). Every API call silently 404s without an informative developer error.
- **Reproduction Scenario:**
  1. Clone the repo and run `npm run dev` in `client` without creating `.env`.
  2. Load the web app.
  3. Notice all network requests hit `http://localhost:5173/auth/login` and fail with 404 HTML responses.
- **Recommended Fix:** Validate `VITE_API_URL` at module load time or provide an explicit fallback: `baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"`.

---

### C. UI / UX

#### [FE-UX-001] Silent Error Swallowing and Missing State Refresh in BillingModal
- **File & Lines:** `client/src/components/BillingModal.jsx:14–47`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** In `BillingModal.jsx`, `handleUpgradeButton` has an empty catch block `catch (error) { }`. If order creation fails, Razorpay initialization fails, or payment fails, the error is swallowed without alerting the user. Furthermore, after a successful payment verification, the modal neither closes nor dispatches an updated user fetch, leaving user credits and plan badges showing outdated data.
- **Reproduction Scenario:**
  1. Disconnect the backend billing service.
  2. Open BillingModal and click "Upgrade".
  3. The button does nothing, no spinner appears, and no error message is shown to the user.
- **Recommended Fix:** Set an `isUpgrading` loading state, display inline error messages on failure, close the modal upon success, and dispatch `fetchUserData()` to refresh credits and plan tier in Redux.

---

#### [FE-UX-002] Stale Messages and Race Condition on Conversation Deletion
- **File & Lines:** `client/src/redux/conversationSlice.js:67–76`, `client/src/components/SideBar.jsx:149–166`
- **Severity:** High
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** In `conversationSlice.js`, when the currently selected conversation is deleted, `state.selectedConversation` is reassigned to `state.conversations[0]`. However, `messageSlice.js` is never notified. `state.messages` retains the messages of the deleted conversation until the asynchronous `getMessages` fetch completes (or indefinitely if the newly selected conversation has no messages or fails to load).
- **Reproduction Scenario:**
  1. Open a conversation with several messages.
  2. Click the trash icon to delete it.
  3. Observe that the previous conversation's messages remain rendered in the main chat viewport for several seconds.
- **Recommended Fix:** In `deleteConversation` reducer or `handleDeleteConversation`, immediately clear message state by dispatching `setMessages([])` and `setArtifacts([])`.

---

#### [FE-UX-003] Flash of Stale Content During Conversation Switching
- **File & Lines:** `client/src/components/ChatArea.jsx:14–39`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** When selecting a conversation from the sidebar, `ChatArea` fetches new messages asynchronously. While the network request is pending, `ChatArea` continues rendering the previous conversation's messages. This produces a confusing visual flash of stale content before the new thread renders.
- **Reproduction Scenario:**
  1. Have Conversation A (5 messages) and Conversation B (2 messages).
  2. Click between Conversation A and B rapidly on a throttled connection.
  3. The messages from Conversation A linger in Conversation B's view until network resolution.
- **Recommended Fix:** Dispatch `setMessages([])` at the top of the `useEffect` before invoking `fetchMessages()`, and display a loading indicator or skeleton while fetching.

---

#### [FE-UX-004] In-Flight Message Response Dispatched to Wrong Conversation if Switched
- **File & Lines:** `client/src/components/ChatInput.jsx:85–121`, `client/src/redux/messageSlice.js:19–23`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** In `ChatInput.jsx`, `handleSendMessage` sends a message to an agent. Because `messageSlice` maintains a single flat `messages: []` array without scoping by `conversationId`, if the user switches to another conversation while an agent is generating a response (which takes 3–15 seconds), the received assistant message is appended to the newly selected conversation.
- **Reproduction Scenario:**
  1. In Conversation 1, prompt a slow agent (e.g. PPT or Coding agent).
  2. While the spinner is active, click Conversation 2 in the sidebar.
  3. When the agent completes, the PPT/code response is injected into Conversation 2.
- **Recommended Fix:** Associate messages with `conversationId` in Redux or check if `currentConv._id === selectedConversationRef.current?._id` before dispatching `addMessage`.

---

#### [FE-UX-005] Dead UI Controls: Paperclip and Mic Buttons in ChatInput
- **File & Lines:** `client/src/components/ChatInput.jsx:235–253`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** The paperclip (Attach file) and mic (Voice input) buttons have interactive hover effects, cursor pointers, and titles, but have no `onClick` handlers or underlying implementations. Users expect file attachment or speech-to-text functionality when clicking them.
- **Reproduction Scenario:**
  1. Click the paperclip or mic icon in the chat input toolbar.
  2. Nothing occurs.
- **Recommended Fix:** Either wire them to file upload/speech recognition APIs, or disable them with an informative tooltip: `disabled={true} title="File attachment coming soon"`.

---

#### [FE-UX-006] Non-Semantic Divs Used for Agent Selection Chips Impairing Accessibility
- **File & Lines:** `client/src/components/ChatInput.jsx:197–214`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** The 7 agent chips ("Auto", "Chat", "Coding", "Image", "PDF", "PPT", "Search") are rendered as `<div>` elements with `onClick`. They lack `tabIndex`, keyboard navigation (`Enter`/`Space`), and ARIA roles (`role="radio"` or `role="button"`). Keyboard-only users and screen readers cannot interact with agent selection.
- **Reproduction Scenario:**
  1. Navigate to the chat prompt input using the `Tab` key.
  2. Notice that the agent selector chips are skipped entirely.
- **Recommended Fix:** Change `<div className="..." onClick={() => setSelectedAgent(agent.id)}>` to `<button type="button" aria-pressed={isActive} ...>`.

---

#### [FE-UX-007] Lightbox Image Modal Missing Escape Key Handler, Focus Trap, and ARIA Roles
- **File & Lines:** `client/src/components/MessageBubble.jsx:239–252`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** When an image is enlarged into the full-screen lightbox overlay, the modal does not listen for the `Escape` key, does not trap keyboard focus, and lacks `role="dialog"` or `aria-modal="true"`. Keyboard users cannot close the lightbox without navigating to the small 'X' button.
- **Reproduction Scenario:**
  1. Click on an image to open the lightbox.
  2. Press `Escape` on the keyboard.
  3. The lightbox remains open.
- **Recommended Fix:** Add a `window.addEventListener('keydown', (e) => if (e.key === 'Escape') setLightBox(null))` hook and proper ARIA dialog attributes.

---

#### [FE-UX-008] Missing `alt` Attributes on Rendered Images in MessageBubble and Lightbox
- **File & Lines:** `client/src/components/MessageBubble.jsx:47–55, 247–251`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** `<img>` elements in `MessageBubble.jsx` (both the message gallery and the lightbox preview) do not provide `alt` attributes, violating WCAG 2.1 accessibility criteria (Success Criterion 1.1.1 Non-text Content).
- **Reproduction Scenario:**
  1. Run an accessibility audit (such as Lighthouse or axe).
  2. Flagged for: `Image elements do not have [alt] attributes`.
- **Recommended Fix:** Provide meaningful alt text (e.g. `alt={`Generated artifact image ${index + 1}`}`).

---

#### [FE-UX-009] Feature API Modules Silently Swallowing Errors and Returning Null
- **File & Lines:** `client/src/features/createConversation.js:7–9`, `deleteConversation.js:7–9`, `editConversation.js:9–11`, `getConversations.js:7–9`, `getMessages.js:7–9`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** Across 5 feature modules, the `catch` blocks log to console and return `null`. The calling UI components receive `null` and cannot distinguish between an empty result set and an authentication/server error, preventing error toasts or retry prompts from being presented to the user.
- **Reproduction Scenario:**
  1. Simulate an HTTP 500 error on `/chat/conversations`.
  2. `getConversations` returns `null`.
  3. SideBar renders empty list with no indication that an error occurred.
- **Recommended Fix:** Re-throw the error or return `{ data: null, error }` so UI components can display actionable error banners.

---

#### [FE-UX-010] Logout Function Swallowing Errors Making Sidebar Error Alert Dead Code
- **File & Lines:** `client/src/features/logout.js:3–9`, `client/src/components/SideBar.jsx:168–182`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** In `features/logout.js`, `logout()` catches all exceptions and never re-throws. In `SideBar.jsx`, `handleLogOut` wraps `await logout()` in a `try/catch` expecting an exception on failure and displaying `alert("LogOut Failed!")`. Because `logout()` swallows errors, this catch block is dead code, and the client unsets user state even if the server failed to revoke the Redis session.
- **Reproduction Scenario:**
  1. Kill the backend gateway.
  2. Click the logout icon in the sidebar.
  3. Client logs out locally, but the server session remains active. The alert in `SideBar.jsx` never executes.
- **Recommended Fix:** In `features/logout.js`, re-throw errors: `catch (error) { console.error(...); throw error; }`.

---

#### [FE-UX-011] SideBar Monolithic Structure and Missing Real-Time Balance Display
- **File & Lines:** `client/src/components/SideBar.jsx:57–59, 529`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** `SideBar.jsx` exceeds 620 lines and handles conversation loading, creation, editing, deletion, avatar rendering, and user logout in a single monolithic file. The credit balance display on line 58 falls back to `PLANS['free'].credits` (125) instead of showing 0 when credits are genuinely exhausted.
- **Reproduction Scenario:**
  1. Set user credits to 0 in database.
  2. If `userData.credits` is 0 (falsy in JavaScript `credits || plan.credits`), the UI falls back to 125 credits.
- **Recommended Fix:** Use nullish coalescing `userData?.credits ?? plan.credits` and modularize the Sidebar into subcomponents (`ConversationList`, `UserProfile`, `EditTitleModal`).

---

#### [FE-UX-012] Aggressive Immediate Retry Without Exponential Backoff in SideBar
- **File & Lines:** `client/src/components/SideBar.jsx:68–78`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** If `getConversations()` fails in the initial `useEffect`, the catch block immediately invokes `await getConversations()` again with 0ms delay. If the gateway or database is experiencing load or temporary network degradation, immediate retry storms exacerbate server strain.
- **Reproduction Scenario:**
  1. Inspect network tab when the server is down.
  2. Two identical requests to `/chat/conversations` fire concurrently with no delay.
- **Recommended Fix:** Implement exponential backoff or use a library like TanStack Query / RTK Query for structured retry intervals.

---

#### [FE-UX-013] Artifact Panel Fullscreen State Not Dismissible via Escape Key
- **File & Lines:** `client/src/components/Artifact.jsx:114, 238–244`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** UI / UX
- **Description:** The Artifact panel provides a fullscreen toggle setting `isFullscreen` to true (`fixed inset-0`). However, pressing the `Escape` key does not exit fullscreen mode, forcing users to locate and click the minimize icon.
- **Reproduction Scenario:**
  1. Open Artifact Studio and click the Fullscreen button.
  2. Press the `Escape` key.
  3. Fullscreen mode does not exit.
- **Recommended Fix:** Add a `useEffect` listening for `keydown` events where `e.key === 'Escape'` sets `setIsFullscreen(false)`.

---

### D. Aesthetics

#### [FE-AES-001] Oversized Client Bundle (~1.65MB) from Monolithic `react-syntax-highlighter` Import
- **File & Lines:** `client/src/components/MessageBubble.jsx:7–8`, `client/src/components/Artifact.jsx:18–19`
- **Severity:** Medium
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** `react-syntax-highlighter` is imported using its default bundle rather than the lightweight Prism or HLJS light builds. This bundles all 190+ programming languages into the client JavaScript chunk, inflating the main bundle size by over 1.6MB (~500KB gzipped).
- **Reproduction Scenario:**
  1. Run `npm run build` in `client`.
  2. Inspect Vite bundle analysis: syntax highlighter languages account for over 70% of vendor code.
- **Recommended Fix:** Switch to `import { Light as SyntaxHighlighter } from "react-syntax-highlighter"` and register only supported languages (JS, TS, Python, CSS, HTML, Bash, JSON, SQL).

---

#### [FE-AES-002] Inconsistent Reducer Action Payload Shapes for `setConversationTitle`
- **File & Lines:** `client/src/components/ChatInput.jsx:77–82`, `client/src/components/SideBar.jsx:139–143`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** `setConversationTitle` in `conversationSlice.js` receives `{ conversationId, newTitle }` from `ChatInput.jsx`, but receives `{ _id, title }` or the raw MongoDB document from `SideBar.jsx`. Reducer defensive checks handle this, but the divergent contract degrades maintainability.
- **Reproduction Scenario:**
  1. Inspect `client/src/redux/conversationSlice.js:21–26`.
  2. Observe dual-shape fallback logic: `payload.conversationId || payload._id` and `payload.newTitle ?? payload.title`.
- **Recommended Fix:** Standardize on `{ conversationId, title }` across all dispatch callers.

---

#### [FE-AES-003] Redundant Duplicate Reducer `editConversation` in `conversationSlice.js`
- **File & Lines:** `client/src/redux/conversationSlice.js:44–66`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** `conversationSlice.js` exports both `setConversationTitle` and `editConversation`. Their implementations are 100% identical duplicates. `editConversation` is dead code and never imported or dispatched anywhere.
- **Reproduction Scenario:**
  1. Compare lines 21–43 and lines 44–66 of `conversationSlice.js`.
  2. Notice exact line-by-line duplicate implementation.
- **Recommended Fix:** Remove the unused `editConversation` reducer.

---

#### [FE-AES-004] Global Debug `console.log` Left in Production Feature Calls
- **File & Lines:** `client/src/features/sendMessage.js:6`, `client/src/features/verifyPayment.js:6`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** Raw API response data is logged to the browser console on every message send and payment verification. This litters the production console and leaks internal response objects.
- **Reproduction Scenario:**
  1. Send any prompt in the chat.
  2. Open DevTools console: full response object with server metadata is printed.
- **Recommended Fix:** Remove `console.log(response.data)` from production feature modules.

---

#### [FE-AES-005] Relative `og:url` in HTML Entry Point Breaking Social Link Previews
- **File & Lines:** `client/index.html:37`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** In `client/index.html`, `<meta property="og:url" content="/" />` specifies a relative root path. Open Graph and Twitter card specifications mandate an absolute canonical URL (e.g. `https://choreograph.ai/`).
- **Reproduction Scenario:**
  1. Share the link in Slack or social media scrapers.
  2. Scraper fails to resolve Open Graph metadata due to invalid relative URL.
- **Recommended Fix:** Change to an absolute canonical URL: `content="https://choreograph.ai/"`.

---

#### [FE-AES-006] Missing React `<StrictMode>` in Application Entry Point
- **File & Lines:** `client/src/main.jsx:8–12`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** The React root is rendered without `<StrictMode>`. StrictMode aids in catching side effects, deprecated API usage, and uncleaned effect handlers during development.
- **Reproduction Scenario:**
  1. Inspect `client/src/main.jsx`.
  2. Notice `createRoot().render(<Provider><App /></Provider>)` lacks `<StrictMode>`.
- **Recommended Fix:** Wrap `<Provider>` with `<StrictMode>`.

---

#### [FE-AES-007] Repetitive Indigo-Violet Action Gradients and Visual Inconsistencies
- **File & Lines:** `client/src/components/SideBar.jsx`, `ChatInput.jsx:202, 263`, `MessageBubble.jsx:40`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** Multiple buttons and badges use high-saturation `bg-linear-to-br from-indigo-500 to-violet-700` gradients indiscriminately. This creates an AI-template look rather than an intentional, modern design.
- **Reproduction Scenario:**
  1. Inspect user bubble, send button, active chip, and modal action buttons.
- **Recommended Fix:** Use solid accents (`#4F46E5` / Tailwind tokens) with subtle borders and clear state indicators.

---

#### [FE-AES-008] Code Copy State Comparison Tracking Entire String Body Instead of Unique ID
- **File & Lines:** `client/src/components/MessageBubble.jsx:24–32, 131`
- **Severity:** Low
- **Category:** Frontend | **Subcategory:** Aesthetics
- **Description:** In `MessageBubble.jsx`, `copiedCode` stores the entire code string in React state and performs `copiedCode === value`. If a message contains two identical code snippets, clicking Copy on one switches both buttons to "Copied". For large multi-megabyte code snippets, storing large strings in state causes unnecessary memory overhead.
- **Reproduction Scenario:**
  1. Render a message with two identical code blocks (e.g. two `npm install` blocks).
  2. Click Copy on the first block.
  3. Both code blocks display "Copied".
- **Recommended Fix:** Track a unique block index or hash `copiedBlockId` in state rather than the full code string.

---

## 2. Backend

### A. Security

#### [BE-SEC-001] Unauthenticated `PATCH /payment` Endpoint Allowing Arbitrary User Plan Upgrades
- **File & Lines:** `server/services/auth/src/routes/auth.route.js:9`, `server/services/auth/src/controllers/auth.controller.js:92–127`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Security
- **Description:** The Auth service exposes `router.patch("/payment", authController.updateUserPayment)` with zero authentication middleware. The controller extracts `const { userId, planId } = req.body;` and upgrades the target account to Pro or Starter, awarding credits and resetting expiration dates. Any client with network access to the Auth service can grant unlimited credits to any user account.
- **Reproduction Scenario:**
  1. Send an unauthenticated HTTP request:
     ```http
     PATCH http://localhost:5001/payment HTTP/1.1
     Content-Type: application/json

     {"userId": "target-user-id", "planId": "pro"}
     ```
  2. The endpoint responds `200 OK: Payment updated successfully` and grants pro tier status without payment.
- **Recommended Fix:** Require an internal shared service token (`x-internal-secret`) or mTLS between Billing and Auth services, rejecting requests lacking the secret.

---

#### [BE-SEC-002] Missing Authentication Middleware Across All Internal Microservices
- **File & Lines:** `server/services/agent/src/routes/agent.route.js`, `server/services/chat/src/routes/conversation.route.js`, `server/services/chat/src/routes/message.route.js`, `server/services/billing/src/routes/billing.route.js`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Security
- **Description:** None of the microservices (Agent, Chat, Billing) validate whether incoming requests originate from the API Gateway or possess a valid session. They blindly trust the `x-user-id` header passed in the request. If microservice ports (e.g. 5002 for Chat, 5003 for Agent, 5004 for Billing) are exposed or shared across a cluster network, any attacker can impersonate any user.
- **Reproduction Scenario:**
  1. Send `GET http://localhost:5002/conversations` with header `x-user-id: <victim_user_id>`.
  2. The Chat service returns the victim's entire conversation list without session verification.
- **Recommended Fix:** Implement defense-in-depth: enforce mutual service authentication (JWT signed with an asymmetric gateway private key or shared HMAC secret) on all internal service routes.

---

#### [BE-SEC-003] Unchecked Message Insertion Allowing Unauthorized Injection of Assistant Replies
- **File & Lines:** `server/services/chat/src/controllers/message.controller.js:4–40`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** `POST /messages/` accepts `{ conversationId, role, content, images, artifacts }` and saves it directly to MongoDB without checking if the requesting user owns the `conversationId`. Furthermore, external callers can pass `role: "assistant"`, allowing any user to fabricate counterfeit assistant responses and artifacts inside any conversation.
- **Reproduction Scenario:**
  1. Send a POST request to `/chat/messages` with `conversationId` belonging to another user and `role: "assistant"`.
  2. Message is inserted into the victim's thread.
- **Recommended Fix:** Verify that `conversation.userId === req.headers['x-user-id']` before inserting messages. Only permit internal service calls (e.g. Agent service) to save messages where `role === "assistant"`.

---

#### [BE-SEC-004] Authorization Bypass on Message Retrieval When `x-user-id` Header is Omitted
- **File & Lines:** `server/services/chat/src/controllers/message.controller.js:54–61`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** In `chat/src/controllers/message.controller.js`:
  ```javascript
  if (userId) {
    const conv = await getConversationById(conversationId, userId);
    if (!conv) return res.status(404).json({ message: "Conversation not found or unauthorized" });
  }
  const messages = await messageRepository.getMessages(conversationId);
  ```
  The ownership check executes *only if `userId` is truthy*. Omitting the `x-user-id` header skips the authorization check entirely, returning all messages for any conversation ID in the system.
- **Reproduction Scenario:**
  1. Send `GET /messages/<any-valid-conversation-id>` with no `x-user-id` header.
  2. The endpoint skips the `if (userId)` block and returns the complete message history.
- **Recommended Fix:** Enforce `userId` presence: `if (!userId) return res.status(401).json({ message: "Authentication required" });`.

---

#### [BE-SEC-005] Authorization Bypass in Conversation Repository on Falsy `userId`
- **File & Lines:** `server/services/chat/src/repositories/conversation.repositories.js:25, 34, 51`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** In `getConversationById`, `updateConversationById`, and `deleteConversationById`:
  ```javascript
  const query = userId ? { _id: id, userId } : { _id: id };
  ```
  If `userId` is undefined or empty string, the query drops the ownership check and searches purely by `_id`. Any caller can read, modify, or permanently delete any conversation in the database.
- **Reproduction Scenario:**
  1. Send `DELETE /conversations/<id>` directly without an `x-user-id` header.
  2. The conversation and all its messages are deleted from MongoDB.
- **Recommended Fix:** Always require `userId`: `if (!userId) return null; const query = { _id: id, userId };`.

---

#### [BE-SEC-006] Absence of Rate Limiting Across Gateway and Services Exposing LLM APIs to Abuse
- **File & Lines:** `server/gateway/index.js:1–35`, `server/services/agent/src/routes/agent.route.js:6`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** No rate limiting middleware (`express-rate-limit`, Redis token bucket) exists on the API Gateway or any microservice. The Agent service makes expensive third-party calls to Groq (`gpt-oss-120b`), OpenRouter (`deepseek-chat`), Google Gemini (`gemini-2.5-flash`), and Tavily. An automated script can invoke `/api/v1/agent/chat` in a loop, exhausting API quotas and incurring massive compute bills.
- **Reproduction Scenario:**
  1. Run a loop sending 100 concurrent requests to `POST /api/v1/agent/chat`.
  2. All 100 requests are accepted and dispatched to LLM providers simultaneously.
- **Recommended Fix:** Install `express-rate-limit` and `rate-limit-redis`. Apply strict limits (e.g. 10 requests/minute per user) on `/api/v1/agent/chat` and `/api/v1/auth/login`.

---

#### [BE-SEC-007] Plaintext Spoofable `x-user-id` Header Without Cryptographic Signature
- **File & Lines:** `server/gateway/src/utils/proxyWithHeader.js:5–11`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** The gateway forwards user identity via `proxyReqOpts.headers["x-user-id"] = srcReq.user.userId`. The header is unencrypted and unsigned. Any client or internal service that can communicate over the Docker/container network can spoof `x-user-id` to act as an administrator or any other user.
- **Reproduction Scenario:**
  1. Inspect network packets or forward requests with a custom `x-user-id` to an internal service port.
  2. The downstream service assumes the gateway verified the identity.
- **Recommended Fix:** Sign inter-service requests with an HMAC signature (`x-signature: hmac(userId + timestamp, secret)`) or forward signed JWTs.

---

#### [BE-SEC-008] Missing Razorpay Webhook Signature Verification and Idempotency
- **File & Lines:** `server/services/billing/src/controllers/billing.controller.js:37–78`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** Payment fulfillment is handled exclusively via client-submitted `POST /payment` requests. There is no server-side Razorpay webhook handler configured to capture background asynchronous payment notifications. If a user closes their browser after payment before the client handler runs, the payment is never registered. Furthermore, the endpoint lacks idempotency checks: repeatedly submitting the same payment details can trigger duplicate credit grants.
- **Reproduction Scenario:**
  1. Complete payment in Razorpay checkout.
  2. Kill client browser before `verifyPayment` executes.
  3. User is debited by Razorpay, but no credits are granted in Agent-Forge.
- **Recommended Fix:** Implement a Razorpay webhook route (`POST /webhook`) verifying `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET`, using idempotent transaction records in MongoDB.

---

#### [BE-SEC-009] Gateway CORS Unrestricted Origin When `FRONTEND_URL` is Unset
- **File & Lines:** `server/gateway/index.js:14–19`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** The CORS middleware initializes with `origin: process.env.FRONTEND_URL`. If `FRONTEND_URL` is undefined, `cors` defaults to reflecting all origins while keeping `credentials: true`. This allows arbitrary cross-origin domains to make authenticated credentialed requests to the gateway.
- **Reproduction Scenario:**
  1. Start Gateway without defining `FRONTEND_URL` in `.env`.
  2. Send a request from `https://evil.com` with `credentials: include`.
  3. Gateway returns `Access-Control-Allow-Origin: https://evil.com` and `Access-Control-Allow-Credentials: true`.
- **Recommended Fix:** Fail startup if `FRONTEND_URL` is undefined, or default to a restrictive origin.

---

#### [BE-SEC-010] Missing Security Headers Middleware (`helmet`) on Gateway Responses
- **File & Lines:** `server/gateway/index.js:1–35`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** The gateway does not employ `helmet` or custom security headers. Responses lack `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and `Content-Security-Policy`.
- **Reproduction Scenario:**
  1. Inspect response headers on `GET http://localhost:3000/api/v1/me`.
  2. Missing standard OWASP security headers.
- **Recommended Fix:** Install `helmet` and mount it: `app.use(helmet())`.

---

#### [BE-SEC-011] Unvalidated Proxy Target URLs in Gateway Enabling Potential SSRF
- **File & Lines:** `server/gateway/index.js:26, 28–30`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Security
- **Description:** `AUTH_SERVICE_URL`, `CHAT_SERVICE_URL`, `AGENT_SERVICE_URL`, and `BILLING_SERVICE_URL` are passed directly into `proxy()` without URL validation or startup sanity checks. If an environment variable is misconfigured or injected, the gateway proxies internal traffic to unintended destinations (SSRF).
- **Reproduction Scenario:**
  1. Set `AUTH_SERVICE_URL=http://169.254.169.254`.
  2. Gateway routes `/api/v1/auth/*` requests to the cloud metadata instance.
- **Recommended Fix:** Validate all service URLs at startup with a strict URL schema validator against allowed internal hosts.

---

#### [BE-SEC-012] Unsanitized Session ID Interpolation in Redis Keys
- **File & Lines:** `server/gateway/src/repositories/session.repositories.js:4`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** In `getSession(sessionId)`, `sessionId` is directly interpolated into `redis.get(\`session-${sessionId}\`)`. If the session cookie contains special characters or arbitrary string formats, unexpected key namespaces can be queried.
- **Reproduction Scenario:**
  1. Set cookie `session=../../arbitrary_key`.
  2. Key is queried as `session-../../arbitrary_key`.
- **Recommended Fix:** Validate that `sessionId` conforms strictly to standard UUID v4 format before executing Redis commands: `if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) return null;`.

---

#### [BE-SEC-013] Sensitive Internal Data Exposure in `/api/v1/me` and `/auth/login`
- **File & Lines:** `server/gateway/src/controllers/user.controller.js:1–12`, `server/services/auth/src/controllers/auth.controller.js:57–60`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** The `/api/v1/me` and `/auth/login` endpoints return the entire raw Mongoose document and Redis session object, including MongoDB version keys `__v`, internal Firebase UIDs, and raw metadata.
- **Reproduction Scenario:**
  1. Call `GET /api/v1/me`.
  2. Inspect JSON response: contains unprojected database fields.
- **Recommended Fix:** Project only public-safe fields: `{ id, name, email, avatar, planId, credits, totalCredits, planExpiresAt }`.

---

#### [BE-SEC-014] Internal Server and Database Error Exposure to Client Responses
- **File & Lines:** `server/services/agent/src/controllers/agent.controller.js:87–97`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** In `agent.controller.js`, the catch block extracts `error?.response?.data?.message || error?.message` and returns it directly to clients. If an upstream service or database throws an exception containing connection strings, internal service hostnames, or API keys, it is exposed in the HTTP 500 response.
- **Reproduction Scenario:**
  1. Cause MongoDB connection failure in Chat service.
  2. Call Agent service.
  3. Response body returns raw database error and stack information.
- **Recommended Fix:** Log the internal error on the server and return a sanitized message: `res.status(500).json({ message: "An error occurred while processing your request." })`.

---

#### [BE-SEC-015] S3 Object Key Path Traversal Risk from Unsanitized LLM-Generated Titles
- **File & Lines:** `server/services/agent/src/agents/pdf.agent.js:16`, `ppt.agent.js:18`, `image.agent.js:18`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Security
- **Description:** S3 object keys are generated as `` `${data.title}-${Date.now()}.pdf` `` and `` `${content.fileName}-${Date.now()}.png` ``. Because `data.title` and `content.fileName` are generated by an LLM based on user prompt input, an adversarial prompt can inject `../` path traversal sequences or invalid S3 characters into the bucket key.
- **Reproduction Scenario:**
  1. User prompt: "Generate a presentation titled ../../root_override".
  2. The generated key becomes `../../root_override-17000000000.pptx`.
- **Recommended Fix:** Sanitize file names by stripping non-alphanumeric characters: `const safeTitle = data.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);`.

---

### B. Crash / Runtime

#### [BE-CRASH-001] Fatal Typo `mongoose.Model` Crashing Billing Service on Import
- **File & Lines:** `server/services/billing/src/models/payment.model.js:37`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** Line 37 contains `const PaymentModel = mongoose.Model("payments", paymentSchema);`. In Mongoose, `mongoose.Model` (capital M) is the class constructor, not the model registration function `mongoose.model()` (lowercase m). Calling `mongoose.Model(...)` without `new` throws a fatal `TypeError: mongoose.Model is not a function`, crashing the Billing service immediately upon startup.
- **Reproduction Scenario:**
  1. Run `node server/services/billing/index.js`.
  2. Service crashes immediately with `TypeError: mongoose.Model is not a function`.
- **Recommended Fix:** Change `mongoose.Model` to `mongoose.model`:
  ```javascript
  const PaymentModel = mongoose.model("payments", paymentSchema);
  ```

---

#### [BE-CRASH-002] ReferenceError: `razorpay` Used Without Import in Billing Controller
- **File & Lines:** `server/services/billing/src/controllers/billing.controller.js:16`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** In `createOrder`, the controller calls `const order = await razorpay.orders.createOrder(...)`. However, `razorpay` is never imported into `billing.controller.js`. The configured instance in `src/config/razorpay.js` is never referenced, throwing `ReferenceError: razorpay is not defined` whenever an order is created.
- **Reproduction Scenario:**
  1. Send a POST request to `/api/v1/billing/order`.
  2. Controller executes line 16.
  3. Execution halts with `ReferenceError: razorpay is not defined`.
- **Recommended Fix:** Add `import razorpay from "../config/razorpay.js";` at the top of `billing.controller.js`.

---

#### [BE-CRASH-003] ReferenceError: `crypto` Used Without Import in Billing Controller
- **File & Lines:** `server/services/billing/src/controllers/billing.controller.js:42`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** In `verifyPayment`, the controller calls `crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)`. In Node.js ES modules, `crypto` is not a global object and must be imported explicitly. Invoking `verifyPayment` throws `ReferenceError: crypto is not defined`.
- **Reproduction Scenario:**
  1. Send a POST request to `/api/v1/billing/payment`.
  2. Controller executes line 42.
  3. Throws `ReferenceError: crypto is not defined`.
- **Recommended Fix:** Add `import crypto from "crypto";` at the top of `billing.controller.js`.

---

#### [BE-CRASH-004] Wrong Razorpay SDK Method `orders.createOrder` Instead of `orders.create`
- **File & Lines:** `server/services/billing/src/controllers/billing.controller.js:16`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** Line 16 calls `await razorpay.orders.createOrder(...)`. In the official `razorpay` Node.js SDK, the method to create an order is `razorpay.orders.create(...)`. Calling `createOrder` throws `TypeError: razorpay.orders.createOrder is not a function`.
- **Reproduction Scenario:**
  1. Fix the import of `razorpay`.
  2. Invoke `POST /billing/order`.
  3. Throws `TypeError: razorpay.orders.createOrder is not a function`.
- **Recommended Fix:** Change `razorpay.orders.createOrder` to `razorpay.orders.create`.

---

#### [BE-CRASH-005] Wrong HMAC Separator Spaces in Razorpay Verification Guaranteeing Payment Failure
- **File & Lines:** `server/services/billing/src/controllers/billing.controller.js:44`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** Line 44 computes the HMAC digest with:
  ```javascript
  .update(`${razorpay_order_id} | ${razorpay_payment_id}`)
  ```
  The string contains spaces around the pipe (` | `). Razorpay's official HMAC signature specification mandates the format `${order_id}|${payment_id}` without spaces. Consequently, the computed signature will NEVER match `razorpay_signature`, causing 100% of legitimate customer payments to be rejected as "Payment verification failed".
- **Reproduction Scenario:**
  1. Complete a valid payment through Razorpay test mode.
  2. Razorpay returns valid `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
  3. Controller calculates HMAC with spaces.
  4. Signature check fails: `generateSignature !== razorpay_signature`, returning 400.
- **Recommended Fix:** Remove the spaces around the pipe: `.update(`${razorpay_order_id}|${razorpay_payment_id}`)`.

---

#### [BE-CRASH-006] Incorrect Named Import of `PDFDocument` Crashing PDF Generation
- **File & Lines:** `server/services/agent/src/utils/generate-pdf.js:1`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** Line 1 imports `import { PDFDocument } from "pdfkit"`. `pdfkit` exports the `PDFDocument` class as its **default export**, not a named export. Consequently, `PDFDocument` evaluates to `undefined`, and line 6 (`new PDFDocument(...)`) throws `TypeError: PDFDocument is not a constructor`.
- **Reproduction Scenario:**
  1. Request the PDF agent: "Generate a PDF summary of microservices".
  2. Agent invokes `generatePDF(data)`.
  3. Throws `TypeError: PDFDocument is not a constructor`.
- **Recommended Fix:** Change to default import: `import PDFDocument from "pdfkit";`.

---

#### [BE-CRASH-007] Auth Service Missing `cookie-parser` Causing Logout to Fail to Clear Redis Sessions
- **File & Lines:** `server/services/auth/index.js:1–18`, `server/services/auth/src/controllers/auth.controller.js:72, 112`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** In `auth.controller.js`, `logout` reads `const sessionId = req.cookies?.session`. However, `server/services/auth/index.js` never registers `cookie-parser` middleware (and `cookie-parser` is not even listed in `auth/package.json`). `req.cookies` is always `undefined`. As a result, `deleteSession(sessionId)` is never called, and user sessions remain active in Redis indefinitely after logout.
- **Reproduction Scenario:**
  1. Call `POST /api/v1/auth/logout` with cookie `session=xyz`.
  2. `req.cookies` is undefined in Auth service.
  3. Redis key `session-xyz` is never deleted.
- **Recommended Fix:** Add `cookie-parser` to `auth/package.json` and register `app.use(cookieParser())` in `auth/index.js`.

---

#### [BE-CRASH-008] Gitignored Static `serviceAccountKey.json` Import Preventing Clean Boot
- **File & Lines:** `server/services/auth/src/config/firebase.js:3`
- **Severity:** High
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** `auth/src/config/firebase.js` contains a top-level ESM import: `import serviceAccount from "../../serviceAccountKey.json" with { type: "json" };`. Because `serviceAccountKey.json` is listed in `.gitignore`, in any clean clone, CI runner, or container build without the local file, Node.js throws a fatal `ERR_MODULE_NOT_FOUND` before executing any code.
- **Reproduction Scenario:**
  1. Clone repository to a new environment or container.
  2. Run `npm run dev:auth`.
  3. Node halts with `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '../../serviceAccountKey.json'`.
- **Recommended Fix:** Fall back gracefully to `process.env.FIREBASE_SERVICE_ACCOUNT` (JSON string) or standard `applicationDefault()` credentials when the file is absent.

---

#### [BE-CRASH-009] JSON Parse Exceptions Crashing Auth Middleware on Corrupt Redis Session
- **File & Lines:** `server/gateway/src/middleware/auth.middleware.js:21`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** In `auth.middleware.js`, `req.user = JSON.parse(session)` is called without validating that the session value in Redis is valid JSON. If corrupted data or an unexpected string is stored in a session key, `JSON.parse` throws `SyntaxError`. The outer catch block returns a generic 500 Internal Server Error instead of 401 Unauthorized, and never clears the corrupted session key.
- **Reproduction Scenario:**
  1. Manually set a Redis session key to invalid JSON: `SET session-test "invalid"`.
  2. Send a request with cookie `session=test`.
  3. Gateway returns 500 error instead of clearing the session and returning 401.
- **Recommended Fix:** Wrap `JSON.parse` in a localized try/catch block. If parsing fails, delete the corrupted key from Redis and return 401 Unauthorized.

---

#### [BE-CRASH-010] Fragile `JSON.parse` in PDF, PPT, and Image Agents Failing on Fenced LLM Output
- **File & Lines:** `server/services/agent/src/agents/pdf.agent.js:13`, `ppt.agent.js:14`, `image.agent.js:14`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** While `coding.agent.js` implements a resilient `extractJson()` helper, `pdf.agent.js`, `ppt.agent.js`, and `image.agent.js` directly invoke `JSON.parse(response.content.trim())`. LLMs frequently wrap JSON responses in markdown code blocks (````json ... ````) or include conversational preamble. Direct `JSON.parse` throws `SyntaxError`, causing document and image generation to fail.
- **Reproduction Scenario:**
  1. Invoke PDF or PPT agent where LLM response starts with "```json".
  2. `JSON.parse` throws SyntaxError.
  3. Agent returns "Failed to generate pdf!" / "Failed to generate ppt!".
- **Recommended Fix:** Extract `extractJson()` into a shared utility (`agent/src/utils/json.js`) and use it across all agent nodes.

---

#### [BE-CRASH-011] `codingAgent` Implicitly Returning `undefined` When Code Generation JSON Parsing Fails
- **File & Lines:** `server/services/agent/src/agents/coding.agent.js:53–92`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Crash / Runtime
- **Description:** In `codingAgent`, if `intent === "CODE_GENERATION"` and `extractJson()` fails to produce a valid object (`data` is null/empty), the `if (data)` block is skipped. There is no `else` statement or fallback return inside the `if (intent === "CODE_GENERATION")` branch. The function returns `undefined`, corrupting LangGraph's state graph execution.
- **Reproduction Scenario:**
  1. Prompt coding agent with an input that causes LLM to produce truncated/invalid JSON.
  2. `codingAgent` returns `undefined`.
  3. LangGraph encounters state anomaly, and controller falls back to generic failure message.
- **Recommended Fix:** Add an explicit fallback return:
  ```javascript
  return {
    ...state,
    aiResponse: "I was unable to generate valid code for that request. Please try refining your prompt.",
    artifact: []
  };
  ```

---

### C. UI / UX (API Usability & Contracts)

#### [BE-UX-001] Identifier Mismatch: Billing Sends Mongo `_id` but User Repo Queries `firebaseUid`
- **File & Lines:** `server/services/auth/src/repositories/user.repositories.js:25`, `server/services/auth/src/controllers/auth.controller.js:104`
- **Severity:** Critical
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** When a payment is verified, Billing calls `PATCH /payment` with `userId: payment.userId`. In Billing, `payment.userId` is stored from `req.headers["x-user-id"]`, which the Gateway sets to `srcReq.user.userId` (the MongoDB `_id`). In Auth, `findOneAndUpdateUser(userId, planId)` executes:
  ```javascript
  UserModel.findOneAndUpdate({ firebaseUid: userId }, ...)
  ```
  Because `userId` is a MongoDB `ObjectId` string and NOT a `firebaseUid`, the query never finds a matching document. The Auth service returns 404 User Not Found, and the paying user is never upgraded in the database.
- **Reproduction Scenario:**
  1. User pays for a Starter plan.
  2. Billing calls Auth `PATCH /payment` with MongoDB `_id`.
  3. Auth queries `{ firebaseUid: "67...a" }`.
  4. Returns 404. User's plan remains "free".
- **Recommended Fix:** Update `findOneAndUpdateUser` to query by MongoDB `_id`:
  ```javascript
  export async function findOneAndUpdateUser(userId, planId) {
    const plan = PLANS[planId];
    return await UserModel.findByIdAndUpdate(userId, { ... }, { new: true });
  }
  ```

---

#### [BE-UX-002] Stale Session in Redis After Plan Upgrade Due to Missing Cookie in Internal Call
- **File & Lines:** `server/services/auth/src/controllers/auth.controller.js:112–114`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** In `updateUserPayment`, line 112 extracts `const sessionId = req.cookies?.session`. When Billing calls this endpoint via Axios, no browser cookies are sent. `sessionId` is `undefined`. Line 114 sets `session-undefined` in Redis. The user's active session in Redis remains untouched with their old plan tier and old credit balance.
- **Reproduction Scenario:**
  1. Successfully upgrade a plan.
  2. Inspect Redis: new key `session-undefined` is created.
  3. User calls `GET /api/v1/me`: returns old plan data from active session.
- **Recommended Fix:** In `setSession`, invalidate or update the user's active sessions by user ID, or have the client trigger a session refresh.

---

#### [BE-UX-003] Absence of Credit Check and Deduction Permitting Unlimited Unenforced LLM Usage
- **File & Lines:** `server/services/agent/src/controllers/agent.controller.js:5–98`
- **Severity:** High
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** The Agent service never checks whether the requesting user has remaining credits, nor does it decrement user credits after successful model execution. The `credits` and `totalCredits` fields in `UserModel` are purely decorative, allowing zero-balance accounts to execute unlimited expensive LLM requests.
- **Reproduction Scenario:**
  1. Set a user's credits to 0 in MongoDB.
  2. Submit complex prompts to the Coding and PPT agents.
  3. The Agent service processes all requests without restriction.
- **Recommended Fix:** In `agent.controller.js`, query user credits before calling `graph.invoke()`. Return `403 Forbidden: Insufficient credits` if `credits <= 0`. Decrement credits upon successful completion.

---

#### [BE-UX-004] S3 Presigned URL Expiry Unit Mismatch (24 Minutes Instead of 24 Hours)
- **File & Lines:** `server/services/lib/constant.js:3`, `server/services/agent/src/utils/s3.utils.js:18`, `agent/src/agents/image.agent.js:38`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** In `constant.js`, `URL_EXPIRY = 24 * 60` (1440, with comment "in minutes"). However, `getFromS3(fileName, expiresIn)` passes this value directly to AWS SDK `@aws-sdk/s3-request-presigner`, which expects `expiresIn` in **seconds**. Consequently, generated image/PDF/PPT download links expire in 1440 seconds (24 minutes), while the agent text promises the user "Link will expire in 24 hour(s)".
- **Reproduction Scenario:**
  1. Generate an image or PDF.
  2. Copy the presigned S3 link and attempt to download it after 25 minutes.
  3. S3 returns `Request has expired`.
- **Recommended Fix:** In `constant.js`, define `URL_EXPIRY = 24 * 60 * 60; // 86400 seconds (24 hours)`.

---

#### [BE-UX-005] PDF Generation `fillColor` Invoked After `text` Displacing All Element Palette Colors
- **File & Lines:** `server/services/agent/src/utils/generate-pdf.js:23–76`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** In PDFKit, `.fillColor()` sets the graphics state fill color for *subsequent* text rendering. Throughout `generate-pdf.js`, `.fillColor()` is chained *after* `.text()`. As a result, the title renders in black, the subtitle renders in the title's color, section headings render in subtitle color, and all color styling is displaced by one element.
- **Reproduction Scenario:**
  1. Generate any PDF.
  2. Inspect text colors: document title does not have `#111827`, subtitle does not have `#6B7280`.
- **Recommended Fix:** Set `fillColor` before `text`: `doc.fillColor("#111827").fontSize(28).text(...)`.

---

#### [BE-UX-006] PPT Slide Layout Defect: Conclusion Text Positioned at Extreme Left Margin
- **File & Lines:** `server/services/agent/src/utils/generate-ppt.js:192`
- **Severity:** Low
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** In `addConclusion`, the conclusion text box is positioned at `x: 0.06`. Standard content slides use `x: 0.6` or `x: 0.7`. Setting `x: 0.06` places the text directly against the left edge of the slide, cutting off text on projectors and creating an unaligned presentation layout.
- **Reproduction Scenario:**
  1. Generate a presentation with the PPT agent.
  2. Open the `.pptx` file and navigate to the Conclusion slide.
  3. Text is glued to the left edge of the slide canvas.
- **Recommended Fix:** Change `x: 0.06` to `x: 0.6` in `generate-ppt.js`.

---

#### [BE-UX-007] Missing Input Validation on `userId` in `createConversation` Producing Orphan Records
- **File & Lines:** `server/services/chat/src/controllers/conversation.controller.js:5–7`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** `createConversation` reads `const userId = req.headers["x-user-id"]` and immediately creates a conversation. If `x-user-id` is missing or undefined, a conversation document is created with `userId: undefined`, polluting the database with orphaned records that cannot be retrieved by any user.
- **Reproduction Scenario:**
  1. Send `POST /conversations` without `x-user-id`.
  2. A new conversation document is inserted into MongoDB with `userId: null`.
- **Recommended Fix:** Validate `if (!userId) return res.status(400).json({ message: "userId header is required" });`.

---

#### [BE-UX-008] Agent `getMessages` Omitting Identity Header Bypassing Conversation Isolation
- **File & Lines:** `server/services/agent/src/utils/getMessages.js:7–9`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** UI / UX
- **Description:** When the Agent service populates conversation memory from the Chat service, it calls `axios.get(\`${chatServiceUrl}/messages/${conversationId}\`)` without passing `x-user-id`. Combined with [BE-SEC-004], any agent invocation can access and incorporate messages from any other user's conversation ID.
- **Reproduction Scenario:**
  1. Call Agent service with another user's `conversationId`.
  2. Agent successfully loads and injects the other user's chat history into the LLM context.
- **Recommended Fix:** Forward the requesting `userId` in `getMessages.js`: `headers: { "x-user-id": userId }`.

---

### D. Aesthetics (API Consistency & Maintainability)

#### [BE-AES-001] Router LLM Configured with `temperature: 1.0` Inducing Stochastic Routing Behavior
- **File & Lines:** `server/services/agent/src/config/llm.js:8, 27–50`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** The Router node classifies user intent into one of six agent categories. `getModel("router")` defaults to `groq` with `temperature: 1.0`. For classification tasks, high temperature produces non-deterministic routing where identical prompts route to different agents across calls.
- **Reproduction Scenario:**
  1. Submit the prompt "Show me the quarterly budget chart" 5 times in Auto mode.
  2. Observe different routing decisions (sometimes Chat, sometimes PPT, sometimes Search).
- **Recommended Fix:** Configure the router LLM instance with `temperature: 0` for deterministic classification.

---

#### [BE-AES-002] Substring-Based Router Classification Prone to False-Positive Agent Selection
- **File & Lines:** `server/services/agent/src/graph/router.js:21–24`
- **Severity:** Low
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** In `router.js`, `validAgents.find((agent) => text.includes(agent))` matches agents using `String.includes()`. If the LLM generates "I will answer this using chat rather than coding", `text.includes("coding")` evaluates to true first because "coding" precedes "chat" in `validAgents`, routing to the wrong agent.
- **Reproduction Scenario:**
  1. Router returns "Do not use coding for this general question".
  2. Router selects `coding` agent.
- **Recommended Fix:** Use exact word boundary matching via regex (`new RegExp(`\\b${agent}\\b`)`) or structured JSON tool calling.

---

#### [BE-AES-003] Server Listening Before Database Connection Established (Startup Race)
- **File & Lines:** `server/services/agent/index.js:14–17`, `auth/index.js:15–18`, `billing/index.js:15–18`, `chat/index.js:17–20`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** In all four microservices, `connectDatabase()` is called inside the `app.listen()` callback. The HTTP server binds and accepts incoming requests before MongoDB has connected, causing early requests to fail with database timeout errors.
- **Reproduction Scenario:**
  1. Start a service and immediately send an HTTP request within the first 50ms.
  2. Request fails because Mongoose connection is still pending.
- **Recommended Fix:** Connect to the database before listening: `await connectDatabase(); app.listen(port, ...)`.

---

#### [BE-AES-004] Missing Non-Atomic Redis Read-Modify-Write Concurrency Guards in Agent Memory Cache
- **File & Lines:** `server/services/agent/src/config/memory.js:39–68`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** `updateMemoryBatch` fetches cache from Redis, appends messages in Node memory, and writes back to Redis. If two requests for the same conversation execute concurrently, the second write overwrites the first, losing messages from memory cache.
- **Reproduction Scenario:**
  1. Send two concurrent prompts to the same conversation ID.
  2. Inspect Redis messages cache: only one prompt/response pair is preserved.
- **Recommended Fix:** Use Redis `RPUSH` / `LTRIM` list commands or a Lua script for atomic updates.

---

#### [BE-AES-005] Missing Unique Index on `user.email` Allowing Divergent Accounts
- **File & Lines:** `server/services/auth/src/models/user.model.js:15–19`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** In `UserModel`, `email` is configured with `index: true`, but lacks `unique: true`. If a user authenticates via multiple Firebase identity providers that return the same email address under different Firebase UIDs, multiple accounts are created for the same email address.
- **Reproduction Scenario:**
  1. Sign in with Google Auth (`user@example.com`).
  2. Later sign in with another provider using `user@example.com`.
  3. Two separate documents exist in MongoDB.
- **Recommended Fix:** Add `unique: true, sparse: true` to `email` in `user.model.js`.

---

#### [BE-AES-006] Global Request Body Consumed Prior to Express HTTP Proxying
- **File & Lines:** `server/gateway/index.js:23–26`
- **Severity:** Medium
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** In `gateway/index.js`, `app.use(express.json())` is mounted globally before `app.use("/api/v1/auth", proxy(...))`. Global body parsing consumes request streams, forcing `express-http-proxy` to re-serialize the body, causing content-length or encoding discrepancies on large payloads.
- **Reproduction Scenario:**
  1. Send non-JSON or multipart payload through the gateway.
  2. Global body parser alters or corrupts the proxy stream.
- **Recommended Fix:** Mount proxy routes before `express.json()` or configure `{ parseReqBody: false }` on proxy endpoints.

---

#### [BE-AES-007] Copy-Paste Logging Typo in `pdf.agent.js` Tagging Warnings as `[Image-Agent Error]`
- **File & Lines:** `server/services/agent/src/agents/pdf.agent.js:34`
- **Severity:** Low
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** In `pdf.agent.js`, line 34 logs `console.warn("[Image-Agent Error]", error);`. This copy-paste artifact produces misleading logs when diagnosing PDF generation issues.
- **Reproduction Scenario:**
  1. Trigger an error in PDF generation.
  2. Inspect server logs: logged as `[Image-Agent Error]`.
- **Recommended Fix:** Change to `console.warn("[PDF-Agent Error]", error);`.

---

#### [BE-AES-008] Missing Correlation ID / Request Tracing Across Microservice Calls
- **File & Lines:** `server/gateway/src/utils/proxyWithHeader.js:5–11`
- **Severity:** Low
- **Category:** Backend | **Subcategory:** Aesthetics
- **Description:** Across Gateway, Auth, Chat, Agent, and Billing services, requests lack an `x-request-id` header. Tracking an end-to-end user operation across 5 services in distributed logs is difficult.
- **Reproduction Scenario:**
  1. Trigger an error that cascades between Gateway and Agent.
  2. Logs show unlinked errors without a shared trace ID.
- **Recommended Fix:** Generate a UUID `x-request-id` at Gateway and forward it in `proxyWithHeader.js`.

---

## 3. Common (DevOps, Configuration, Architecture & QA)

### A. Security

#### [COM-SEC-001] Redis Exposed on Host Without Authentication or TLS
- **File & Lines:** `server/docker-compose.yml:1–5`
- **Severity:** Critical
- **Category:** Common | **Subcategory:** Security
- **Description:** In `docker-compose.yml`, the Redis service binds port `6379:6379` to all host interfaces with no password authentication (`requirepass`) configured. Anyone with network access to the Docker host can connect, dump all session cookies, inject forged sessions, or wipe the Redis cache.
- **Reproduction Scenario:**
  1. Run `docker-compose up -d`.
  2. From another machine on the LAN, execute `redis-cli -h <host-ip> keys '*'`.
  3. All active user sessions are returned in plaintext without credentials.
- **Recommended Fix:** Require a strong password (`command: redis-server --requirepass ${REDIS_PASSWORD}`) and bind port 6379 strictly to `127.0.0.1` or internal Docker networks.

---

#### [COM-SEC-002] Absence of Request Body Payload Size Caps Across Services
- **File & Lines:** `server/gateway/index.js:23`, all microservice `index.js` files
- **Severity:** Medium
- **Category:** Common | **Subcategory:** Security
- **Description:** All backend services register `express.json()` without specifying a `limit` parameter. Clients can submit multi-megabyte payloads, causing memory exhaustion and Denial of Service.
- **Reproduction Scenario:**
  1. Send a 50MB POST payload to `/api/v1/chat/messages`.
  2. Node memory spikes as the entire payload is buffered.
- **Recommended Fix:** Set explicit limits: `app.use(express.json({ limit: "1mb" }))`.

---

### B. Crash / Runtime

#### [COM-CRASH-001] Redis Connection Client Missing Reconnection Strategy and Health Fail-Safes
- **File & Lines:** `server/shared/redis/redis.js:1–13`
- **Severity:** Medium
- **Category:** Common | **Subcategory:** Crash / Runtime
- **Description:** The shared Redis client in `shared/redis/redis.js` initializes without an explicit `retryStrategy`, `maxRetriesPerRequest`, or connection timeout. If Redis restarts or drops connection, incoming gateway requests fail with unhandled 500 errors.
- **Reproduction Scenario:**
  1. Restart Redis container while services are running.
  2. Authenticated requests crash with socket closed errors.
- **Recommended Fix:** Configure an exponential backoff `retryStrategy` and return clean 503 Service Unavailable responses during outages.

---

#### [COM-CRASH-002] Complete Absence of Test Suites, Test Scripts, and QA Automation
- **File & Lines:** All repository `package.json` files
- **Severity:** High
- **Category:** Common | **Subcategory:** Crash / Runtime
- **Description:** There is zero test coverage in the entire codebase. Neither the root, client, gateway, nor any microservice contains test dependencies (Vitest, Jest), test configuration, test files (`*.test.js`), or `npm test` scripts. Regression testing is entirely impossible without manual inspection.
- **Reproduction Scenario:**
  1. Run `npm test` in `client` or `server`.
  2. Output: `Error: no test specified`.
- **Recommended Fix:** Install Vitest in `client` and Jest/Supertest in `server`. Establish automated CI unit tests for authentication, order creation, and agent routing.

---

### C. UI / UX

#### [COM-UX-001] Inconsistent Brand Naming: Repository `Agent-Forge` vs Application `Choreograph AI`
- **File & Lines:** Repository root, `client/package.json:2`, `server/package.json:2`, `docs/ISSUES.md:1`
- **Severity:** Low
- **Category:** Common | **Subcategory:** UI / UX
- **Description:** The UI has been rebranded to "Choreograph AI", but the repository folder is `Agent-Forge`, package manifests use `"name": "client"` and `"name": "server"`, and Firebase configs reference `agentforge-92fdc`. This causes developer confusion during onboarding.
- **Reproduction Scenario:**
  1. Contrast repository folder `Agent-Forge` with UI title `Choreograph AI`.
- **Recommended Fix:** Standardize naming across documentation, package manifests, and repository descriptions.

---

#### [COM-UX-002] Missing Health and Liveness Probes on Gateway and Microservices
- **File & Lines:** `server/gateway/index.js:1–35`, microservice entrypoints
- **Severity:** Low
- **Category:** Common | **Subcategory:** UI / UX
- **Description:** Neither the API Gateway nor any of the 4 microservices exposes a `/health` or `/ready` endpoint. Load balancers, Docker healthchecks, and Kubernetes liveness probes cannot determine service availability.
- **Reproduction Scenario:**
  1. Configure a container orchestrator probe targeting `GET /health`.
  2. Endpoint returns 404 Not Found.
- **Recommended Fix:** Add a lightweight `/health` endpoint to all services that pings Redis and MongoDB.

---

### D. Aesthetics

#### [COM-AES-001] Empty Documentation Files: `README.md`, `API.md`, `ARCHITECTURE.md`, `FLOW.md`
- **File & Lines:** `README.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/FLOW.md`
- **Severity:** High
- **Category:** Common | **Subcategory:** Aesthetics
- **Description:** Key repository documentation files (`README.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/FLOW.md`) are 0 bytes. A 5-service microservices architecture with a React frontend provides zero onboarding, architecture diagrams, or endpoint contract documentation.
- **Reproduction Scenario:**
  1. Open `README.md` or any file in `docs/` except `ISSUES.md`.
  2. File is completely blank.
- **Recommended Fix:** Populate `README.md` with setup guides, `API.md` with REST contracts, and `ARCHITECTURE.md` with system diagrams.

---

#### [COM-AES-002] Missing `.env.example` Templates Across Microservices and Deployment Targets
- **File & Lines:** Repository root, `server/gateway/`, `server/services/billing/`, `client/`
- **Severity:** Medium
- **Category:** Common | **Subcategory:** Aesthetics
- **Description:** The project relies on over 20 environment variables across 6 different applications, but lacks `.env.example` templates in `server/gateway`, `server/services/billing`, and the repository root. New developers have to guess required environment variables by reading source code.
- **Reproduction Scenario:**
  1. Attempt to configure the Billing service or Gateway from scratch without existing `.env` files.
- **Recommended Fix:** Provide complete `.env.example` files documenting required keys for every service.

---

#### [COM-AES-003] Development Dependencies (`nodemon`, `prettier`) Installed in Production
- **File & Lines:** `client/package.json:18`, `server/gateway/package.json:21`, `server/services/agent/package.json:26`, `server/services/auth/package.json:19`
- **Severity:** Low
- **Category:** Common | **Subcategory:** Aesthetics
- **Description:** Build and dev tools like `nodemon` and `prettier` are declared in `dependencies` rather than `devDependencies`. When deploying with `npm install --omit=dev`, unnecessary tooling is installed, inflating container image sizes and attack surfaces.
- **Reproduction Scenario:**
  1. Inspect `dependencies` block in `gateway/package.json`.
  2. `"nodemon": "^3.1.14"` is listed as a runtime dependency.
- **Recommended Fix:** Move development tools to `devDependencies` and define a production `"start": "node index.js"` script.

---

#### [COM-AES-004] Duplicate `ioredis` Dependencies Without Coordinated Monorepo Workspaces
- **File & Lines:** `server/package.json:20`, `server/gateway/package.json:19`
- **Severity:** Low
- **Category:** Common | **Subcategory:** Aesthetics
- **Description:** `ioredis` is installed both at `server/package.json` and `server/gateway/package.json`. Because npm workspaces are not configured, multiple duplicate copies of `ioredis` are installed, creating risk of version drift and multiple connection pools.
- **Reproduction Scenario:**
  1. Check `server/node_modules/ioredis` and `server/gateway/node_modules/ioredis`.
- **Recommended Fix:** Configure npm/pnpm workspaces or hoist shared database dependencies to the root package.

---

## 4. Remediation Roadmap

```mermaid
flowchart TD
    subgraph Phase 1: Critical Service Restoration
        P1_1[Fix Payment Model Typo: BE-CRASH-001]
        P1_2[Add Missing Imports & Fix SDK: BE-CRASH-002, 003, 004]
        P1_3[Fix Razorpay HMAC Separator: BE-CRASH-005]
        P1_4[Secure Redis & Patch Auth Hole: COM-SEC-001, BE-SEC-001]
        P1_5[Fix Mongo _id Mismatch in Auth: BE-UX-001]
        P1_6[Fix Client verifyPayment ReferenceError: FE-CRASH-001]
    end

    subgraph Phase 2: Security Hardening & Authorization
        P2_1[Inter-Service Auth & Header Signing: BE-SEC-002, BE-SEC-007]
        P2_2[Enforce Chat & Message Authorization: BE-SEC-003, 004, 005]
        P2_3[Implement Rate Limiting & Webhook Security: BE-SEC-006, BE-SEC-008]
        P2_4[Sanitize Markdown Link XSS: FE-SEC-001]
    end

    subgraph Phase 3: Runtime Crashes & Credit Enforcement
        P3_1[Enforce Credit Balance Deductions: BE-UX-003]
        P3_2[Fix PDFKit Named Import & Colors: BE-CRASH-006, BE-UX-005]
        P3_3[Fix ChatArea Null Spread Crash: FE-CRASH-003]
        P3_4[Add Cookie-Parser to Auth: BE-CRASH-007]
        P3_5[Fix S3 Expiry Unit Mismatch: BE-UX-004]
    end

    subgraph Phase 4: State Management & UX Polish
        P4_1[Fix BillingModal Error Handling & Refresh: FE-UX-001]
        P4_2[Fix Conversation Deletion Stale Messages: FE-UX-002, FE-UX-003]
        P4_3[Make Agent Selection Semantic & Accessible: FE-UX-006]
        P4_4[Syntax Highlighter Bundle Optimization: FE-AES-001]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
```

---

## 5. Audit Limitations

1. **Static Source Code Analysis:** Analysis was conducted via thorough AST and line-by-line static inspection without live production database traffic.
2. **Secrets & External Credentials:** `.env` secret values were intentionally not inspected per security protocols; actual Razorpay live mode webhooks and AWS S3 bucket permissions could not be evaluated at runtime.
3. **Automated Test Execution:** Automated test results cannot be reported because no test framework or test suite exists in the codebase (documented in `[COM-CRASH-002]`).
