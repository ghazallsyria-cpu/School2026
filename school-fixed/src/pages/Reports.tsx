import { useQuery } from "@tanstack/react-query";
import { getReportStats } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, BookOpen, ClipboardList, School, FileText } from "lucide-react";

const COLORS = ["hsl(var(--success))","hsl(var(--info))","hsl(var(--warning))","hsl(var(--destructive))"];

export default function ReportsPage() {
  const { data: s, isLoading } = useQuery({ queryKey: ["report-stats"], queryFn: getReportStats });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
  if (!s) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">التقارير والإحصائيات</h1><p className="text-sm text-muted-foreground mt-1">نظرة شاملة على أداء المدرسة</p></div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {icon:Users,label:"الطلاب",value:s.totalStudents,color:"text-primary",bg:"bg-primary/10"},
          {icon:GraduationCap,label:"المعلمون",value:s.totalTeachers,color:"text-info",bg:"bg-info/10"},
          {icon:School,label:"الفصول",value:s.totalClasses,color:"text-success",bg:"bg-success/10"},
          {icon:BookOpen,label:"المواد",value:s.totalSubjects,color:"text-warning",bg:"bg-warning/10"},
          {icon:FileText,label:"الدروس",value:s.totalLessons,color:"text-primary",bg:"bg-primary/10"},
          {icon:ClipboardList,label:"الاختبارات",value:s.totalExams,color:"text-destructive",bg:"bg-destructive/10"},
        ].map(stat=>(
          <div key={stat.label} className="bg-card rounded-lg border p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}><stat.icon className="w-5 h-5"/></div>
            <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-5 text-center">
          <p className="text-4xl font-bold text-primary font-heading">{s.attendanceRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">معدل الحضور (آخر 30 يوم)</p>
          <div className="mt-3 h-2 bg-accent rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{width:`${s.attendanceRate}%`}}/></div>
        </div>
        <div className="bg-card rounded-lg border p-5 text-center">
          <p className="text-4xl font-bold text-success font-heading">{s.avgGrade}%</p>
          <p className="text-sm text-muted-foreground mt-1">معدل الدرجات الكلي</p>
          <div className="mt-3 h-2 bg-accent rounded-full overflow-hidden"><div className="h-full bg-success rounded-full transition-all" style={{width:`${s.avgGrade}%`}}/></div>
        </div>
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-heading font-semibold text-sm mb-3">حالة المحتوى</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">دروس منشورة</span><span className="font-medium text-success">{s.publishedLessons}/{s.totalLessons}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">اختبارات منشورة</span><span className="font-medium text-success">{s.publishedExams}/{s.totalExams}</span></div>
          </div>
        </div>
      </div>

      {/* Attendance chart */}
      {s.attendanceByDate.length>0&&(
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-heading font-semibold mb-4">الحضور اليومي (آخر 14 يوم)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.attendanceByDate}>
              <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="present" fill="hsl(var(--success))" name="حاضر" radius={[3,3,0,0]}/>
              <Bar dataKey="absent" fill="hsl(var(--destructive))" name="غائب" radius={[3,3,0,0]}/>
              <Bar dataKey="late" fill="hsl(var(--warning))" name="متأخر" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade distribution */}
      {s.gradeDistribution.some(g=>g.count>0)&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border p-5">
            <h3 className="font-heading font-semibold mb-4">توزيع الدرجات</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="range" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/>
                <Tooltip/><Bar dataKey="count" name="عدد الطلاب" radius={[4,4,0,0]}>
                  {s.gradeDistribution.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg border p-5">
            <h3 className="font-heading font-semibold mb-4">نسبة المستويات</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={s.gradeDistribution.filter(g=>g.count>0)} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({range,percent})=>`${range}: ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {s.gradeDistribution.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
