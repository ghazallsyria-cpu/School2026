import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSchoolSettings, saveAllSchoolSettings } from "@/lib/api";
import { toast } from "sonner";
import { Save, School, Bell, Shield } from "lucide-react";

const DEFAULT: Record<string,string> = {
  school_name:"مدرسة الرِّفعة", school_phone:"011-1234567", school_email:"info@rifaschool.edu",
  school_address:"الرياض - حي النزهة", academic_year:"2025-2026", semester:"الفصل الثاني",
  attendance_notifications:"true", grades_notifications:"true", messages_notifications:"true", weekly_reports:"false"
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>(DEFAULT);
  const { data, isLoading } = useQuery({ queryKey: ["school-settings"], queryFn: getSchoolSettings });

  useEffect(() => {
    if (!data) return;
    const map: Record<string,string> = { ...DEFAULT };
    (data as any[]).forEach(s => { map[s.key] = s.value; });
    setSettings(map);
  }, [data]);

  const saveMut = useMutation({ mutationFn: () => saveAllSchoolSettings(settings), onSuccess: () => toast.success("تم حفظ الإعدادات بنجاح"), onError: () => toast.error("خطأ في الحفظ") });

  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: s[key]==="true"?"false":"true" }));
  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between"><h1 className="font-heading text-2xl font-bold">الإعدادات</h1>
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90 disabled:opacity-60"><Save className="w-4 h-4"/>حفظ التغييرات</button>
      </div>

      {/* School Info */}
      <div className="bg-card rounded-xl border p-5 space-y-4">
        <h2 className="font-heading font-bold flex items-center gap-2"><School className="w-5 h-5 text-primary"/>بيانات المدرسة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["school_name","اسم المدرسة","text"],["school_phone","رقم الهاتف","text"],["school_email","البريد الإلكتروني","email"],["school_address","العنوان","text"]].map(([k,l,t])=>(
            <div key={k}><label className="text-xs text-muted-foreground block mb-1.5">{l}</label>
              <input type={t} value={settings[k]||""} onChange={e=>set(k,e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
            </div>
          ))}
          <div><label className="text-xs text-muted-foreground block mb-1.5">العام الدراسي</label>
            <input value={settings.academic_year||""} onChange={e=>set("academic_year",e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
          </div>
          <div><label className="text-xs text-muted-foreground block mb-1.5">الفصل الحالي</label>
            <select value={settings.semester||""} onChange={e=>set("semester",e.target.value)} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm">
              {["الفصل الأول","الفصل الثاني","الفصل الثالث"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl border p-5 space-y-4">
        <h2 className="font-heading font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-warning"/>الإشعارات</h2>
        {[
          ["attendance_notifications","إشعارات الغياب","إرسال إشعار عند تسجيل غياب الطالب"],
          ["grades_notifications","إشعارات الدرجات","إشعار ولي الأمر عند رصد درجات جديدة"],
          ["messages_notifications","إشعارات الرسائل","إشعارات عند وصول رسائل جديدة"],
          ["weekly_reports","تقارير أسبوعية","إرسال ملخص أسبوعي تلقائي"],
        ].map(([key,label,desc])=>(
          <div key={key} className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
            <button onClick={()=>toggle(key)} className={`relative w-12 h-6 rounded-full transition-colors ${settings[key]==="true"?"bg-primary":"bg-border"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[key]==="true"?"left-0.5":"right-0.5"}`}/>
            </button>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-heading font-bold flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-info"/>الأمان</h2>
        <div className="bg-accent rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p>• كلمة المرور الافتراضية للحسابات الجديدة: <code className="bg-card px-2 py-0.5 rounded font-mono text-foreground">123456</code></p>
          <p>• يُنصح بتغيير كلمات المرور فور تسليم الحسابات</p>
          <p>• يمكن إعادة تعيين كلمة مرور أي مستخدم من صفحته</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90 disabled:opacity-60"><Save className="w-4 h-4"/>حفظ كل التغييرات</button>
      </div>
    </div>
  );
}
