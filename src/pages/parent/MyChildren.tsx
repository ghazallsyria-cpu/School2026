import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getParentChildren } from "@/lib/api";
import { Users } from "lucide-react";

export default function MyChildren() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useQuery({ queryKey: ["my-children", user?.id], queryFn: () => getParentChildren(user!.id), enabled: !!user });

  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">أبنائي</h1><p className="text-muted-foreground text-sm mt-1">{children.length} طالب مرتبط بحسابك</p></div>
      {isLoading && <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(children as any[]).map((c: any) => (
          <div key={c.id} className="bg-card rounded-lg border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-lg">{c.student?.full_name?.[0]}</div>
              <div><h3 className="font-heading font-bold">{c.student?.full_name}</h3><p className="text-xs text-muted-foreground">{c.student?.classes?.name || "بدون فصل"}</p></div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">رقم الهوية</span><span className="font-mono text-xs">{c.student?.national_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الصف</span><span>{c.student?.classes?.grade || "-"}</span></div>
            </div>
          </div>
        ))}
        {!isLoading && children.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground bg-card rounded-lg border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20"/><p>لم يتم ربط أي طالب بحسابك</p><p className="text-xs mt-1">تواصل مع إدارة المدرسة</p>
          </div>
        )}
      </div>
    </div>
  );
}
