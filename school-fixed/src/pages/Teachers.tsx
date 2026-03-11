import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, getClasses, getSubjects, getTeacherClasses, getTeacherSubjects, assignTeacherClass, removeTeacherClass, assignTeacherSubject, removeTeacherSubject } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Trash2, Save, Phone, User, BookOpen, GraduationCap } from "lucide-react";

const EMPTY = { full_name:"", national_id:"", password_hash:"123456", phone:"", notes:"" };

export default function TeachersPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editForm, setEditForm] = useState<any>(null);

  const { data: teachers = [], isLoading } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", sel?.id], queryFn: () => getTeacherClasses(sel!.id), enabled: !!sel });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", sel?.id], queryFn: () => getTeacherSubjects(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addTeacher(form), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teachers"] }); setShowAdd(false); setSel(d); setEditForm({ ...d }); toast.success("تم إضافة المعلم"); }, onError: () => toast.error("رقم الهوية مستخدم مسبقاً") });
  const updateMut = useMutation({ mutationFn: () => updateTeacher(sel.id, editForm), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(d); setEditForm({ ...d }); toast.success("تم حفظ التغييرات"); } });
  const deleteMut = useMutation({ mutationFn: deleteTeacher, onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); setSel(null); toast.success("تم الحذف"); } });
  const addClassMut = useMutation({ mutationFn: (cid: string) => assignTeacherClass(sel.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }), onError: () => toast.error("مسند مسبقاً") });
  const remClassMut = useMutation({ mutationFn: (cid: string) => removeTeacherClass(sel.id, cid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-classes", sel?.id] }) });
  const addSubMut = useMutation({ mutationFn: (sid: string) => assignTeacherSubject(sel.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }), onError: () => toast.error("مسند مسبقاً") });
  const remSubMut = useMutation({ mutationFn: (sid: string) => removeTeacherSubject(sel.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-subjects", sel?.id] }) });

  const assignedClassIds = new Set(tClasses.map((tc: any) => tc.class_id));
  const assignedSubIds = new Set(tSubjects.map((ts: any) => ts.subject_id));

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">المعلمون</h1><p className="text-muted-foreground text-sm mt-1">{teachers.length} معلم</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />معلم جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">إضافة معلم جديد</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="رقم الهوية *" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm" />
                <input placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm" />
              </div>
              <input placeholder="كلمة المرور (افتراضي: 123456)" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm resize-none h-20" />
              <p className="text-xs text-muted-foreground bg-accent px-3 py-2 rounded-lg">💡 يمكن تعيين الصفوف والمواد بعد الحفظ من صفحة المعلم</p>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                <button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4 inline ml-1" />حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>الاسم</th><th>رقم الهوية</th><th>الجوال</th><th>المواد</th><th>الفصول</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {teachers.map((t: any) => (
              <tr key={t.id} onClick={() => { setSel(t); setEditForm({ ...t }); }}>
                <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center">{t.full_name?.charAt(0)}</div><span className="font-medium">{t.full_name}</span></div></td>
                <td className="text-muted-foreground text-xs">{t.national_id}</td>
                <td className="text-muted-foreground text-xs">{t.phone || "-"}</td>
                <td className="text-muted-foreground text-xs">-</td>
                <td className="text-muted-foreground text-xs">-</td>
                <td onClick={e => e.stopPropagation()}><button onClick={() => deleteMut.mutate(t.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!isLoading && teachers.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد معلمون</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-heading font-bold text-lg flex items-center justify-center">{sel.full_name?.charAt(0)}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">{sel.national_id}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate()} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Save className="w-4 h-4" />حفظ التغييرات</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg text-destructive border border-destructive/20 hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Edit Info */}
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" />البيانات الشخصية</h3>
          {editForm && (
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground block mb-1">الاسم الكامل</label><input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">رقم الهوية</label><input value={editForm.national_id} onChange={e => setEditForm({ ...editForm, national_id: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">رقم الجوال</label><input value={editForm.phone || ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="05xxxxxxxx" className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">كلمة المرور الجديدة</label><input type="password" placeholder="اتركه فارغاً للإبقاء" onChange={e => e.target.value && setEditForm({ ...editForm, password_hash: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">ملاحظات</label><textarea value={editForm.notes || ""} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none h-20" /></div>
            </div>
          )}
        </div>

        {/* Subjects */}
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-info" />المواد الدراسية</h3>
          <div className="flex flex-wrap gap-2">
            {tSubjects.map((ts: any) => (
              <span key={ts.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info/10 text-info text-xs rounded-full">
                {ts.subjects?.name}
                <button onClick={() => remSubMut.mutate(ts.subject_id)} className="hover:bg-info/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <select onChange={e => { if (e.target.value) { addSubMut.mutate(e.target.value); e.target.value = ""; } }} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
            <option value="">+ إضافة مادة</option>
            {subjects.filter((s: any) => !assignedSubIds.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Classes */}
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-success" />الفصول المسندة</h3>
          <div className="flex flex-wrap gap-2">
            {tClasses.map((tc: any) => (
              <span key={tc.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs rounded-full">
                {tc.classes?.name}
                <button onClick={() => remClassMut.mutate(tc.class_id)} className="hover:bg-success/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <select onChange={e => { if (e.target.value) { addClassMut.mutate(e.target.value); e.target.value = ""; } }} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
            <option value="">+ إسناد فصل</option>
            {classes.filter((c: any) => !assignedClassIds.has(c.id)).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
