import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParents, addParent, updateParent, deleteParent, getStudents, getParentChildren, linkParentToStudent, removeParentLink } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Trash2, Save, UserPlus, Link2 } from "lucide-react";

export default function ParentsPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name:"", national_id:"", password_hash:"123456", phone:"" });
  const [editForm, setEditForm] = useState<any>(null);

  const { data: parents = [], isLoading } = useQuery({ queryKey: ["parents"], queryFn: getParents });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const { data: children = [] } = useQuery({ queryKey: ["parent-children", sel?.id], queryFn: () => getParentChildren(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addParent(form), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["parents"] }); setShowAdd(false); setSel(d); setEditForm({ ...d }); toast.success("تم إضافة ولي الأمر"); }, onError: () => toast.error("رقم الهوية مستخدم مسبقاً") });
  const updateMut = useMutation({ mutationFn: () => updateParent(sel.id, editForm), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["parents"] }); setSel(d); setEditForm({ ...d }); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteParent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); setSel(null); toast.success("تم الحذف"); } });
  const linkMut = useMutation({ mutationFn: (sid: string) => linkParentToStudent(sel.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-children", sel?.id] }), onError: () => toast.error("مرتبط مسبقاً") });
  const unlinkMut = useMutation({ mutationFn: (sid: string) => removeParentLink(sel.id, sid), onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-children", sel?.id] }) });

  const linkedIds = new Set(children.map((c: any) => c.student_id));

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">أولياء الأمور</h1><p className="text-muted-foreground text-sm mt-1">{parents.length} ولي أمر</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />ولي أمر جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">إضافة ولي أمر</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="رقم الهوية *" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm" />
                <input placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="px-4 py-2.5 bg-background border rounded-lg text-sm" />
              </div>
              <input placeholder="كلمة المرور (افتراضي: 123456)" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                <button onClick={() => addMut.mutate()} disabled={!form.full_name || !form.national_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>الاسم</th><th>رقم الهوية</th><th>الجوال</th><th>عدد الطلاب</th><th>إجراءات</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {parents.map((p: any) => (
              <tr key={p.id} onClick={() => { setSel(p); setEditForm({ ...p }); }}>
                <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-warning/10 text-warning text-xs font-heading font-bold flex items-center justify-center">{p.full_name?.charAt(0)}</div><span className="font-medium">{p.full_name}</span></div></td>
                <td className="text-muted-foreground text-xs">{p.national_id}</td>
                <td className="text-muted-foreground text-xs">{p.phone || "-"}</td>
                <td className="text-muted-foreground text-xs">-</td>
                <td onClick={e => e.stopPropagation()}><button onClick={() => deleteMut.mutate(p.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!isLoading && parents.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد أولياء أمور</td></tr>}
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
          <div className="w-10 h-10 rounded-full bg-warning/10 text-warning font-heading font-bold text-lg flex items-center justify-center">{sel.full_name?.charAt(0)}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">{sel.national_id}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate()} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" />حفظ</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold">البيانات الشخصية</h3>
          {editForm && (
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground block mb-1">الاسم الكامل</label><input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">رقم الهوية</label><input value={editForm.national_id} onChange={e => setEditForm({ ...editForm, national_id: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">رقم الجوال</label><input value={editForm.phone || ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">كلمة المرور الجديدة</label><input type="password" placeholder="اتركه فارغاً للإبقاء" onChange={e => e.target.value && setEditForm({ ...editForm, password_hash: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
            </div>
          )}
        </div>
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />ربط بطلاب ({children.length})</h3>
          <div className="space-y-2">
            {children.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{c.student?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{c.student?.classes?.name || "بدون فصل"}</p>
                </div>
                <button onClick={() => unlinkMut.mutate(c.student_id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <select onChange={e => { if (e.target.value) { linkMut.mutate(e.target.value); e.target.value = ""; } }} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
            <option value="">+ ربط بطالب</option>
            {students.filter((s: any) => !linkedIds.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.full_name} - {s.classes?.name || "بدون فصل"}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
