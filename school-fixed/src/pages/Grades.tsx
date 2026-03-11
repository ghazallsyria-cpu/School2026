import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, getSubjects, getStudentsByClass, getGradesBySubjectAndClass, upsertGrade, deleteGrade } from "@/lib/api";
import { toast } from "sonner";
import { Save, Trash2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GRADE_TYPES = ["اختبار أول","اختبار ثاني","اختبار نهائي","درجة مستمرة","مشاركة","واجب"];
const SEMESTERS = ["الفصل الأول","الفصل الثاني","الفصل الثالث"];
const gradeColor = (pct:number) => pct>=90?"text-success":pct>=75?"text-info":pct>=60?"text-warning":"text-destructive";
const gradeLetter = (pct:number) => pct>=90?"A":pct>=80?"B":pct>=70?"C":pct>=60?"D":"F";

export default function GradesPage() {
  const qc = useQueryClient();
  const [selClass, setSelClass] = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [selSemester, setSelSemester] = useState("الفصل الأول");
  const [selType, setSelType] = useState("اختبار أول");
  const [maxScore, setMaxScore] = useState(100);
  const [gradeMap, setGradeMap] = useState<Record<string,string>>({});
  const [tab, setTab] = useState<"entry"|"view">("entry");

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: students = [] } = useQuery({ queryKey: ["students-class", selClass], queryFn: () => getStudentsByClass(selClass), enabled: !!selClass });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades-sub-class", selSubject, selClass],
    queryFn: () => getGradesBySubjectAndClass(selSubject, selClass),
    enabled: !!selClass && !!selSubject,
    onSuccess: (data: any[]) => {
      const map: Record<string,string> = {};
      data.filter(g=>g.grade_type===selType&&g.semester===selSemester).forEach(g=>{ map[g.student_id]=String(g.score); });
      setGradeMap(map);
    }
  } as any);

  const saveMut = useMutation({
    mutationFn: async () => {
      const promises = students.map((s:any) => {
        const score = Number(gradeMap[s.id] ?? "");
        if (isNaN(score)) return Promise.resolve();
        return upsertGrade({ student_id:s.id, subject_id:selSubject, class_id:selClass, grade_type:selType, score, max_score:maxScore, semester:selSemester });
      });
      await Promise.all(promises);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades-sub-class", selSubject, selClass] }); toast.success("تم حفظ الدرجات"); },
    onError: () => toast.error("خطأ في الحفظ")
  });

  // Stats
  const filteredGrades = (grades as any[]).filter(g=>g.grade_type===selType&&g.semester===selSemester);
  const scores = filteredGrades.map(g=>g.score/g.max_score*100);
  const avg = scores.length>0?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):"0";
  const highest = scores.length>0?Math.max(...scores).toFixed(1):"0";
  const lowest = scores.length>0?Math.min(...scores).toFixed(1):"0";
  const passCount = scores.filter(s=>s>=60).length;

  const chartData = students.map((s:any)=>{
    const g = filteredGrades.find(g=>g.student_id===s.id);
    return { name:s.full_name?.split(" ")[0], score:g?Math.round(g.score/g.max_score*100):0 };
  });

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">الدرجات</h1>
      <div className="flex rounded-lg border overflow-hidden w-fit">
        {(["entry","view"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-heading ${tab===t?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground"}`}>{t==="entry"?"إدخال الدرجات":"عرض وتحليل"}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select value={selClass} onChange={e=>{setSelClass(e.target.value);setGradeMap({});}} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">الفصل</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={selSubject} onChange={e=>{setSelSubject(e.target.value);setGradeMap({});}} className="px-4 py-2.5 bg-card border rounded-lg text-sm"><option value="">المادة</option>{subjects.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={selSemester} onChange={e=>setSelSemester(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm">{SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select value={selType} onChange={e=>setSelType(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm">{GRADE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
      </div>

      {tab==="entry" && selClass && selSubject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">الدرجة الكاملة:</label>
              <input type="number" value={maxScore} onChange={e=>setMaxScore(+e.target.value)} className="w-24 px-3 py-1.5 bg-card border rounded-lg text-sm text-center font-heading font-bold"/>
            </div>
            <button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"><Save className="w-4 h-4"/>حفظ الدرجات</button>
          </div>
          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="data-table">
              <thead><tr><th>#</th><th>اسم الطالب</th><th>الدرجة (من {maxScore})</th><th>النسبة</th><th>التقدير</th></tr></thead>
              <tbody>
                {students.map((s:any,i:number)=>{
                  const score = gradeMap[s.id]??"";
                  const pct = score!==""?Math.round(Number(score)/maxScore*100):null;
                  return (
                    <tr key={s.id}>
                      <td className="text-muted-foreground text-xs">{i+1}</td>
                      <td className="font-medium">{s.full_name}</td>
                      <td>
                        <input type="number" min="0" max={maxScore} value={score} onChange={e=>setGradeMap({...gradeMap,[s.id]:e.target.value})}
                          placeholder="-" className="w-24 px-3 py-1.5 bg-background border rounded-lg text-sm text-center"/>
                      </td>
                      <td>{pct!==null?<span className={`font-medium ${gradeColor(pct)}`}>{pct}%</span>:"-"}</td>
                      <td>{pct!==null?<span className={`font-heading font-bold text-lg ${gradeColor(pct)}`}>{gradeLetter(pct)}</span>:"-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="view" && selClass && selSubject && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[{l:"المعدل",v:`${avg}%`,c:"text-primary"},{l:"الأعلى",v:`${highest}%`,c:"text-success"},{l:"الأدنى",v:`${lowest}%`,c:"text-destructive"},{l:"ناجحون",v:`${passCount}/${scores.length}`,c:"text-info"}].map(s=>(
              <div key={s.l} className="bg-card rounded-lg border p-4 text-center"><p className={`text-2xl font-bold font-heading ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
            ))}
          </div>
          {chartData.filter(d=>d.score>0).length>0?(
            <div className="bg-card rounded-lg border p-5">
              <h3 className="font-heading font-semibold text-sm mb-4">درجات الطلاب</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/>
                  <Tooltip formatter={(v)=>[`${v}%`,"النسبة"]}/>
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ):<div className="bg-card rounded-lg border p-12 text-center text-muted-foreground"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد درجات مسجلة</p></div>}
        </div>
      )}

      {(!selClass||!selSubject)&&<p className="text-center text-muted-foreground py-12">اختر الفصل والمادة لعرض الدرجات</p>}
    </div>
  );
}
