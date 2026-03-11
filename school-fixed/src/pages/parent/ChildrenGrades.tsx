import { useQuery } from "@tanstack/react-query";
import { getParentChildren, getGradesByStudent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const gradeColor=(p:number)=>p>=90?"text-success":p>=75?"text-info":p>=60?"text-warning":"text-destructive";

export default function ChildrenGrades() {
  const { user } = useAuth();
  const { data: children = [] } = useQuery({ queryKey: ["parent-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user?.id });
  const firstChild = (children as any[])[0];
  const { data: grades = [] } = useQuery({ queryKey: ["child-grades", firstChild?.student_id], queryFn: () => getGradesByStudent(firstChild!.student_id), enabled: !!firstChild });

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">درجات الأبناء</h1>
      {(children as any[]).map((c:any)=>(
        <div key={c.id}>
          <h2 className="font-heading font-semibold text-lg mb-3 text-primary">{c.student?.full_name}</h2>
          {(grades as any[]).length===0?<p className="text-muted-foreground text-sm">لا توجد درجات بعد</p>:(
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="data-table"><thead><tr><th>المادة</th><th>النوع</th><th>الفصل</th><th>الدرجة</th><th>من</th><th>النسبة</th></tr></thead>
                <tbody>{(grades as any[]).map((g:any)=>{const p=Math.round(g.score/g.max_score*100);return(
                  <tr key={g.id}><td className="font-medium text-sm">{g.subjects?.name}</td><td className="text-muted-foreground text-xs">{g.grade_type}</td><td className="text-muted-foreground text-xs">{g.semester}</td><td className="font-bold">{g.score}</td><td className="text-muted-foreground">{g.max_score}</td><td><span className={`font-semibold ${gradeColor(p)}`}>{p}%</span></td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {(children as any[]).length===0&&<p className="text-center text-muted-foreground py-8">لا يوجد أبناء مرتبطون بحسابك</p>}
    </div>
  );
}
