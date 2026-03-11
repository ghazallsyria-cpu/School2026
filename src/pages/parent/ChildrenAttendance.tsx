import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getParentChildren, getAttendanceByStudent } from "@/lib/api";

function ChildAttendance({ childId, childName }: { childId: string; childName: string }) {
  const { data: records = [] } = useQuery({ queryKey: ["attendance-student", childId], queryFn: () => getAttendanceByStudent(childId) });
  const present = (records as any[]).filter(r=>r.status==="حاضر").length;
  const absent = (records as any[]).filter(r=>r.status==="غائب").length;
  const rate = records.length > 0 ? ((present/records.length)*100).toFixed(0) : "0";
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading font-semibold">{childName}</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-success font-semibold">حاضر: {present}</span>
          <span className="text-destructive font-semibold">غائب: {absent}</span>
          <span className={`font-bold ${Number(rate)>=80?"text-success":Number(rate)>=60?"text-warning":"text-destructive"}`}>النسبة: {rate}%</span>
        </div>
      </div>
      {records.length > 0 ? (
        <table className="data-table"><thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
          <tbody>{(records as any[]).slice(0,20).map(r=>(
            <tr key={r.id}><td>{r.date}</td><td><span className={`text-xs px-2 py-0.5 rounded-full ${r.status==="حاضر"?"badge-success":r.status==="غائب"?"badge-destructive":"badge-warning"}`}>{r.status}</span></td></tr>
          ))}</tbody>
        </table>
      ) : <p className="text-center py-6 text-muted-foreground text-sm">لا يوجد سجل حضور</p>}
    </div>
  );
}

export default function ChildrenAttendance() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useQuery({ queryKey: ["my-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user });
  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">حضور الأبناء</h1></div>
      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}
      {(children as any[]).map(c => <ChildAttendance key={c.id} childId={c.student_id} childName={c.student?.full_name} />)}
      {!isLoading && children.length === 0 && <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">لم يتم ربط أي طالب بحسابك</div>}
    </div>
  );
}
