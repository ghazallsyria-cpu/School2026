import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, addStudent, updateStudent, deleteStudent, getClasses, getGradesByStudent, getAttendanceByStudent } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Trash2, Save, Search, GraduationCap } from "lucide-react";

export default function StudentsPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name:"", national_id:"", password_hash:"123456", class_id:"" });
  const [editForm, setEditForm] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: grades = [] } = useQuery({ queryKey: ["student-grades", sel?.id], queryFn: () => getGradesByStudent(sel!.id), enabled: !!sel });
  const { data: attendance = [] } = useQuery({ queryKey: ["student-attendance", sel?.id], queryFn: () => getAttendanceByStudent(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addStudent(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); setShowAdd(false); toast.success("تم إضافة الطالب"); }, onError: () => toast.error("رقم الهوية مستخدم") });
  const updateMut = useMutation({ mutationFn: () => updateStudent(sel.id, editForm), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["students"] }); setSel(d); setEditForm({ ...d }); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteStudent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); setSel(null); toast.success("تم الحذف"); } });

  const filtered = students.filter((s: any) => {
    const matchSearch = !search || s.full_name?.includes(search) || s.national_id?.includes(search);
    const matchClass = !filterClass || s.class_id === filterClass;
    return matchSearch && matchClass;
  });

  // Group by class
  const groups = classes.reduce((g: any, c: any) => {
    g[c.id] = { class: c, students: filtered.filter((s: any) => s.class_id === c.id) };
    return g;
  }, {} as Record<string, { class: any; students: any[] }>);
  const ungrouped = filtered.filter((s: any) => !s.class_id);

  const attRate = attendance.length > 0 ? ((attendance as any[]).filter(a => a.status==="حاضر").length / attendance.length * 100).toFixed(0) : "0";

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الطلاب</h1><p className="text-muted-foreground text-sm mt-1">{students.length} طالب</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>طالب جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">إضافة طالب</h2><button onClick={()=>setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button></div>
            <div className="space-y-3">
              <input placeholder="الاسم الكامل *" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="رقم الهوية *" value={form.national_id} onChange={e=>setForm({...form,national_id:e.target.value})} className="px-4 py-2.5 bg-background border rounded-lg text-sm"/>
                <input placeholder="كلمة المرور" value={form.password_hash} onChange={e=>setForm({...form,password_hash:e.target.value})} className="px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              </div>
              <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل (اختياري)</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <div className="flex gap-2 justify-end"><button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addMut.mutate()} disabled={!form.full_name||!form.national_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-card border rounded-lg flex-1 max-w-xs">
          <Search className="w-4 h-4 text-muted-foreground shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none flex-1"/>
        </div>
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">كل الفصول</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>

      {filterClass ? (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="data-table">
            <thead><tr><th>#</th><th>الاسم</th><th>رقم الهوية</th><th>الفصل</th><th>إجراءات</th></tr></thead>
            <tbody>
              {isLoading&&<tr><td colSpan={5} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
              {filtered.map((s:any,i:number)=>(
                <tr key={s.id} onClick={()=>{setSel(s);setEditForm({...s});}}>
                  <td className="text-muted-foreground text-xs">{i+1}</td>
                  <td><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center">{s.full_name?.charAt(0)}</div><span className="font-medium">{s.full_name}</span></div></td>
                  <td className="text-muted-foreground text-xs">{s.national_id}</td>
                  <td className="text-muted-foreground text-xs">{s.classes?.name||"-"}</td>
                  <td onClick={e=>e.stopPropagation()}><button onClick={()=>deleteMut.mutate(s.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.values(groups).filter((g: any) => g.students.length > 0).map((g: any) => (
            <div key={g.class.id}>
              <h2 className="font-heading font-semibold text-sm text-primary mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4"/>{g.class.name} <span className="text-muted-foreground font-normal">({g.students.length} طالب)</span></h2>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>#</th><th>الاسم</th><th>رقم الهوية</th><th>إجراءات</th></tr></thead>
                  <tbody>{g.students.map((s:any,i:number)=>(
                    <tr key={s.id} onClick={()=>{setSel(s);setEditForm({...s});}}>
                      <td className="text-muted-foreground text-xs">{i+1}</td>
                      <td><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center">{s.full_name?.charAt(0)}</div><span className="font-medium">{s.full_name}</span></div></td>
                      <td className="text-muted-foreground text-xs">{s.national_id}</td>
                      <td onClick={e=>e.stopPropagation()}><button onClick={()=>deleteMut.mutate(s.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-sm text-muted-foreground mb-2">بدون فصل ({ungrouped.length})</h2>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="data-table"><thead><tr><th>الاسم</th><th>رقم الهوية</th><th>إجراءات</th></tr></thead>
                  <tbody>{ungrouped.map((s:any)=>(
                    <tr key={s.id} onClick={()=>{setSel(s);setEditForm({...s});}}><td className="font-medium">{s.full_name}</td><td className="text-muted-foreground text-xs">{s.national_id}</td><td onClick={e=>e.stopPropagation()}><button onClick={()=>deleteMut.mutate(s.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button></td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div className="w-10 h-10 rounded-full bg-success/10 text-success font-heading font-bold text-lg flex items-center justify-center">{sel.full_name?.charAt(0)}</div>
          <div><h2 className="font-heading font-bold">{sel.full_name}</h2><p className="text-xs text-muted-foreground">{sel.classes?.name||"بدون فصل"}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>updateMut.mutate()} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4"/>حفظ</button>
          <button onClick={()=>deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5">حذف</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {l:"الحضور",v:`${attRate}%`,c:"text-success"},
          {l:"غياب",v:(attendance as any[]).filter(a=>a.status==="غائب").length,c:"text-destructive"},
          {l:"درجات مسجلة",v:grades.length,c:"text-primary"},
          {l:"الفصل",v:sel.classes?.name||"-",c:"text-info"},
        ].map(s=><div key={s.l} className="bg-card rounded-lg border p-4 text-center"><p className={`text-xl font-bold font-heading ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-lg border p-5 space-y-3">
          <h3 className="font-heading font-semibold">تعديل البيانات</h3>
          {editForm && <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground block mb-1">الاسم</label><input value={editForm.full_name} onChange={e=>setEditForm({...editForm,full_name:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">رقم الهوية</label><input value={editForm.national_id} onChange={e=>setEditForm({...editForm,national_id:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">الفصل</label><select value={editForm.class_id||""} onChange={e=>setEditForm({...editForm,class_id:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"><option value="">بدون فصل</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground block mb-1">كلمة مرور جديدة</label><input type="password" placeholder="اتركه فارغاً للإبقاء" onChange={e=>e.target.value&&setEditForm({...editForm,password_hash:e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
          </div>}
        </div>
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-heading font-semibold mb-3">آخر الدرجات</h3>
          {grades.length===0?<p className="text-muted-foreground text-sm">لا توجد درجات</p>:(
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(grades as any[]).slice(0,10).map((g:any)=>(
                <div key={g.id} className="flex justify-between items-center text-sm"><span className="text-muted-foreground">{g.subjects?.name} - {g.grade_type}</span><span className={`font-medium ${(g.score/g.max_score*100)>=60?"text-success":"text-destructive"}`}>{g.score}/{g.max_score}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
