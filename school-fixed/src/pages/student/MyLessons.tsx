import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLessons } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Eye, ChevronRight, X } from "lucide-react";

export default function MyLessons() {
  const { user } = useAuth();
  const [sel, setSel] = useState<any>(null);
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["my-lessons", user?.class_id],
    queryFn: () => getLessons({ class_id: user!.class_id! }),
    enabled: !!user?.class_id,
    select: (data) => data?.filter((l: any) => l.is_published) ?? []
  });

  const renderContent = (content: string) => content.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold font-heading mt-4">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold font-heading mt-3">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold font-heading mt-2">{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <p key={i} className="flex items-start gap-2 my-1"><span className="text-primary mt-0.5 shrink-0">•</span><span>{line.slice(2)}</span></p>;
    if (line.startsWith("> ")) return <blockquote key={i} className="border-r-4 border-primary pr-3 text-muted-foreground italic my-2">{line.slice(2)}</blockquote>;
    if (line.startsWith("---")) return <hr key={i} className="border-border my-3"/>;
    if (!line) return <div key={i} className="h-2"/>;
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const italic = bold.replace(/_(.*?)_/g, '<em>$1</em>');
    const links = italic.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>');
    const images = links.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2"/>');
    return <p key={i} className="my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: images }}/>;
  });

  if (sel) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={()=>setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
        <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • الدرس {sel.lesson_order}</p></div>
      </div>
      <div className="bg-card rounded-lg border p-6 text-sm leading-loose" dir="rtl">
        {sel.content ? renderContent(sel.content) : <p className="text-muted-foreground text-center py-8">لا يوجد محتوى لهذا الدرس بعد</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-bold">دروسي</h1><p className="text-muted-foreground text-sm mt-1">{lessons.length} درس منشور</p></div>
      {!user?.class_id && <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-warning">لم يتم تعيينك في فصل دراسي بعد. تواصل مع المدير.</div>}
      {isLoading && <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>}
      {!isLoading && lessons.length === 0 && user?.class_id && <div className="text-center py-12 text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد دروس منشورة لفصلك حتى الآن</p></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(lessons as any[]).map((l: any) => (
          <button key={l.id} onClick={()=>setSel(l)} className="bg-card rounded-xl border p-5 text-right hover:border-primary hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-heading font-bold text-lg flex items-center justify-center shrink-0">{l.lesson_order}</div>
              <span className="badge-success"><Eye className="w-3 h-3 inline ml-1"/>منشور</span>
            </div>
            <h3 className="font-heading font-semibold text-sm">{l.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{l.subjects?.name}</p>
            <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity"><span>اقرأ الدرس</span><ChevronRight className="w-3 h-3"/></div>
          </button>
        ))}
      </div>
    </div>
  );
}
