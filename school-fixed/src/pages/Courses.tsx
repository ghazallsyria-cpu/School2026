import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubjects, addSubject, updateSubject, deleteSubject, getSubjectStats, getTeachersBySubject } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Trash2, Save, BookOpen, Users, GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CoursesPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", code:"" });
  const [editForm, setEditForm] = useState<any>(null);

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: stats } = useQuery({ queryKey: ["subject-stats", sel?.id], queryFn: () => getSubjectStats(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addSubject(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setShowAdd(false); toast.success("تمت الإضافة"); }, onError: () => toast.error("الرمز مستخدم") });
  const updateMut = useMutation({ mutationFn: () => updateSubject(sel.id, editForm), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["subjects"] }); setSel(d); setEditForm({ ...d }); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteSubject, onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setSel(null); toast.success("تم الحذف"); } });

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">المقررات الدراسية</h1><p className="text-muted-foreground text-sm mt-1">{subjects.length} مادة</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>مادة جديدة</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">مادة جديدة</h2><button onClick={()=>setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button></div>
            <div className="space-y-3">
              <input placeholder="اسم المادة *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <input placeholder="رمز المادة * (مثال: MATH101)" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <div className="flex gap-2 justify-end"><button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addMut.mutate()} disabled={!form.name||!form.code} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-muted-foreground text-sm col-span-3 text-center py-8">جارٍ التحميل...</p>}
        {subjects.map((s: any) => (
          <button key={s.id} onClick={() => { setSel(s); setEditForm({ ...s }); }} className="bg-card rounded-xl border p-5 text-right hover:border-primary hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BookOpen className="w-5 h-5"/></div>
              <span className="text-xs bg-accent px-2 py-1 rounded font-mono">{s.code}</span>
            </div>
            <h3 className="font-heading font-bold">{s.name}</h3>
          </button>
        ))}
        {!isLoading && subjects.length === 0 && <p className="text-center text-muted-foreground col-span-3 py-12">لا توجد مواد دراسية</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BookOpen className="w-5 h-5"/></div>
          <div><h2 className="font-heading font-bold">{sel.name}</h2><p className="text-xs text-muted-foreground font-mono">{sel.code}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>updateMut.mutate()} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4"/>حفظ</button>
          <button onClick={()=>deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {l:"الطلاب",v:stats?.totalStudents??"-",c:"text-primary"},
          {l:"معدل الدرجات",v:stats?`${stats.avgGrade}%`:"-",c:"text-success"},
          {l:"الدروس",v:stats?.lessonCount??"-",c:"text-info"},
          {l:"الاختبارات",v:stats?.examCount??"-",c:"text-warning"},
        ].map(s=><div key={s.l} className="bg-card rounded-lg border p-4 text-center"><p className={`text-2xl font-bold font-heading ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold">تعديل المادة</h3>
          {editForm && <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground block mb-1">اسم المادة</label><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">رمز المادة</label><input value={editForm.code} onChange={e=>setEditForm({...editForm,code:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
          </div>}
          {stats && <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">ناجح</span><span className="text-success font-medium">{stats.passCount}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">راسب</span><span className="text-destructive font-medium">{stats.failCount}</span></div>
          </div>}
        </div>
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-info"/>المعلمون ({stats?.teachers?.length||0})</h3>
          {stats?.teachers?.length === 0 ? <p className="text-muted-foreground text-sm">لا يوجد معلمون مسندون</p> : (
            <div className="space-y-2">
              {stats?.teachers?.map((t: any) => (
                <div key={t.teacher_id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-info/10 text-info text-sm font-heading font-bold flex items-center justify-center">{t.teacher?.full_name?.charAt(0)}</div>
                  <span className="text-sm font-medium">{t.teacher?.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
