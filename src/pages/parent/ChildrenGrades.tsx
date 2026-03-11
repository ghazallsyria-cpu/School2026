import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getParentChildren, getGradesByStudent } from "@/lib/api";

const gradeColor = (pct: number) => pct >= 75 ? "text-success" : pct >= 60 ? "text-info" : pct >= 50 ? "text-warning" : "text-destructive";
const gradeLabel = (pct: number) => pct >= 90 ? "ممتاز" : pct >= 75 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "راسب";

function ChildGrades({ childId, childName }: { childId: string; childName: string }) {
  const { data: grades = [] } = useQuery({ queryKey: ["grades-student", childId], queryFn: () => getGradesByStudent(childId) });
  const avg = grades.length > 0 ? ((grades as any[]).reduce((s,g)=>s+(g.score/g.max_score)*100,0)/grades.length).toFixed(1) : "0";
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-heading font-semibold">{childName}</h3>
        <span className={`font-bold ${gradeColor(Number(avg))}`}>المعدل: {avg}%</span>
      </div>
      {grades.length > 0 ? (
        <table className="data-table"><thead><tr><th>المادة</th><th>النوع</th><th>الدرجة</th><th>النسبة</th><th>التقدير</th></tr></thead>
          <tbody>{(grades as any[]).map(g=>{const pct=(g.score/g.max_score)*100;return(
            <tr key={g.id}><td>{g.subjects?.name}</td><td className="text-muted-foreground">{g.grade_type}</td><td className="font-semibold">{g.score}/{g.max_score}</td>
              <td><span className={`font-bold ${gradeColor(pct)}`}>{pct.toFixed(1)}%</span></td>
              <td><span className="text-xs badge-info">{gradeLabel(pct)}</span></td>
            </tr>
          );})}</tbody>
        </table>
      ) : <p className="text-center py-6 text-muted-foreground text-sm">لا توجد درجات</p>}
    </div>
  );
}

export default function ChildrenGrades() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useQuery({ queryKey: ["my-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user });
  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">درجات الأبناء</h1></div>
      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}
      {(children as any[]).map(c => <ChildGrades key={c.id} childId={c.student_id} childName={c.student?.full_name} />)}
      {!isLoading && children.length === 0 && <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">لم يتم ربط أي طالب بحسابك</div>}
    </div>
  );
}
