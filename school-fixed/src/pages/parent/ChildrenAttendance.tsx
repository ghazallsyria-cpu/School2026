import { useQuery } from "@tanstack/react-query";
import { getParentChildren, getAttendanceByStudent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ChildrenAttendance() {
  const { user } = useAuth();
  const { data: children = [] } = useQuery({ queryKey: ["parent-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user?.id });
  const firstChild = (children as any[])[0];
  const { data: attendance = [] } = useQuery({ queryKey: ["child-att", firstChild?.student_id], queryFn: () => getAttendanceByStudent(firstChild!.student_id), enabled: !!firstChild });
  const list = attendance as any[];
  const rate = list.length>0?((list.filter(a=>a.status==="حاضر").length/list.length)*100).toFixed(1):"0";

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">حضور الأبناء</h1>
      {(children as any[]).map((c:any)=>(
        <div key={c.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-lg text-primary">{c.student?.full_name}</h2>
            <span className="text-sm font-medium text-success">{rate}% حضور</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[{l:"حاضر",v:list.filter(a=>a.status==="حاضر").length,c:"text-success"},{l:"غائب",v:list.filter(a=>a.status==="غائب").length,c:"text-destructive"},{l:"متأخر",v:list.filter(a=>a.status==="متأخر").length,c:"text-warning"}].map(s=>(
              <div key={s.l} className="bg-card rounded-lg border p-3 text-center"><p className={`text-xl font-bold font-heading ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
            ))}
          </div>
          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="data-table"><thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
              <tbody>{list.slice(0,20).map((a:any)=>(
                <tr key={a.id}><td className="text-sm">{new Date(a.date).toLocaleDateString("ar-SA")}</td>
                  <td><span className={a.status==="حاضر"?"badge-success":a.status==="غائب"?"badge-destructive":"badge-warning"}>{a.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
      {(children as any[]).length===0&&<p className="text-center text-muted-foreground py-8">لا يوجد أبناء مرتبطون</p>}
    </div>
  );
}
