# Conversation Initiator Proposal

This document outlines a technical strategy to enable deep-linking into the Conversations application with a pre-filled prompt. It also provides an extensible design to support other AI providers.

## 1. Discovery Summary

**Current State:**
- The `conversations` application **does not currently support** deep-linking with a prompt (e.g., `?prompt=Hello`).
- The internal API requires authentication and a specific sequence of calls (create conversation -> send message), making it unsuitable for direct invocation from an external client-side application due to CORS and security constraints.
- The authentication flow (`src/frontend/apps/conversations/src/features/auth/utils.ts`) currently strips query parameters during the login redirect, meaning any prompt passed in the URL would be lost if the user is not already logged in.

**Conclusion:**
- A **frontend-first approach** is recommended. The external "Prompt Library" should simply construct a URL with query parameters.
- **Code changes are required in the `conversations` repository** to:
    1.  Preserve query parameters during authentication redirects.
    2.  Read the query parameters on the chat page and populate the input.

---

## 2. Implementation Guide for `conversations` Repository

To support this feature, the maintainers of the `conversations` app need to make two small changes.

### Step 1: Preserve Query Parameters during Login

**File:** `src/frontend/apps/conversations/src/features/auth/utils.ts`

Update the `setAuthUrl` function to include `window.location.search` (the query string) when saving the redirect URL.

```typescript
export const setAuthUrl = () => {
  // CHANGED: Check for search params and append them
  if (window.location.pathname !== '/' || window.location.search) {
    localStorage.setItem(
      PATH_AUTH_LOCAL_STORAGE,
      window.location.pathname + window.location.search, // Append query string
    );
  }
};
```

### Step 2: Handle URL Parameters in Chat Component

**File:** `src/frontend/apps/conversations/src/features/chat/components/Chat.tsx`

Update the `Chat` component to read the `prompt` (or `q`) and `auto_submit` parameters on mount.

```typescript
// Add these imports
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Inside the Chat component...
export const Chat = ({ initialConversationId = undefined }: { initialConversationId: string | undefined }) => {
  const router = useRouter();

  // ... existing hooks ...

  // NEW: Effect to handle deep-linking
  useEffect(() => {
    if (!router.isReady) return;

    const { prompt, q, auto_submit } = router.query;
    const initialPrompt = prompt || q;

    if (initialPrompt && typeof initialPrompt === 'string') {
      // 1. Set the input value
      handleInputChange({
        target: { value: initialPrompt },
      } as any);

      // 2. Clear the URL parameters so they don't persist on refresh
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // 3. Auto-submit if requested
      if (auto_submit === 'true') {
        // We need to wait for state updates to propagate
        setTimeout(() => {
           // Trigger submission logic (you might need to expose a submit handler that doesn't rely on the form event)
           // or simulate a form submission
           const form = document.createElement('form');
           handleSubmit({
             preventDefault: () => {},
             target: form,
           } as any);
        }, 100);
      }
    }
  }, [router.isReady, router.query]); // Run once when router is ready

  // ... rest of the component
```

---

## 3. "Initiator" Service (Adapter Pattern) for Prompt Library

This section provides the code you can use in your **Prompt Library application**. It uses an Adapter pattern to easily support multiple AI providers.

### Interface Design

```typescript
// types.ts
export interface ChatProvider {
  name: string;
  baseUrl: string;
  /**
   * Generates the deep-link URL for the provider.
   * @param prompt The prompt text to pre-fill.
   * @param autoSubmit Whether to attempt to automatically send the message (provider dependent).
   */
  getLink(prompt: string, autoSubmit?: boolean): string;
}
```

### Adapters Implementation

```typescript
// adapters.ts

// 1. Your Custom Conversations App
export class ConversationsAdapter implements ChatProvider {
  name = 'Conversations';
  baseUrl: string;

  constructor(baseUrl: string = 'https://your-conversations-instance.com') {
    this.baseUrl = baseUrl;
  }

  getLink(prompt: string, autoSubmit: boolean = false): string {
    const params = new URLSearchParams();
    params.append('prompt', prompt);
    if (autoSubmit) {
      params.append('auto_submit', 'true');
    }
    return `${this.baseUrl}/?${params.toString()}`;
  }
}

// 2. OpenAI (ChatGPT)
// Note: ChatGPT uses specific anchor tags or query params internally, but official deep-linking is limited.
// A common pattern is `https://chatgpt.com/?q=...` or using a prompt in a temporary chat.
export class ChatGPTAdapter implements ChatProvider {
  name = 'ChatGPT';
  baseUrl = 'https://chatgpt.com';

  getLink(prompt: string, autoSubmit: boolean = false): string {
    // Current best effort for ChatGPT deep linking
    const params = new URLSearchParams();
    params.append('q', prompt);
    // autoSubmit is not standardly supported via URL for ChatGPT public interface
    return `${this.baseUrl}/?${params.toString()}`;
  }
}

// 3. Google Gemini
export class GeminiAdapter implements ChatProvider {
  name = 'Gemini';
  baseUrl = 'https://gemini.google.com';

  getLink(prompt: string): string {
    // Gemini does not officially document a public deep-link for prompts yet,
    // but this structure is a placeholder for when they do.
    return `${this.baseUrl}/app`;
  }
}

// 4. Microsoft Copilot / Bing
export class CopilotAdapter implements ChatProvider {
    name = 'Copilot';
    baseUrl = 'https://copilot.microsoft.com';

    getLink(prompt: string): string {
         const params = new URLSearchParams();
         params.append('q', prompt);
         return `${this.baseUrl}/?${params.toString()}`;
    }
}
```

### Usage in React Component

```tsx
// InitiateButton.tsx
import React from 'react';
import { ChatProvider } from './types';

interface InitiateButtonProps {
  provider: ChatProvider;
  prompt: string;
}

export const InitiateButton: React.FC<InitiateButtonProps> = ({ provider, prompt }) => {
  const handleClick = () => {
    const url = provider.getLink(prompt, true); // defaulting to auto-submit
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="btn-primary"
      aria-label={`Start conversation with ${provider.name}`}
    >
      Start with {provider.name}
    </button>
  );
};
```

### Integration Example

```tsx
// App.tsx
import { ConversationsAdapter, ChatGPTAdapter } from './adapters';
import { InitiateButton } from './InitiateButton';

const myConversations = new ConversationsAdapter('https://conversations.numerique.gouv.fr');
const chatGPT = new ChatGPTAdapter();

export default function App() {
  const selectedPrompt = "Explain quantum computing to a 5-year-old.";

  return (
    <div>
      <h1>Prompt: {selectedPrompt}</h1>
      <div style={{ display: 'flex', gap: '10px' }}>
        <InitiateButton provider={myConversations} prompt={selectedPrompt} />
        <InitiateButton provider={chatGPT} prompt={selectedPrompt} />
      </div>
    </div>
  );
}
```
