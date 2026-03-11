import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, addClass, updateClass, deleteClass, getClassStats, getStudentsByClass, getTeachersByClass } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Trash2, Users, GraduationCap, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

export default function ClassesPage() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", section: "أ", track: "عام" });

  const { data: classes = [], isLoading } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: stats } = useQuery({ queryKey: ["class-stats", sel?.id], queryFn: () => getClassStats(sel!.id), enabled: !!sel });
  const { data: students = [] } = useQuery({ queryKey: ["students-by-class", sel?.id], queryFn: () => getStudentsByClass(sel!.id), enabled: !!sel });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers-by-class", sel?.id], queryFn: () => getTeachersByClass(sel!.id), enabled: !!sel });

  const addMut = useMutation({ mutationFn: () => addClass(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setShowAdd(false); toast.success("تم إضافة الفصل"); }, onError: () => toast.error("خطأ") });
  const updateMut = useMutation({ mutationFn: (u: any) => updateClass(sel.id, u), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["classes"] }); setSel(d); toast.success("تم الحفظ"); } });
  const deleteMut = useMutation({ mutationFn: deleteClass, onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setSel(null); toast.success("تم الحذف"); } });

  const gradeGroups = classes.reduce((g: any, c: any) => { (g[c.grade] = g[c.grade] || []).push(c); return g; }, {});

  if (!sel) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الفصول الدراسية</h1><p className="text-muted-foreground text-sm mt-1">{classes.length} فصل</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4" />فصل جديد</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-lg">فصل جديد</h2><button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <input placeholder="اسم الفصل (مثال: أول متوسط أ)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-muted-foreground block mb-1">المرحلة</label>
                  <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
                    <option value="">اختر</option>
                    {["أول ابتدائي","ثاني ابتدائي","ثالث ابتدائي","رابع ابتدائي","خامس ابتدائي","سادس ابتدائي","أول متوسط","ثاني متوسط","ثالث متوسط","أول ثانوي","ثاني ثانوي","ثالث ثانوي"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">الشعبة</label>
                  <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
                    {["أ","ب","ج","د","ه","و"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">المسار</label>
                  <select value={form.track} onChange={e => setForm({ ...form, track: e.target.value })} className="w-full px-3 py-2.5 bg-background border rounded-lg text-sm">
                    {["عام","علمي","أدبي"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button>
                <button onClick={() => addMut.mutate()} disabled={!form.name || !form.grade} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة الفصل</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p> : (
        <div className="space-y-6">
          {Object.entries(gradeGroups).map(([grade, cls]: any) => (
            <div key={grade}>
              <h2 className="font-heading font-semibold text-base mb-3 text-primary">{grade}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cls.map((c: any) => (
                  <button key={c.id} onClick={() => setSel(c)} className="bg-card rounded-lg border p-5 text-right hover:border-primary hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-heading font-bold text-lg flex items-center justify-center">{c.section}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-heading font-bold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">المسار: {c.track} • {c.academic_year}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {classes.length === 0 && <p className="text-center text-muted-foreground py-12">لا توجد فصول دراسية</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
          <div><h2 className="font-heading font-bold text-xl">{sel.name}</h2><p className="text-xs text-muted-foreground">{sel.grade} • مسار {sel.track}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate({ name: sel.name, track: sel.track })} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground">حفظ</button>
          <button onClick={() => deleteMut.mutate(sel.id)} className="px-4 py-2 text-sm rounded-lg text-destructive border border-destructive/20 hover:bg-destructive/5">حذف</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "الطلاب", value: stats?.studentCount ?? "-", color: "text-primary", bg: "bg-primary/10" },
          { label: "المعلمون", value: stats?.teacherCount ?? "-", color: "text-info", bg: "bg-info/10" },
          { label: "معدل الدرجات", value: stats ? `${stats.avgGrade}%` : "-", color: "text-success", bg: "bg-success/10" },
          { label: "نسبة الحضور", value: stats ? `${stats.attendanceRate}%` : "-", color: "text-warning", bg: "bg-warning/10" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg border p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}><GraduationCap className="w-5 h-5" /></div>
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3">مستوى الأداء</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={[
              { name: "الحضور", value: stats?.attendanceRate ?? 0, fill: "hsl(var(--success))" },
              { name: "الدرجات", value: stats?.avgGrade ?? 0, fill: "hsl(var(--primary))" },
            ]}>
              <RadialBar dataKey="value" background />
              <Tooltip formatter={(v: any) => [`${v}%`]} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />معدل الدرجات</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />نسبة الحضور</span>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-heading font-semibold text-sm mb-3">تفاصيل الفصل</h3>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground block mb-1">اسم الفصل</label>
              <input value={sel.name} onChange={e => setSel({ ...sel, name: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">المسار</label>
              <select value={sel.track} onChange={e => setSel({ ...sel, track: e.target.value })} className="w-full px-3 py-2 bg-background border rounded-lg text-sm">
                {["عام","علمي","أدبي"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students & Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><h3 className="font-heading font-semibold text-sm">الطلاب ({students.length})</h3></div>
          <div className="max-h-64 overflow-y-auto">
            {students.length === 0 ? <p className="text-center text-muted-foreground text-sm py-6">لا يوجد طلاب</p> : (
              <table className="data-table"><thead><tr><th>#</th><th>الاسم</th><th>رقم الهوية</th></tr></thead>
                <tbody>{students.map((s: any, i: number) => <tr key={s.id}><td className="text-muted-foreground text-xs">{i+1}</td><td className="font-medium text-sm">{s.full_name}</td><td className="text-muted-foreground text-xs">{s.national_id}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2"><GraduationCap className="w-4 h-4 text-info" /><h3 className="font-heading font-semibold text-sm">المعلمون ({teachers.length})</h3></div>
          <div className="max-h-64 overflow-y-auto">
            {teachers.length === 0 ? <p className="text-center text-muted-foreground text-sm py-6">لا يوجد معلمون</p> : (
              <table className="data-table"><thead><tr><th>الاسم</th><th>رقم الهوية</th><th>الجوال</th></tr></thead>
                <tbody>{teachers.map((t: any) => <tr key={t.id}><td className="font-medium text-sm">{t.teacher?.full_name}</td><td className="text-muted-foreground text-xs">{t.teacher?.national_id}</td><td className="text-muted-foreground text-xs">{t.teacher?.phone || "-"}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
