import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getClasses, getExams } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Users, UserCheck, FolderOpen, TrendingUp, ClipboardCheck, PenTool, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const { data: classes } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: exams } = useQuery({ queryKey: ["exams"], queryFn: () => getExams() });

  const statCards = [
    { label: "إجمالي الطلاب", value: stats?.totalStudents || 0, icon: Users, color: "text-primary bg-primary/10" },
    { label: "إجمالي المعلمين", value: stats?.totalTeachers || 0, icon: UserCheck, color: "text-info bg-info/10" },
    { label: "الفصول الدراسية", value: stats?.totalClasses || 0, icon: FolderOpen, color: "text-warning bg-warning/10" },
    { label: "نسبة الحضور اليوم", value: `${stats?.attendance.rate || 0}%`, icon: TrendingUp, color: "text-success bg-success/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">مرحباً، {user?.full_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">لوحة التحكم الرئيسية - نظرة عامة على المدرسة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-heading">{card.label}</p>
                <p className="text-2xl font-bold font-heading mt-1">{card.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance summary */}
      {stats?.attendance && stats.attendance.total > 0 && (
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" /> ملخص الحضور اليوم
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{stats.attendance.present}</p>
              <p className="text-xs text-muted-foreground mt-1">حاضر</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{stats.attendance.late}</p>
              <p className="text-xs text-muted-foreground mt-1">متأخر</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{stats.attendance.absent}</p>
              <p className="text-xs text-muted-foreground mt-1">غائب</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent classes & exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> الفصول الدراسية
          </h2>
          <div className="space-y-2">
            {classes?.slice(0, 6).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.grade} - {c.track}</span>
              </div>
            ))}
            {(!classes || classes.length === 0) && <p className="text-sm text-muted-foreground">لا توجد فصول بعد</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-primary" /> آخر الاختبارات
          </h2>
          <div className="space-y-2">
            {exams?.slice(0, 6).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{e.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${e.is_published ? "badge-success" : "badge-warning"}`}>
                  {e.is_published ? "منشور" : "مسودة"}
                </span>
              </div>
            ))}
            {(!exams || exams.length === 0) && <p className="text-sm text-muted-foreground">لا توجد اختبارات بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
