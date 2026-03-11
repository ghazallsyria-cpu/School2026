import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLessons, addLesson, updateLesson, deleteLesson, getSubjects, getClasses, getTeacherClasses, getTeacherSubjects } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, X, Eye, EyeOff, Trash2, Save, Bold, Italic, Link2, Image, AlignRight, Minus } from "lucide-react";

export default function TeacherLessons() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:"", subject_id:"", class_id:"", content:"", lesson_order:1 });
  const [editContent, setEditContent] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const { data: lessons = [] } = useQuery({ queryKey: ["teacher-lessons", user?.id], queryFn: () => getLessons({ teacher_id: user?.id }), enabled: !!user?.id });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user?.id });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", user?.id], queryFn: () => getTeacherSubjects(user!.id), enabled: !!user?.id });

  const addMut = useMutation({ mutationFn: () => addLesson({ ...form, teacher_id: user!.id }), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teacher-lessons"] }); setShowAdd(false); setSel(d); setEditContent(d.content||""); toast.success("تم إنشاء الدرس"); } });
  const updateMut = useMutation({ mutationFn: (u: any) => updateLesson(sel.id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teacher-lessons"] }); setSel(d); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteLesson, onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-lessons"] }); setSel(null); toast.success("تم الحذف"); } });
  const togglePub = useMutation({ mutationFn: (l: any) => updateLesson(l.id, { is_published: !l.is_published }), onSuccess: (d, l) => { qc.invalidateQueries({ queryKey: ["teacher-lessons"] }); if(sel?.id===l.id) setSel({...sel,is_published:!sel.is_published}); toast.success(l.is_published?"تم إلغاء النشر":"تم نشر الدرس"); } });

  const insertFormat = (before: string, after = "") => {
    const ta = document.getElementById("tl-editor") as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart; const e = ta.selectionEnd;
    const sel2 = editContent.substring(s, e);
    setEditContent(editContent.substring(0, s) + before + sel2 + after + editContent.substring(e));
  };

  if (!sel) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">دروسي</h1><p className="text-muted-foreground text-sm">{lessons.length} درس</p></div>
        <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>درس جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold">درس جديد</h2><button onClick={()=>setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button></div>
            <div className="space-y-3">
              <input placeholder="عنوان الدرس *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة *</option>{tSubjects.map((ts:any)=><option key={ts.subject_id} value={ts.subject_id}>{ts.subjects?.name}</option>)}</select>
              <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل *</option>{tClasses.map((tc:any)=><option key={tc.class_id} value={tc.class_id}>{tc.classes?.name}</option>)}</select>
              <div className="flex gap-2 justify-end"><button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addMut.mutate()} disabled={!form.title||!form.subject_id||!form.class_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إنشاء</button></div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>العنوان</th><th>المادة</th><th>الفصل</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {(lessons as any[]).map((l:any)=>(
              <tr key={l.id} onClick={()=>{setSel(l);setEditContent(l.content||"");}}>
                <td className="font-medium">{l.title}</td>
                <td className="text-muted-foreground text-sm">{l.subjects?.name}</td>
                <td className="text-muted-foreground text-sm">{l.classes?.name}</td>
                <td><span className={l.is_published?"badge-success":"badge-warning"}>{l.is_published?"منشور":"مسودة"}</span></td>
                <td onClick={e=>e.stopPropagation()}><div className="flex gap-1">
                  <button onClick={()=>togglePub.mutate(l)} className={`p-1.5 rounded ${l.is_published?"text-success hover:bg-success/10":"text-warning hover:bg-warning/10"}`}>{l.is_published?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
                  <button onClick={()=>deleteMut.mutate(l.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </div></td>
              </tr>
            ))}
            {lessons.length===0&&<tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد دروس</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • {sel.classes?.name}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>updateMut.mutate({title:sel.title,content:editContent})} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4 inline ml-1"/>حفظ</button>
          <button onClick={()=>togglePub.mutate(sel)} className={`px-4 py-2 text-sm rounded-lg font-heading border ${sel.is_published?"text-warning border-warning/30":"bg-success text-success-foreground"}`}>{sel.is_published?<><EyeOff className="w-4 h-4 inline ml-1"/>إلغاء النشر</>:<><Eye className="w-4 h-4 inline ml-1"/>نشر</>}</button>
        </div>
      </div>
      <input value={sel.title} onChange={e=>setSel({...sel,title:e.target.value})} className="w-full px-4 py-3 bg-card border rounded-lg font-heading font-bold text-lg"/>
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b flex-wrap" dir="rtl">
          <button onClick={()=>insertFormat("**","**")} className="p-1.5 rounded hover:bg-accent" title="غامق"><Bold className="w-4 h-4"/></button>
          <button onClick={()=>insertFormat("_","_")} className="p-1.5 rounded hover:bg-accent" title="مائل"><Italic className="w-4 h-4"/></button>
          <button onClick={()=>insertFormat("# ")} className="p-1.5 rounded hover:bg-accent text-xs font-heading">H1</button>
          <button onClick={()=>insertFormat("## ")} className="p-1.5 rounded hover:bg-accent text-xs font-heading">H2</button>
          <div className="w-px h-5 bg-border mx-1"/>
          <button onClick={()=>insertFormat("- ")} className="p-1.5 rounded hover:bg-accent"><Minus className="w-4 h-4"/></button>
          <button onClick={()=>insertFormat("> ")} className="p-1.5 rounded hover:bg-accent"><AlignRight className="w-4 h-4"/></button>
          <button onClick={()=>setShowUrl(!showUrl)} className="p-1.5 rounded hover:bg-accent"><Link2 className="w-4 h-4"/></button>
          <button onClick={()=>insertFormat("\n![صورة](",")\n")} className="p-1.5 rounded hover:bg-accent"><Image className="w-4 h-4"/></button>
          {showUrl && <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t">
            <input value={addUrl} onChange={e=>setAddUrl(e.target.value)} placeholder="رابط URL..." className="flex-1 px-3 py-1.5 bg-background border rounded text-xs"/>
            <button onClick={()=>{insertFormat(`[نص](${addUrl})`);setAddUrl("");setShowUrl(false);}} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs">إدراج</button>
          </div>}
        </div>
        <textarea id="tl-editor" value={editContent} onChange={e=>setEditContent(e.target.value)} placeholder="اكتب محتوى الدرس هنا..." className="w-full px-4 py-4 bg-transparent text-sm resize-none focus:outline-none min-h-[350px] font-mono leading-relaxed" dir="rtl"/>
      </div>
    </div>
  );
}
