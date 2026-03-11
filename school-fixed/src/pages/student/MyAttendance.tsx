import { useQuery } from "@tanstack/react-query";
import { getAttendanceByStudent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_ICON = { "حاضر": <CheckCircle className="w-4 h-4 text-success"/>, "غائب": <XCircle className="w-4 h-4 text-destructive"/>, "متأخر": <Clock className="w-4 h-4 text-warning"/> };
const STATUS_CLASS = { "حاضر": "badge-success", "غائب": "badge-destructive", "متأخر": "badge-warning" };

export default function MyAttendance() {
  const { user } = useAuth();
  const { data: attendance = [], isLoading } = useQuery({ queryKey: ["my-attendance", user?.id], queryFn: () => getAttendanceByStudent(user!.id), enabled: !!user?.id });
  const list = attendance as any[];
  const present = list.filter(a=>a.status==="حاضر").length;
  const absent = list.filter(a=>a.status==="غائب").length;
  const late = list.filter(a=>a.status==="متأخر").length;
  const rate = list.length>0?((present/list.length)*100).toFixed(1):"0";

  const byWeek: Record<string,{present:number,absent:number,late:number}> = {};
  list.forEach(a=>{
    const d = new Date(a.date); const week = `أسبوع ${Math.ceil(d.getDate()/7)}/${d.getMonth()+1}`;
    if(!byWeek[week]) byWeek[week]={present:0,absent:0,late:0};
    if(a.status==="حاضر") byWeek[week].present++;
    else if(a.status==="غائب") byWeek[week].absent++;
    else byWeek[week].late++;
  });
  const chartData = Object.entries(byWeek).slice(-8).map(([w,v])=>({week:w,...v}));

  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-bold">حضوري وغيابي</h1></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:"نسبة الحضور",v:`${rate}%`,c:"text-primary"},{l:"حاضر",v:present,c:"text-success"},{l:"غائب",v:absent,c:"text-destructive"},{l:"متأخر",v:late,c:"text-warning"}].map(s=>(
          <div key={s.l} className="bg-card rounded-lg border p-4 text-center"><p className={`text-2xl font-bold font-heading ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
        ))}
      </div>
      {chartData.length>0&&<div className="bg-card rounded-lg border p-4"><h3 className="font-heading font-semibold text-sm mb-3">الحضور الأسبوعي</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week" tick={{fontSize:10}}/><YAxis/><Tooltip/>
            <Bar dataKey="present" fill="hsl(var(--success))" name="حاضر" radius={[3,3,0,0]}/>
            <Bar dataKey="absent" fill="hsl(var(--destructive))" name="غائب" radius={[3,3,0,0]}/>
            <Bar dataKey="late" fill="hsl(var(--warning))" name="متأخر" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table"><thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
          <tbody>
            {isLoading&&<tr><td colSpan={2} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</td></tr>}
            {list.map((a:any)=>(
              <tr key={a.id}><td>{new Date(a.date).toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td>
                <td><span className={(STATUS_CLASS as any)[a.status]||""}>{a.status}</span></td>
              </tr>
            ))}
            {!isLoading&&list.length===0&&<tr><td colSpan={2} className="text-center py-8 text-muted-foreground">لا توجد سجلات حضور</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
