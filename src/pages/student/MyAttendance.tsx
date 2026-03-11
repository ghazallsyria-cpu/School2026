import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAttendanceByStudent } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

export default function MyAttendance() {
  const { user } = useAuth();
  const { data: records = [], isLoading } = useQuery({ queryKey: ["my-attendance", user?.id], queryFn: () => getAttendanceByStudent(user!.id), enabled: !!user });

  const present = (records as any[]).filter(r => r.status === "حاضر").length;
  const absent = (records as any[]).filter(r => r.status === "غائب").length;
  const late = (records as any[]).filter(r => r.status === "متأخر").length;
  const total = records.length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

  const byMonth: Record<string, { present: number; absent: number; late: number }> = {};
  (records as any[]).forEach(r => {
    const month = r.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { present: 0, absent: 0, late: 0 };
    if (r.status === "حاضر") byMonth[month].present++;
    else if (r.status === "غائب") byMonth[month].absent++;
    else byMonth[month].late++;
  });
  const chartData = Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b)).map(([m,v])=>({month:m.slice(5),...v}));

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">حضوري وغيابي</h1></div>
      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}

      {records.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card text-center"><p className={`text-2xl font-bold font-heading ${Number(rate)>=80?"text-success":Number(rate)>=60?"text-warning":"text-destructive"}`}>{rate}%</p><p className="text-xs text-muted-foreground mt-1">نسبة الحضور</p></div>
            <div className="stat-card text-center"><p className="text-2xl font-bold font-heading text-success">{present}</p><p className="text-xs text-muted-foreground mt-1">حاضر</p></div>
            <div className="stat-card text-center"><p className="text-2xl font-bold font-heading text-destructive">{absent}</p><p className="text-xs text-muted-foreground mt-1">غائب</p></div>
            <div className="stat-card text-center"><p className="text-2xl font-bold font-heading text-warning">{late}</p><p className="text-xs text-muted-foreground mt-1">متأخر</p></div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-card rounded-lg border p-5">
              <h2 className="font-heading font-semibold mb-4">الحضور الشهري</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/>
                  <Bar dataKey="present" name="حاضر" fill="hsl(var(--success))" stackId="a"/>
                  <Bar dataKey="late" name="متأخر" fill="hsl(var(--warning))" stackId="a"/>
                  <Bar dataKey="absent" name="غائب" fill="hsl(var(--destructive))" stackId="a" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="data-table">
              <thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
              <tbody>
                {(records as any[]).map(r=>(
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td><span className={`text-xs px-2 py-1 rounded-full font-heading ${r.status==="حاضر"?"badge-success":r.status==="غائب"?"badge-destructive":"badge-warning"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isLoading && records.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20"/><p>لا يوجد سجل حضور بعد</p>
        </div>
      )}
    </div>
  );
}
