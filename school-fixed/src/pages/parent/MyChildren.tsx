import { useQuery } from "@tanstack/react-query";
import { getParentChildren } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BarChart3, CalendarCheck } from "lucide-react";

export default function MyChildren() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: children = [], isLoading } = useQuery({ queryKey: ["parent-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user?.id });

  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-bold">أبنائي</h1><p className="text-muted-foreground text-sm mt-1">{children.length} طالب</p></div>
      {isLoading&&<p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>}
      {!isLoading && children.length===0 && <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 text-center"><p className="text-warning font-heading">لم يتم ربط حسابك بطلاب بعد</p><p className="text-sm text-muted-foreground mt-1">تواصل مع إدارة المدرسة</p></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(children as any[]).map((c:any)=>(
          <div key={c.id} className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-heading font-bold text-xl flex items-center justify-center">{c.student?.full_name?.charAt(0)}</div>
              <div><h3 className="font-heading font-bold text-lg">{c.student?.full_name}</h3><p className="text-sm text-muted-foreground">{c.student?.classes?.name||"بدون فصل"}</p><p className="text-xs text-muted-foreground">{c.relationship}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>navigate("/children-grades")} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-success"/><span className="text-xs text-success font-heading">الدرجات</span>
              </button>
              <button onClick={()=>navigate("/children-attendance")} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <CalendarCheck className="w-5 h-5 text-primary"/><span className="text-xs text-primary font-heading">الحضور</span>
              </button>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent">
                <GraduationCap className="w-5 h-5 text-muted-foreground"/><span className="text-xs text-muted-foreground">{c.student?.classes?.grade||"-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
