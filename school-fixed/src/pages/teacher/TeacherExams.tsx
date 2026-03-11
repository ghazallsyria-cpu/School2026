import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExams, addExam, updateExam, deleteExam, getExamQuestions, addExamQuestion, deleteExamQuestion, getTeacherClasses, getTeacherSubjects, getExamResults } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, Send, CheckCircle, Circle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
type QType = "multiple_choice"|"true_false"|"short_answer";
const qLabel = (t:string) => t==="multiple_choice"?"اختيار متعدد":t==="true_false"?"صح/خطأ":"إجابة قصيرة";

export default function TeacherExams() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [tab, setTab] = useState<"questions"|"results">("questions");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [form, setForm] = useState({ title:"", subject_id:"", class_id:"", exam_type:"اختبار", duration_minutes:60, total_marks:100 });
  const [newQ, setNewQ] = useState<{question_text:string;question_type:QType;correct_answer:string;marks:number;options:string[]}>({question_text:"",question_type:"multiple_choice",correct_answer:"",marks:1,options:["","","",""]});

  const { data: exams = [] } = useQuery({ queryKey: ["teacher-exams", user?.id], queryFn: () => getExams({ teacher_id: user?.id }), enabled: !!user?.id });
  const { data: tClasses = [] } = useQuery({ queryKey: ["teacher-classes", user?.id], queryFn: () => getTeacherClasses(user!.id), enabled: !!user?.id });
  const { data: tSubjects = [] } = useQuery({ queryKey: ["teacher-subjects", user?.id], queryFn: () => getTeacherSubjects(user!.id), enabled: !!user?.id });
  const { data: questions = [] } = useQuery({ queryKey: ["exam-questions", sel?.id], queryFn: () => getExamQuestions(sel!.id), enabled: !!sel });
  const { data: results = [] } = useQuery({ queryKey: ["exam-results", sel?.id], queryFn: () => getExamResults(sel!.id), enabled: !!sel && tab==="results" });

  const addMut = useMutation({ mutationFn: () => addExam({ ...form, teacher_id: user!.id }), onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["teacher-exams"] }); setShowAdd(false); setSel(d); toast.success("تم الإنشاء"); } });
  const deleteMut = useMutation({ mutationFn: deleteExam, onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-exams"] }); setSel(null); toast.success("تم الحذف"); } });
  const togglePub = useMutation({ mutationFn: (e: any) => updateExam(e.id, { is_published: !e.is_published }), onSuccess: (d,e) => { qc.invalidateQueries({ queryKey: ["teacher-exams"] }); if(sel?.id===e.id) setSel({...sel,is_published:!sel.is_published}); toast.success(e.is_published?"إلغاء النشر":"تم نشر الاختبار"); } });
  const addQMut = useMutation({
    mutationFn: () => addExamQuestion({ exam_id:sel!.id, question_text:newQ.question_text, question_type:newQ.question_type, correct_answer:newQ.correct_answer, marks:newQ.marks, options:newQ.question_type==="multiple_choice"?newQ.options.filter(o=>o.trim()):["صح","خطأ"], question_order:(questions?.length||0)+1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-questions", sel?.id] }); setShowAddQ(false); setNewQ({question_text:"",question_type:"multiple_choice",correct_answer:"",marks:1,options:["","","",""]}); }
  });
  const delQMut = useMutation({ mutationFn: deleteExamQuestion, onSuccess: () => qc.invalidateQueries({ queryKey: ["exam-questions", sel?.id] }) });

  if (!sel) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold">اختباراتي</h1><p className="text-muted-foreground text-sm">{exams.length} اختبار</p></div>
        <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-medium hover:bg-primary/90"><Plus className="w-4 h-4"/>اختبار جديد</button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold">اختبار جديد</h2><button onClick={()=>setShowAdd(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4"/></button></div>
            <div className="space-y-3">
              <input placeholder="عنوان الاختبار *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              <select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">المادة *</option>{tSubjects.map((ts:any)=><option key={ts.subject_id} value={ts.subject_id}>{ts.subjects?.name}</option>)}</select>
              <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})} className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"><option value="">الفصل *</option>{tClasses.map((tc:any)=><option key={tc.class_id} value={tc.class_id}>{tc.classes?.name}</option>)}</select>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground block mb-1">المدة (دقيقة)</label><input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:+e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
                <div><label className="text-xs text-muted-foreground block mb-1">الدرجة الكاملة</label><input type="number" value={form.total_marks} onChange={e=>setForm({...form,total_marks:+e.target.value})} className="w-full px-3 py-2 bg-background border rounded-lg text-sm"/></div>
              </div>
              <div className="flex gap-2 justify-end"><button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addMut.mutate()} disabled={!form.title||!form.subject_id||!form.class_id} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إنشاء</button></div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>الاختبار</th><th>المادة</th><th>الفصل</th><th>المدة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {(exams as any[]).map((e:any)=>(
              <tr key={e.id} onClick={()=>{setSel(e);setTab("questions");}}>
                <td className="font-medium">{e.title}</td><td className="text-muted-foreground text-sm">{e.subjects?.name}</td><td className="text-muted-foreground text-sm">{e.classes?.name}</td><td className="text-muted-foreground text-sm">{e.duration_minutes} د</td>
                <td><span className={e.is_published?"badge-success":"badge-warning"}>{e.is_published?"منشور":"مسودة"}</span></td>
                <td onClick={ev=>ev.stopPropagation()}><div className="flex gap-1">
                  <button onClick={()=>togglePub.mutate(e)} className={`p-1.5 rounded ${e.is_published?"text-success hover:bg-success/10":"text-warning hover:bg-warning/10"}`}>{e.is_published?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
                  <button onClick={()=>deleteMut.mutate(e.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                </div></td>
              </tr>
            ))}
            {exams.length===0&&<tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد اختبارات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>setSel(null)} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
          <div><h2 className="font-heading font-bold">{sel.title}</h2><p className="text-xs text-muted-foreground">{sel.subjects?.name} • {sel.classes?.name}</p></div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border overflow-hidden">{["questions","results"].map(t=><button key={t} onClick={()=>setTab(t as any)} className={`px-3 py-1.5 text-xs font-heading ${tab===t?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground"}`}>{t==="questions"?"الأسئلة":"النتائج"}</button>)}</div>
          <button onClick={()=>togglePub.mutate(sel)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-heading ${sel.is_published?"bg-warning/10 text-warning border border-warning/20":"bg-success text-success-foreground"}`}>{sel.is_published?<><EyeOff className="w-4 h-4"/>إلغاء النشر</>:<><Send className="w-4 h-4"/>نشر</>}</button>
        </div>
      </div>

      {tab==="questions" && (
        <div className="space-y-3">
          {(questions as any[]).map((q:any,i:number)=>(
            <div key={q.id} className="bg-card rounded-lg border p-4 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{q.question_text}</p>
                    {q.question_type==="multiple_choice"&&Array.isArray(q.options)&&<div className="mt-2 grid grid-cols-2 gap-1">{q.options.map((opt:string,oi:number)=><div key={oi} className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${opt===q.correct_answer?"bg-success/10 text-success":"bg-accent text-muted-foreground"}`}>{opt===q.correct_answer?<CheckCircle className="w-3 h-3"/>:<Circle className="w-3 h-3"/>}{opt}</div>)}</div>}
                    {q.question_type==="true_false"&&<div className="mt-2 flex gap-2">{["صح","خطأ"].map(opt=><span key={opt} className={`text-xs px-2 py-1 rounded ${opt===q.correct_answer?"bg-success/10 text-success":"bg-accent text-muted-foreground"}`}>{opt}</span>)}</div>}
                    <p className="text-xs text-muted-foreground mt-1">{qLabel(q.question_type)} • {q.marks} درجة</p>
                  </div>
                </div>
                <button onClick={()=>delQMut.mutate(q.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
          {!showAddQ ? (
            <button onClick={()=>setShowAddQ(true)} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>إضافة سؤال</button>
          ) : (
            <div className="bg-card rounded-lg border p-5 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-heading font-semibold text-sm">سؤال جديد</h3><button onClick={()=>setShowAddQ(false)} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4 text-muted-foreground"/></button></div>
              <div className="flex gap-2">{(["multiple_choice","true_false","short_answer"] as QType[]).map(t=><button key={t} onClick={()=>setNewQ({...newQ,question_type:t,correct_answer:"",options:["","","",""]})} className={`px-3 py-2 rounded-lg text-xs font-heading border ${newQ.question_type===t?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>{qLabel(t)}</button>)}</div>
              <textarea value={newQ.question_text} onChange={e=>setNewQ({...newQ,question_text:e.target.value})} placeholder="نص السؤال..." className="w-full px-4 py-3 bg-background border rounded-lg text-sm resize-none h-20" dir="rtl"/>
              {newQ.question_type==="multiple_choice"&&<div className="space-y-2">{newQ.options.map((opt,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <button onClick={()=>setNewQ({...newQ,correct_answer:opt})} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${newQ.correct_answer===opt&&opt?"border-success bg-success":"border-muted-foreground"}`}>{newQ.correct_answer===opt&&opt&&<div className="w-2 h-2 rounded-full bg-white"/>}</button>
                  <input value={opt} onChange={e=>{const o=[...newQ.options];o[i]=e.target.value;setNewQ({...newQ,options:o});}} placeholder={`خيار ${i+1}`} className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm"/>
                </div>
              ))}</div>}
              {newQ.question_type==="true_false"&&<div className="flex gap-3">{["صح","خطأ"].map(opt=><button key={opt} onClick={()=>setNewQ({...newQ,correct_answer:opt})} className={`flex-1 py-2.5 rounded-lg border text-sm font-heading ${newQ.correct_answer===opt?"bg-success/10 border-success text-success":"hover:bg-accent"}`}>{opt==="صح"?"✓ صح":"✗ خطأ"}</button>)}</div>}
              {newQ.question_type==="short_answer"&&<input value={newQ.correct_answer} onChange={e=>setNewQ({...newQ,correct_answer:e.target.value})} placeholder="الإجابة النموذجية..." className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">الدرجة:</span><input type="number" min="0.5" step="0.5" value={newQ.marks} onChange={e=>setNewQ({...newQ,marks:+e.target.value})} className="w-20 px-3 py-1.5 bg-background border rounded-lg text-sm text-center"/></div>
                <div className="flex gap-2"><button onClick={()=>setShowAddQ(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-accent">إلغاء</button><button onClick={()=>addQMut.mutate()} disabled={!newQ.question_text.trim()||(newQ.question_type!=="short_answer"&&!newQ.correct_answer)} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">إضافة</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="results" && (
        <div className="space-y-4">
          {results.length>0?(
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border p-4 text-center"><p className="text-2xl font-bold text-primary">{results.length}</p><p className="text-xs text-muted-foreground">أجرى الاختبار</p></div>
                <div className="bg-card rounded-lg border p-4 text-center"><p className="text-2xl font-bold text-success">{results.filter((r:any)=>r.percentage>=60).length}</p><p className="text-xs text-muted-foreground">ناجح</p></div>
                <div className="bg-card rounded-lg border p-4 text-center"><p className="text-2xl font-bold text-info">{results.length>0?(results.reduce((s:number,r:any)=>s+r.percentage,0)/results.length).toFixed(1):0}%</p><p className="text-xs text-muted-foreground">المعدل</p></div>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(results as any[]).map(r=>({name:r.student?.full_name?.split(" ")[0],score:r.percentage}))}>
                    <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><Tooltip formatter={(v)=>[`${v}%`]}/>
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ):<p className="text-center text-muted-foreground py-8">لا توجد نتائج بعد</p>}
        </div>
      )}
    </div>
  );
}
