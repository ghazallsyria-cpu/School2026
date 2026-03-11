import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations, getMessagesBetween, sendMessage, getAllUsers, markMessagesRead, getAllMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Search, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ROLE_LABEL: Record<string,string> = { admin:"مدير", teacher:"معلم", student:"طالب", parent:"ولي أمر" };
const ROLE_COLOR: Record<string,string> = { admin:"bg-destructive/10 text-destructive", teacher:"bg-info/10 text-info", student:"bg-success/10 text-success", parent:"bg-warning/10 text-warning" };

export default function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selUser, setSelUser] = useState<any>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [adminView, setAdminView] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: allUsers = [] } = useQuery({ queryKey: ["all-users"], queryFn: getAllUsers });
  const { data: conversations = [] } = useQuery({ queryKey: ["conversations", user?.id], queryFn: () => getConversations(user!.id), enabled: !!user?.id, refetchInterval: 5000 });
  const { data: messages = [] } = useQuery({ queryKey: ["messages", user?.id, selUser?.id], queryFn: () => getMessagesBetween(user!.id, selUser!.id), enabled: !!user?.id && !!selUser?.id, refetchInterval: 3000 });
  const { data: allMessages = [] } = useQuery({ queryKey: ["all-messages"], queryFn: getAllMessages, enabled: user?.role==="admin" && adminView, refetchInterval: 10000 });

  const sendMut = useMutation({
    mutationFn: () => sendMessage({ sender_id: user!.id, receiver_id: selUser!.id, content: text.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["conversations"] }); setText(""); }
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (!user?.id || !selUser?.id) return;
    markMessagesRead(user.id, selUser.id);
  }, [selUser?.id, messages.length]);

  // Build contact list from conversations
  const contacts = (() => {
    const seen = new Set<string>();
    const list: any[] = [];
    (conversations as any[]).forEach(m => {
      const other = m.sender_id === user?.id ? m.receiver : m.sender;
      if (other && !seen.has(other.id)) { seen.add(other.id); list.push(other); }
    });
    return list;
  })();

  const filtered = allUsers.filter((u: any) => u.id !== user?.id && (search === "" || u.full_name.includes(search)));
  const unreadCount = (conversations as any[]).filter(m => m.receiver_id === user?.id && !m.is_read).length;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="w-72 border-l flex flex-col bg-background shrink-0">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن مستخدم..." className="flex-1 bg-transparent text-sm outline-none" dir="rtl" />
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="px-3 py-2 border-b">
            <button onClick={() => setAdminView(!adminView)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-heading transition-colors ${adminView ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground"}`}>
              <Eye className="w-3.5 h-3.5" /> مراقبة كل الرسائل
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto" dir="rtl">
          {search ? (
            <div>
              <p className="text-xs text-muted-foreground px-4 py-2 sticky top-0 bg-background font-heading">نتائج البحث</p>
              {filtered.map((u: any) => (
                <button key={u.id} onClick={() => { setSelUser(u); setAdminView(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-accent/50 transition-colors ${selUser?.id === u.id ? "bg-primary/10" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-heading font-bold flex items-center justify-center shrink-0">{u.full_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{u.full_name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLOR[u.role]||"bg-accent"}`}>{ROLE_LABEL[u.role]||u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground px-4 py-2 sticky top-0 bg-background font-heading">المحادثات</p>
              {contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">ابحث عن مستخدم لبدء محادثة</p>
              ) : contacts.map((c: any) => {
                const lastMsg = (conversations as any[]).find(m => m.sender_id === c.id || m.receiver_id === c.id);
                return (
                  <button key={c.id} onClick={() => { setSelUser(c); setAdminView(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-accent/50 transition-colors ${selUser?.id === c.id ? "bg-primary/10" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-heading font-bold flex items-center justify-center shrink-0">{c.full_name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg?.content || ""}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {adminView && user?.role === "admin" ? (
          <div className="flex-1 overflow-y-auto p-4" dir="rtl">
            <h3 className="font-heading font-bold text-sm mb-4 sticky top-0 bg-card pb-2">جميع الرسائل ({(allMessages as any[]).length})</h3>
            <div className="space-y-2">
              {(allMessages as any[]).map((m: any) => (
                <div key={m.id} className="bg-background rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-primary">{m.sender?.full_name}</span>
                    <span className="text-muted-foreground text-xs">←</span>
                    <span className="font-medium">{m.receiver?.full_name}</span>
                    <span className="text-muted-foreground text-xs mr-auto">{new Date(m.created_at).toLocaleString("ar")}</span>
                  </div>
                  <p className="text-muted-foreground">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : selUser ? (
          <>
            <div className="px-5 py-3 border-b flex items-center gap-3" dir="rtl">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-heading font-bold flex items-center justify-center">{selUser.full_name?.charAt(0)}</div>
              <div><p className="font-heading font-semibold text-sm">{selUser.full_name}</p><span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLOR[selUser.role]||"bg-accent"}`}>{ROLE_LABEL[selUser.role]||selUser.role}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" dir="rtl">
              {(messages as any[]).map((m: any) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-accent rounded-tl-sm"}`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString("ar",{hour:"2-digit",minute:"2-digit"})}</p>
                    </div>
                  </div>
                );
              })}
              {(messages as any[]).length === 0 && <p className="text-center text-muted-foreground text-sm py-8">ابدأ المحادثة</p>}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t" dir="rtl">
              <div className="flex items-end gap-2">
                <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) sendMut.mutate(); } }} placeholder="اكتب رسالة..." className="flex-1 px-4 py-2.5 bg-background border rounded-xl text-sm resize-none max-h-28 focus:outline-none focus:ring-2 focus:ring-ring" rows={1} />
                <button onClick={() => { if (text.trim()) sendMut.mutate(); }} disabled={!text.trim()} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 shrink-0"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-16 h-16 opacity-20" />
            <p className="font-heading">اختر محادثة أو ابحث عن مستخدم</p>
          </div>
        )}
      </div>
    </div>
  );
}
