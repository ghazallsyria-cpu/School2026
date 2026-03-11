import { useQuery } from "@tanstack/react-query";
import { getGradesByStudent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const gradeColor = (p:number) => p>=90?"text-success":p>=75?"text-info":p>=60?"text-warning":"text-destructive";
const gradeLetter = (p:number) => p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":"D";

export default function MyGrades() {
  const { user } = useAuth();
  const { data: grades = [], isLoading } = useQuery({ queryKey: ["my-grades", user?.id], queryFn: () => getGradesByStudent(user!.id), enabled: !!user?.id });

  const bySubject = (grades as any[]).reduce((g:any, gr:any) => {
    const name = gr.subjects?.name || "أخرى";
    if (!g[name]) g[name] = [];
    g[name].push(gr);
    return g;
  }, {});
  const chartData = Object.entries(bySubject).map(([name, grs]:any) => ({ name, avg: Math.round(grs.reduce((s:number,g:any)=>s+(g.score/g.max_score*100),0)/grs.length) }));
  const overall = (grades as any[]).length > 0 ? ((grades as any[]).reduce((s:number,g:any)=>s+(g.score/g.max_score*100),0)/(grades as any[]).length).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-bold">درجاتي</h1></div>
      {(grades as any[]).length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border p-4 text-center"><p className={`text-3xl font-bold font-heading ${gradeColor(Number(overall))}`}>{overall}%</p><p className="text-xs text-muted-foreground">المعدل العام</p></div>
            <div className="bg-card rounded-lg border p-4 text-center"><p className="text-3xl font-bold font-heading text-success">{(grades as any[]).filter(g=>g.score/g.max_score*100>=60).length}</p><p className="text-xs text-muted-foreground">مادة ناجح</p></div>
            <div className="bg-card rounded-lg border p-4 text-center"><p className="text-3xl font-bold font-heading text-destructive">{(grades as any[]).filter(g=>g.score/g.max_score*100<60).length}</p><p className="text-xs text-muted-foreground">مادة راسب</p></div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-heading font-semibold text-sm mb-4">أداؤك في المواد</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><Tooltip formatter={v=>[`${v}%`]}/><Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      {Object.entries(bySubject).map(([subj, grs]:any) => (
        <div key={subj} className="bg-card rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-accent/30 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">{subj}</h3>
            <span className={`text-sm font-bold ${gradeColor(Math.round(grs.reduce((s:number,g:any)=>s+(g.score/g.max_score*100),0)/grs.length))}`}>{Math.round(grs.reduce((s:number,g:any)=>s+(g.score/g.max_score*100),0)/grs.length)}%</span>
          </div>
          <table className="data-table"><thead><tr><th>النوع</th><th>الفصل</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>التقدير</th></tr></thead>
            <tbody>{grs.map((g:any)=>{ const p=Math.round(g.score/g.max_score*100); return (
              <tr key={g.id}><td className="text-sm">{g.grade_type}</td><td className="text-muted-foreground text-xs">{g.semester}</td><td className="font-bold">{g.score}</td><td className="text-muted-foreground">{g.max_score}</td>
                <td><span className={`font-semibold ${gradeColor(p)}`}>{p}%</span></td>
                <td><span className={`font-heading font-bold ${gradeColor(p)}`}>{gradeLetter(p)}</span></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      ))}
      {isLoading&&<p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>}
      {!isLoading&&(grades as any[]).length===0&&<p className="text-center text-muted-foreground py-12">لا توجد درجات مسجلة بعد</p>}
    </div>
  );
}
