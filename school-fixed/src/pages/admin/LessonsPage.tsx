import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLessons, addLesson, updateLesson, deleteLesson, getSubjects, getClasses, getTeachers } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, Bold, Italic, Link2, Image, AlignRight, AlignCenter, Minus, Type } from "lucide-react";

const EMPTY_LESSON = { title:"", subject_id:"", class_id:"", teacher_id:"", content:"", lesson_order:1, is_published:false };

export default function LessonsPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_LESSON });
  const [filterClass, setFilterClass] = useState("");
  const [editContent, setEditContent] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const { data: lessons = [], isLoading } = useQuery({ queryKey: ["lessons"], queryFn: () => getLessons() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });

  const addMut = useMutation({ mutationFn: () => addLesson(form), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["lessons"] }); setShowAdd(false); setSel(d); setEditContent(d.content || ""); toast.success("تم إنشاء الدرس"); }, onError: () => toast.error("خطأ") });
  const updateMut = useMutation({ mutationFn: (u: any) => updateLesson(sel.id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["lessons"] }); setSel(d); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteLesson, onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); setSel(null); toast.success("تم الحذف"); } });
  const togglePub = useMutation({ mutationFn: (l: any) => updateLesson(l.id, { is_published: !l.is_published }), onSuccess: (d, l) => { qc.invalidateQueries({ queryKey: ["lessons"] }); if (sel?.id === l.id) setSel({ ...sel, is_published: !sel.is_published }); toast.success(l.is_published ? "تم إلغاء النشر" : "تم نشر الدرس للطلاب"); } });

  const insertFormat = (before: string, after = "") => {
    const ta = document.getElementById("lesson-editor") as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const selected = editContent.substring(start, end);
    const newText = editContent.substring(0, start) + before + selected + after + editContent.substring(end);
    setEditContent(newText);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const filtered = filterClass ? lessons.filter((l: any) => l.class_id === filterClass) : lessons;

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الدروس</h1><p className="text-muted-foreground text-sm mt-1">{lessons.length} درس</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />درس جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">درس جديد</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="عنوان الدرس *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة *</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل *</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المعلم *</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
              <div className="flex items-center gap-2"><input type="number" min="1" value={form.lesson_order} onChange={e => setForm({ ...form, lesson_order: +e.target.value })} className="w-24 px-3 py-2.5 bg-background border rounded-lg text-sm" /><span className="text-xs text-muted-foreground">ترتيب الدرس</span></div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                <button onClick={() => addMut.mutate()} disabled={!form.title || !form.subject_id || !form.class_id || !form.teacher_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إنشاء الدرس</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل الفصول</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>#</th><th>عنوان الدرس</th><th>المادة</th><th>الفصل</th><th>المعلم</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {filtered.map((l: any) => (
              <tr key={l.id} onClick={() => { setSel(l); setEditContent(l.content || ""); }}>
                <td className="text-muted-foreground text-xs">{l.lesson_order}</td>
                <td className="font-medium">{l.title}</td>
                <td className="text-muted-foreground">{l.subjects?.name || "-"}</td>
                <td className="text-muted-foreground">{l.classes?.name || "-"}</td>
                <td className="text-muted-foreground">{l.teacher?.full_name || "-"}</td>
                <td><span className={l.is_published ? "badge-success" : "badge-warning"}>{l.is_published ? "منشور" : "مسودة"}</span></td>
                <td onClick={e => e.stopPropagation()}><div className="flex gap-1">
                  <button onClick={() => togglePub.mutate(l)} className={`p-1.5 rounded ${l.is_published ? "text-success hover:bg-success/10" : "text-warning hover:bg-warning/10"}`}>{l.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                  <button onClick={() => deleteMut.mutate(l.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد دروس</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • {sel.classes?.name}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate({ title: sel.title, content: editContent })} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">حفظ التغييرات</button>
          <button onClick={() => togglePub.mutate(sel)} className={`px-4 py-2 text-sm rounded-lg font-heading border transition-colors ${sel.is_published ? "text-warning border-warning/30 hover:bg-warning/10" : "bg-success text-success-foreground hover:bg-success/90"}`}>
            {sel.is_published ? <span className="flex items-center gap-1"><EyeOff className="w-4 h-4" />إلغاء النشر</span> : <span className="flex items-center gap-1"><Eye className="w-4 h-4" />نشر للطلاب</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <input value={sel.title} onChange={e => setSel({ ...sel, title: e.target.value })} className="w-full px-4 py-3 bg-card border rounded-lg font-heading font-bold text-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="عنوان الدرس" />
          
          {/* Toolbar */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2 border-b flex-wrap" dir="rtl">
              <span className="text-xs text-muted-foreground font-heading ml-1">تنسيق:</span>
              <button onClick={() => insertFormat("**", "**")} className="p-1.5 rounded hover:bg-accent text-sm font-bold" title="غامق"><Bold className="w-4 h-4" /></button>
              <button onClick={() => insertFormat("_", "_")} className="p-1.5 rounded hover:bg-accent" title="مائل"><Italic className="w-4 h-4" /></button>
              <button onClick={() => insertFormat("# ")} className="p-1.5 rounded hover:bg-accent text-xs font-heading" title="عنوان كبير">H1</button>
              <button onClick={() => insertFormat("## ")} className="p-1.5 rounded hover:bg-accent text-xs font-heading" title="عنوان متوسط">H2</button>
              <button onClick={() => insertFormat("### ")} className="p-1.5 rounded hover:bg-accent text-xs font-heading" title="عنوان صغير">H3</button>
              <div className="w-px h-5 bg-border mx-1" />
              <button onClick={() => insertFormat("- ")} className="p-1.5 rounded hover:bg-accent" title="قائمة نقطية"><Minus className="w-4 h-4" /></button>
              <button onClick={() => insertFormat("1. ")} className="p-1.5 rounded hover:bg-accent text-xs" title="قائمة رقمية">١٢٣</button>
              <div className="w-px h-5 bg-border mx-1" />
              <button onClick={() => insertFormat("> ")} className="p-1.5 rounded hover:bg-accent" title="اقتباس"><AlignRight className="w-4 h-4" /></button>
              <button onClick={() => insertFormat("---\n")} className="p-1.5 rounded hover:bg-accent text-xs" title="خط فاصل">—</button>
              <button onClick={() => insertFormat("`", "`")} className="p-1.5 rounded hover:bg-accent font-mono text-xs" title="كود">{ }</button>
              <div className="w-px h-5 bg-border mx-1" />
              <button onClick={() => setShowUrlInput(!showUrlInput)} className="p-1.5 rounded hover:bg-accent" title="رابط"><Link2 className="w-4 h-4" /></button>
              <button onClick={() => insertFormat("\n![صورة](", ")\n")} className="p-1.5 rounded hover:bg-accent" title="صورة"><Image className="w-4 h-4" /></button>
              {showUrlInput && (
                <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t">
                  <input value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="رابط URL..." className="flex-1 px-3 py-1.5 bg-background border rounded text-xs" />
                  <button onClick={() => { insertFormat(`[نص الرابط](${addUrl})`); setAddUrl(""); setShowUrlInput(false); }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs">إدراج</button>
                </div>
              )}
            </div>
            <textarea
              id="lesson-editor"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              placeholder="اكتب محتوى الدرس هنا... يمكنك استخدام أدوات التنسيق أعلاه أو كتابة Markdown مباشرة"
              className="w-full px-4 py-4 bg-transparent text-sm resize-none focus:outline-none min-h-[400px] font-mono leading-relaxed"
              dir="rtl"
            />
          </div>

          {/* Preview */}
          {editContent && (
            <div className="bg-card border rounded-lg p-5">
              <p className="text-xs text-muted-foreground font-heading mb-3 flex items-center gap-1"><Eye className="w-3.5 h-3.5" />معاينة</p>
              <div className="prose-like text-sm leading-relaxed space-y-2" dir="rtl">
                {editContent.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold font-heading">{line.slice(2)}</h1>;
                  if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold font-heading">{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold font-heading">{line.slice(4)}</h3>;
                  if (line.startsWith("- ")) return <p key={i} className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>{line.slice(2)}</span></p>;
                  if (line.startsWith("> ")) return <blockquote key={i} className="border-r-4 border-primary pr-3 text-muted-foreground italic">{line.slice(2)}</blockquote>;
                  if (line.startsWith("---")) return <hr key={i} className="border-border" />;
                  if (!line) return <div key={i} className="h-2" />;
                  const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  const italic = bold.replace(/_(.*?)_/g, '<em>$1</em>');
                  const code = italic.replace(/`(.*?)`/g, '<code class="bg-accent px-1 rounded text-xs font-mono">$1</code>');
                  const links = code.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>');
                  const images = links.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />');
                  return <p key={i} dangerouslySetInnerHTML={{ __html: images }} />;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">تفاصيل الدرس</h3>
            <div className="space-y-2 text-sm">
              {[["المادة", sel.subjects?.name], ["الفصل", sel.classes?.name], ["المعلم", sel.teacher?.full_name]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "-"}</span></div>
              ))}
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">ترتيب الدرس</label>
              <input type="number" min="1" value={sel.lesson_order} onChange={e => setSel({ ...sel, lesson_order: +e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-heading font-semibold text-sm mb-2">دليل التنسيق</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {[["**نص**", "غامق"],["_نص_", "مائل"],["# نص", "عنوان كبير"],["## نص", "عنوان متوسط"],["- نص", "قائمة نقطية"],["1. نص", "قائمة رقمية"],["> نص", "اقتباس"],["![وصف](رابط)", "صورة"],["[نص](رابط)", "رابط"]].map(([code, label]) => (
                <div key={label as string} className="flex gap-2"><code className="bg-accent px-1.5 py-0.5 rounded font-mono text-xs">{code}</code><span>{label}</span></div>
              ))}
            </div>
          </div>
          <button onClick={() => deleteMut.mutate(sel.id)} className="w-full py-2.5 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف الدرس</button>
        </div>
      </div>
    </div>
  );
}
