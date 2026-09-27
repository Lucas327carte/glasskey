"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Mic,
  Plus,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { cx } from "@/lib/util";
import { useDynamicIsland } from "@/components/DynamicIsland";

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
  media?: { type: "image" | "video"; url: string } | null;
};

type ChatProps = {
  onMinimize: () => void;
  username: string;
};

const STORAGE_KEY = "jarvis_conversations";

type StoredConversation = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
  messages: ChatMessage[];
};

function loadConversations(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: StoredConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {
    // storage might be full; ignore
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function JarvisChat({ onMinimize, username }: ChatProps) {
  const island = useDynamicIsland();
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    if (loaded.length > 0 && loaded[0]) {
      setActiveId(loaded[0].id);
      setMessages(loaded[0].messages);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const persistMessages = useCallback((msgs: ChatMessage[], convId: string | null) => {
    setConversations((prev) => {
      let updated: StoredConversation[];
      if (convId && prev.some((c) => c.id === convId)) {
        updated = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
                title: msgs[0]?.content.slice(0, 40) || c.title,
              }
            : c,
        );
      } else {
        const newConv: StoredConversation = {
          id: convId || uid(),
          title: msgs[0]?.content.slice(0, 40) || "Nouvelle discussion",
          pinned: false,
          updatedAt: new Date().toISOString(),
          messages: msgs,
        };
        updated = [newConv, ...prev];
        if (!convId) setActiveId(newConv.id);
      }
      saveConversations(updated);
      return updated;
    });
  }, []);

  const simulateAIResponse = useCallback(
    async (userText: string): Promise<ChatMessage> => {
      island.setActive("Jarvis réfléchit…", 10);

      // Simulate progressive work
      const steps = [25, 45, 65, 85, 100];
      for (const p of steps) {
        await new Promise((r) => setTimeout(r, 400));
        island.setProgress(p);
      }

      // Generate a contextual response
      const lower = userText.toLowerCase();
      let response = "";
      if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
        response = `Bonjour ${username} ! Je suis Jarvis, ton assistant IA. Comment puis-je t'aider aujourd'hui ?`;
      } else if (lower.includes("image") || lower.includes("dessine") || lower.includes("génère")) {
        response = `Voici une image générée pour toi. J'ai créé une visualisation basée sur ta demande : « ${userText} ». Tu peux la retrouver dans la Bibliothèque.`;
      } else if (lower.includes("tâche") || lower.includes("devoir") || lower.includes("liste")) {
        response = `J'ai créé une nouvelle tâche pour toi : « ${userText} ». Tu peux la retrouver dans le module Tâches & Listes sur ta page d'accueil.`;
      } else if (lower.includes("note")) {
        response = `J'ai pris note de : « ${userText} ». Ta note est sauvegardée dans le module Notes rapides.`;
      } else if (lower.includes("dossier") || lower.includes("projet") || lower.includes("matière")) {
        response = `J'ai organisé cela dans tes projets. Tu peux accéder au gestionnaire de projets depuis ta page d'accueil.`;
      } else {
        response = `J'ai bien reçu ta demande : « ${userText} ». Je traite cela et je reviens vers toi avec un résultat.`;
      }

      island.setDone(response.slice(0, 80));

      return {
        id: uid(),
        role: "ai",
        content: response,
        createdAt: Date.now(),
        media: null,
      };
    },
    [island, username],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const newMsgs = [...messages, userMsg];
      setMessages(newMsgs);
      persistMessages(newMsgs, activeId);
      setInput("");
      setSending(true);

      try {
        const aiMsg = await simulateAIResponse(trimmed);
        const finalMsgs = [...newMsgs, aiMsg];
        setMessages(finalMsgs);
        persistMessages(finalMsgs, activeId);
      } catch {
        // show error as AI message
        const errMsg: ChatMessage = {
          id: uid(),
          role: "ai",
          content: "Désolé, une erreur est survenue. Réessaie dans un moment.",
          createdAt: Date.now(),
        };
        setMessages((m) => [...m, errMsg]);
      } finally {
        setSending(false);
      }
    },
    [messages, sending, activeId, persistMessages, simulateAIResponse],
  );

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        // In a real app, we'd send audio to a speech-to-text API
        // For now, simulate transcription
        const transcript = "Message vocal transcrit";
        setInput(transcript);
        setVoiceMode(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setVoiceMode(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
  };

  const hasContent = input.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col">
      {/* header */}
      <div className="glass-strong safe-bottom flex items-center gap-3 border-b border-slate-900/10 px-4 py-3 sm:px-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-violet-500 shadow-md">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">Jarvis</h1>
          <p className="text-xs text-slate-500">Assistant IA</p>
        </div>
        <button
          onClick={newChat}
          className="icon-btn h-9 w-9"
          aria-label="Nouvelle discussion"
          title="Nouvelle discussion"
        >
          <Plus size={17} />
        </button>
        <button
          onClick={onMinimize}
          className="icon-btn h-9 w-9"
          aria-label="Réduire"
          title="Réduire"
        >
          <X size={17} />
        </button>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="floaty mb-6 grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-amber-400 to-violet-500 shadow-lg">
                <Sparkles size={36} className="text-white" />
              </div>
              <h2 className="text-xl font-bold">Bonjour {username}</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                Pose-moi une question, demande-moi de créer une tâche, générer une image ou prendre une note.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cx(
                  "msg-in flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cx(
                    "max-w-[80%] px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                    msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai",
                  )}
                >
                  {msg.content}
                  {msg.media?.type === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.media.url}
                      alt=""
                      className="mt-3 rounded-2xl"
                    />
                  )}
                  {msg.media?.type === "video" && (
                    <video
                      src={msg.media.url}
                      controls
                      className="mt-3 rounded-2xl"
                    />
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="msg-in flex justify-start">
              <div className="chat-bubble-ai flex items-center gap-2 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* attach menu */}
      {showAttach && !voiceMode && (
        <>
          <div className="fixed inset-0 z-[95]" onClick={() => setShowAttach(false)} />
          <div className="sheet-in glass-strong absolute bottom-24 left-4 z-[96] w-56 rounded-2xl p-2 shadow-xl sm:left-6">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-900/[0.06]">
              <Plus size={16} /> Fichier local
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-900/[0.06]">
              <Plus size={16} /> Élément du site
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-900/[0.06]">
              <Plus size={16} /> Élément externe
            </button>
          </div>
        </>
      )}

      {/* input bar */}
      <div className="safe-bottom px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {voiceMode ? (
            // Voice dictation mode
            <div className="glass-strong chat-input-bar flex items-center gap-3 rounded-[28px] px-4 py-3.5">
              {/* centered wave bars */}
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="wave-bar"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      animationDuration: `${600 + (i % 4) * 150}ms`,
                    }}
                  />
                ))}
              </div>
              {/* stop button */}
              <button
                onClick={stopRecording}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900/[0.1] transition-colors hover:bg-slate-900/[0.15]"
                aria-label="Arrêter l'enregistrement"
              >
                <Square size={16} className="fill-current text-slate-700" />
              </button>
              {/* send button */}
              <button
                onClick={() => {
                  stopRecording();
                  if (input.trim()) sendMessage(input);
                }}
                className="send-btn-active grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-90"
                aria-label="Envoyer"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            // Text input mode
            <div className="glass-strong chat-input-bar flex items-end gap-2 rounded-[28px] px-3 py-2.5">
              {/* + button */}
              <button
                onClick={() => setShowAttach((s) => !s)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900/[0.06] text-slate-500 transition-colors hover:bg-slate-900/[0.1]"
                aria-label="Joindre"
              >
                <Plus size={20} />
              </button>

              {/* textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris ton message…"
                rows={1}
                className="max-h-30 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed outline-none placeholder:text-slate-400"
                style={{ maxHeight: "120px" }}
              />

              {/* mic */}
              <button
                onClick={() => {
                  setVoiceMode(true);
                  startRecording();
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900/[0.06] text-slate-500 transition-colors hover:bg-slate-900/[0.1]"
                aria-label="Dictée vocale"
              >
                <Mic size={18} />
              </button>

              {/* send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!hasContent}
                className={cx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90",
                  hasContent ? "send-btn-active" : "send-btn-inactive",
                )}
                aria-label="Envoyer"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* dynamic island */}
      {island.element}
    </div>
  );
}
