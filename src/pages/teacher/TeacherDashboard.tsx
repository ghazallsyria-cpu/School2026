import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherClasses, getTeacherSubjects, getLessons, getExams } from "@/lib/api";
import { BookOpen, PenTool, FolderOpen, FileText } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: myClasses } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user });
  const { data: mySubjects } = useQuery({ queryKey: ["teacher-subjects", user?.id], queryFn: () => getTeacherSubjects(user!.id), enabled: !!user });
  const { data: myLessons } = useQuery({ queryKey: ["teacher-lessons", user?.id], queryFn: () => getLessons({ teacher_id: user!.id }), enabled: !!user });
  const { data: myExams } = useQuery({ queryKey: ["teacher-exams", user?.id], queryFn: () => getExams({ teacher_id: user!.id }), enabled: !!user });

  const stats = [
    { label: "فصولي", value: myClasses?.length || 0, icon: FolderOpen, color: "text-primary bg-primary/10" },
    { label: "موادي", value: mySubjects?.length || 0, icon: BookOpen, color: "text-info bg-info/10" },
    { label: "دروسي", value: myLessons?.length || 0, icon: FileText, color: "text-success bg-success/10" },
    { label: "اختباراتي", value: myExams?.length || 0, icon: PenTool, color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">مرحباً، {user?.full_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">لوحة تحكم المعلم</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-heading">{s.label}</p>
                <p className="text-2xl font-bold font-heading mt-1">{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3">آخر الدروس</h2>
          <div className="space-y-2">
            {myLessons?.slice(0, 5).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{l.title}</span>
                <span className={`text-xs ${l.is_published ? "text-success" : "text-warning"}`}>{l.is_published ? "منشور" : "مسودة"}</span>
              </div>
            ))}
            {(!myLessons || myLessons.length === 0) && <p className="text-sm text-muted-foreground">لا توجد دروس بعد</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="font-heading font-semibold mb-3">آخر الاختبارات</h2>
          <div className="space-y-2">
            {myExams?.slice(0, 5).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{e.title}</span>
                <span className="text-xs text-muted-foreground">{e.duration_minutes} دقيقة</span>
              </div>
            ))}
            {(!myExams || myExams.length === 0) && <p className="text-sm text-muted-foreground">لا توجد اختبارات بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
