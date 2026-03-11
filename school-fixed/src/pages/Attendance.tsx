import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, getStudentsByClass, getAttendanceByClassAndDate, upsertAttendance, getAllAttendanceRange } from "@/lib/api";
import { toast } from "sonner";
import { Save, Calendar, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const STATUS_OPTIONS = ["حاضر","غائب","متأخر"] as const;
const STATUS_COLOR: Record<string,string> = { "حاضر":"text-success", "غائب":"text-destructive", "متأخر":"text-warning" };
const STATUS_BG: Record<string,string> = { "حاضر":"bg-success/10 border-success/30", "غائب":"bg-destructive/10 border-destructive/30", "متأخر":"bg-warning/10 border-warning/30" };

export default function AttendancePage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selClass, setSelClass] = useState("");
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<"daily"|"stats">("daily");
  const [attendanceMap, setAttendanceMap] = useState<Record<string,string>>({});
  const [period, setPeriod] = useState<"weekly"|"monthly">("weekly");

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: students = [] } = useQuery({ queryKey: ["students-class", selClass], queryFn: () => getStudentsByClass(selClass), enabled: !!selClass });
  const { data: existing = [] } = useQuery({
    queryKey: ["attendance-class-date", selClass, date],
    queryFn: () => getAttendanceByClassAndDate(selClass, date),
    enabled: !!selClass,
    onSuccess: (data: any[]) => {
      const map: Record<string,string> = {};
      data.forEach(r => { map[r.student_id] = r.status; });
      setAttendanceMap(map);
    }
  } as any);

  const now = new Date();
  const statsEnd = today;
  const statsStart = period === "weekly"
    ? new Date(now.getTime() - 7*24*60*60*1000).toISOString().split("T")[0]
    : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { data: rangeData = [] } = useQuery({ queryKey: ["att-range", statsStart, statsEnd], queryFn: () => getAllAttendanceRange(statsStart, statsEnd) });

  const saveMut = useMutation({
    mutationFn: () => {
      const records = students.map((s: any) => ({ student_id: s.id, class_id: selClass, date, status: attendanceMap[s.id] || "حاضر" }));
      return upsertAttendance(records);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("تم حفظ الحضور"); },
    onError: () => toast.error("خطأ في الحفظ")
  });

  const setAll = (status: string) => {
    const map: Record<string,string> = {};
    students.forEach((s: any) => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  // Chart data
  const byDate: Record<string,{present:number,absent:number,late:number,total:number}> = {};
  (rangeData as any[]).forEach(r => {
    const d = r.date?.slice(5) || r.date;
    if (!byDate[d]) byDate[d] = { present:0, absent:0, late:0, total:0 };
    byDate[d].total++;
    if (r.status==="حاضر") byDate[d].present++;
    else if (r.status==="غائب") byDate[d].absent++;
    else byDate[d].late++;
  });
  const chartData = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([date,v])=>({ date, ...v, rate: v.total>0?Math.round(v.present/v.total*100):0 }));
  const totalPresent = (rangeData as any[]).filter(r=>r.status==="حاضر").length;
  const totalAbs = (rangeData as any[]).filter(r=>r.status==="غائب").length;
  const totalLate = (rangeData as any[]).filter(r=>r.status==="متأخر").length;
  const totalAll = (rangeData as any[]).length;

  const present = Object.values(attendanceMap).filter(s=>s==="حاضر").length;
  const absent = Object.values(attendanceMap).filter(s=>s==="غائب").length;
  const late = Object.values(attendanceMap).filter(s=>s==="متأخر").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">الحضور والغياب</h1></div>
        <div className="flex rounded-lg border overflow-hidden">
          {(["daily","stats"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-heading ${tab===t?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground"}`}>{t==="daily"?"التسجيل اليومي":"الإحصائيات"}</button>
          ))}
        </div>
      </div>

      {tab==="daily" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2.5 bg-card border rounded-lg text-sm">
              <option value="">اختر الفصل</option>
              {classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-card border rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground"/>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-transparent text-sm outline-none"/>
            </div>
          </div>

          {selClass && students.length>0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs rounded-full"><CheckCircle className="w-3.5 h-3.5"/>{present} حاضر</div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive text-xs rounded-full"><XCircle className="w-3.5 h-3.5"/>{absent} غائب</div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning text-xs rounded-full"><Clock className="w-3.5 h-3.5"/>{late} متأخر</div>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s=><button key={s} onClick={()=>setAll(s)} className={`px-3 py-1.5 text-xs rounded-lg border ${STATUS_BG[s]} ${STATUS_COLOR[s]}`}>{s==="حاضر"?"الكل حاضر":s==="غائب"?"الكل غائب":"الكل متأخر"}</button>)}
                </div>
                <button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"><Save className="w-4 h-4"/>حفظ الحضور</button>
              </div>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>#</th><th>الطالب</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {students.map((s:any,i:number)=>{
                      const st = attendanceMap[s.id]||"حاضر";
                      return (
                        <tr key={s.id}>
                          <td className="text-muted-foreground text-xs">{i+1}</td>
                          <td className="font-medium">{s.full_name}</td>
                          <td>
                            <div className="flex gap-2">
                              {STATUS_OPTIONS.map(opt=>(
                                <button key={opt} onClick={()=>setAttendanceMap({...attendanceMap,[s.id]:opt})}
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${st===opt?`${STATUS_BG[opt]} ${STATUS_COLOR[opt]} font-semibold`:"border-border text-muted-foreground hover:bg-accent"}`}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {selClass && students.length===0 && <p className="text-center text-muted-foreground py-8">لا يوجد طلاب في هذا الفصل</p>}
          {!selClass && <p className="text-center text-muted-foreground py-12">اختر فصلاً لبدء تسجيل الحضور</p>}
        </div>
      )}

      {tab==="stats" && (
        <div className="space-y-5">
          <div className="flex gap-3">
            <button onClick={()=>setPeriod("weekly")} className={`px-4 py-2 text-sm rounded-lg border ${period==="weekly"?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>أسبوعي</button>
            <button onClick={()=>setPeriod("monthly")} className={`px-4 py-2 text-sm rounded-lg border ${period==="monthly"?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>شهري</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {l:"إجمالي السجلات",v:totalAll,c:"text-primary"},
              {l:"حاضر",v:totalPresent,c:"text-success"},
              {l:"غائب",v:totalAbs,c:"text-destructive"},
              {l:"متأخر",v:totalLate,c:"text-warning"},
            ].map(s=>(
              <div key={s.l} className="bg-card rounded-lg border p-4 text-center">
                <p className={`text-2xl font-bold font-heading ${s.c}`}>{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          {chartData.length>0 ? (
            <>
              <div className="bg-card rounded-lg border p-5">
                <h3 className="font-heading font-semibold text-sm mb-4">الحضور اليومي</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
                    <Tooltip/>
                    <Bar dataKey="present" fill="hsl(var(--success))" name="حاضر" radius={[3,3,0,0]}/>
                    <Bar dataKey="absent" fill="hsl(var(--destructive))" name="غائب" radius={[3,3,0,0]}/>
                    <Bar dataKey="late" fill="hsl(var(--warning))" name="متأخر" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-lg border p-5">
                <h3 className="font-heading font-semibold text-sm mb-4">نسبة الحضور اليومية</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/>
                    <Tooltip formatter={(v)=>[`${v}%`,"نسبة الحضور"]}/>
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد بيانات للفترة المحددة</p></div>}
        </div>
      )}
    </div>
  );
}
