import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, getClasses, getSubjects, getTeacherClasses, getTeacherSubjects, assignTeacherClass, removeTeacherClass, assignTeacherSubject, removeTeacherSubject } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Phone, BookOpen, GraduationCap, Save } from "lucide-react";

export default function TeachersPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [form, setForm] = useState({ full_name: "", national_id: "", password_hash: "123456", phone: "", notes: "" });

  const { data: teachers = [], isLoading } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", sel?.id], queryFn: () => getTeacherClasses(sel!.id), enabled: !!sel });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", sel?.id], queryFn: () => getTeacherSubjects(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addTeacher(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); setShowAdd(false); setForm({ full_name: "", national_id: "", password_hash: "123456", phone: "", notes: "" }); toast.success("تم إضافة المعلم"); }, onError: () => toast.error("خطأ") });
  const updateMut = useMutation({ mutationFn: ({ id, ...u }: any) => updateTeacher(id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(d); setIsEditing(false); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteTeacher, onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(null); toast.success("تم الحذف"); } });
  const assignClass = useMutation({ mutationFn: (cid: string) => assignTeacherClass(sel!.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }), onError: () => toast.error("خطأ") });
  const removeClass = useMutation({ mutationFn: (cid: string) => removeTeacherClass(sel!.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }) });
  const assignSubj = useMutation({ mutationFn: (sid: string) => assignTeacherSubject(sel!.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }), onError: () => toast.error("خطأ") });
  const removeSubj = useMutation({ mutationFn: (sid: string) => removeTeacherSubject(sel!.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }) });

  const assignedClassIds = new Set((tClasses as any[]).map((tc: any) => tc.class_id));
  const assignedSubjIds = new Set((tSubjects as any[]).map((ts: any) => ts.subject_id));

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">المعلمون</h1><p className="text-muted-foreground text-sm mt-1">{teachers.length} معلم</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />إضافة معلم</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-5"><h2 className="font-heading font-bold text-lg">إضافة معلم جديد</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="رقم الهوية الوطنية *" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <input placeholder="كلمة المرور (افتراضي: 123456)" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <textarea placeholder="ملاحظات إضافية" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm resize-none h-20" />
              <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Save className="w-3.5 h-3.5 inline ml-1" />حفظ</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>المعلم</th><th>رقم الهوية</th><th>الجوال</th><th>الفصول</th><th>المواد</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {(teachers as any[]).map((t: any) => (
              <tr key={t.id} onClick={() => setSel(t)}>
                <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-heading font-bold text-primary">{t.full_name[0]}</div><span className="font-medium">{t.full_name}</span></div></td>
                <td className="text-muted-foreground font-mono text-xs">{t.national_id}</td>
                <td className="text-muted-foreground">{t.phone || "-"}</td>
                <td><span className="badge-info">-</span></td>
                <td><span className="badge-info">-</span></td>
                <td onClick={ev => ev.stopPropagation()}><button onClick={() => deleteMut.mutate(t.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!isLoading && teachers.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد معلمون</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">{sel.full_name[0]}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">{sel.national_id}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsEditing(!isEditing); setEditData({ full_name: sel.full_name, phone: sel.phone || "", notes: sel.notes || "" }); }} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">{isEditing ? "إلغاء" : "تعديل"}</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          {isEditing ? (
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h3 className="font-heading font-semibold text-sm">تعديل البيانات</h3>
              <div><label className="text-xs text-muted-foreground">الاسم</label><input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">الجوال</label><input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">ملاحظات</label><textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm mt-1 resize-none h-20" /></div>
              <button onClick={() => updateMut.mutate({ id: sel.id, ...editData })} className="w-full py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"><Save className="w-4 h-4" />حفظ التغييرات</button>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <h3 className="font-heading font-semibold text-sm">البيانات الشخصية</h3>
              {[["رقم الهوية", sel.national_id], ["الجوال", sel.phone || "غير محدد"], ["ملاحظات", sel.notes || "لا توجد ملاحظات"]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium mt-0.5">{v}</p></div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />الفصول المخصصة</h3>
          <select onChange={e => { if (e.target.value) assignClass.mutate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
            <option value="">+ إضافة فصل</option>
            {(classes as any[]).filter(c => !assignedClassIds.has(c.id)).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="space-y-2">
            {(tClasses as any[]).map((tc: any) => (
              <div key={tc.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                <span className="text-sm">{tc.classes?.name}</span>
                <button onClick={() => removeClass.mutate(tc.class_id)} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {tClasses.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لم يُخصص لأي فصل</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-info" />المواد الدراسية</h3>
          <select onChange={e => { if (e.target.value) assignSubj.mutate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
            <option value="">+ إضافة مادة</option>
            {(subjects as any[]).filter(s => !assignedSubjIds.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="space-y-2">
            {(tSubjects as any[]).map((ts: any) => (
              <div key={ts.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                <div><p className="text-sm">{ts.subjects?.name}</p><p className="text-xs text-muted-foreground">{ts.subjects?.code}</p></div>
                <button onClick={() => removeSubj.mutate(ts.subject_id)} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {tSubjects.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لم تُخصص له مواد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
