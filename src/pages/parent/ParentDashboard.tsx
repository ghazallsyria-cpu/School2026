import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getParentChildren, getGradesByStudent, getAttendanceByStudent } from "@/lib/api";
import { Users, GraduationCap, ClipboardCheck } from "lucide-react";

export default function ParentDashboard() {
  const { user } = useAuth();

  const { data: children } = useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: () => getParentChildren(user!.id),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">مرحباً، {user?.full_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">لوحة تحكم ولي الأمر</p>
      </div>

      <div className="stat-card flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">عدد الأبناء</p>
          <p className="text-2xl font-bold font-heading">{children?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children?.map((c: any) => (
          <div key={c.id} className="bg-card rounded-lg border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold">
                {c.student?.full_name?.[0]}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm">{c.student?.full_name}</h3>
                <p className="text-xs text-muted-foreground">{c.student?.classes?.name || "غير مسند لفصل"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-info/10 rounded-lg p-2 text-center">
                <GraduationCap className="w-4 h-4 text-info mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">الدرجات</p>
              </div>
              <div className="bg-success/10 rounded-lg p-2 text-center">
                <ClipboardCheck className="w-4 h-4 text-success mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">الحضور</p>
              </div>
            </div>
          </div>
        ))}
        {(!children || children.length === 0) && <p className="text-muted-foreground col-span-full text-center py-8">لم يتم ربط أبناء بحسابك بعد. تواصل مع إدارة المدرسة.</p>}
      </div>
    </div>
  );
}
