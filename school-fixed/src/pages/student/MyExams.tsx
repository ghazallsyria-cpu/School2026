import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getExams, getExamQuestions, submitExamAnswers, upsertExamResult, getStudentExamResults } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ClipboardList, Clock, Send, CheckCircle, X } from "lucide-react";

export default function MyExams() {
  const { user } = useAuth();
  const [taking, setTaking] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<any>(null);

  const { data: exams = [] } = useQuery({
    queryKey: ["my-exams", user?.class_id],
    queryFn: () => getExams({ class_id: user!.class_id! }),
    enabled: !!user?.class_id,
    select: (data) => data?.filter((e: any) => e.is_published) ?? []
  });
  const { data: results = [] } = useQuery({ queryKey: ["my-exam-results", user?.id], queryFn: () => getStudentExamResults(user!.id), enabled: !!user?.id });
  const { data: questions = [] } = useQuery({ queryKey: ["exam-q-take", taking?.id], queryFn: () => getExamQuestions(taking!.id), enabled: !!taking });

  const submitMut = useMutation({
    mutationFn: async () => {
      const qs = questions as any[];
      const answerList = qs.map(q => ({ question_id: q.id, answer: answers[q.id] || "" }));
      await submitExamAnswers(taking.id, user!.id, answerList);
      let obtained = 0;
      qs.forEach(q => { if (answers[q.id] === q.correct_answer) obtained += Number(q.marks); });
      const percentage = Math.round((obtained / taking.total_marks) * 100);
      const result = await upsertExamResult({ exam_id: taking.id, student_id: user!.id, total_marks: taking.total_marks, obtained_marks: obtained, percentage, status: percentage >= 60 ? "ناجح" : "راسب", submitted_at: new Date().toISOString() });
      return { obtained, percentage, total: taking.total_marks };
    },
    onSuccess: (data) => { setSubmitted(true); setScore(data); toast.success("تم تسليم الاختبار"); },
    onError: () => toast.error("خطأ في التسليم")
  });

  const takenExamIds = new Set((results as any[]).map(r => r.exam_id));

  if (taking) {
    if (submitted && score) return (
      <div className="max-w-lg mx-auto space-y-5 text-center">
        <div className="bg-card rounded-xl border p-8">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${score.percentage>=60?"bg-success/10":"bg-destructive/10"}`}>
            <p className={`text-3xl font-bold font-heading ${score.percentage>=60?"text-success":"text-destructive"}`}>{score.percentage}%</p>
          </div>
          <h2 className="font-heading font-bold text-xl mb-1">{score.percentage>=60?"أحسنت! ناجح ✓":"للأسف، راسب ✗"}</h2>
          <p className="text-muted-foreground">حصلت على {score.obtained} من {score.total} درجة</p>
          <div className="mt-4 h-3 bg-accent rounded-full overflow-hidden"><div className={`h-full rounded-full ${score.percentage>=60?"bg-success":"bg-destructive"}`} style={{width:`${score.percentage}%`}}/></div>
          <button onClick={()=>{setTaking(null);setSubmitted(false);setScore(null);setAnswers({});}} className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading">العودة للاختبارات</button>
        </div>
      </div>
    );
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="flex items-center justify-between bg-card border rounded-lg p-4">
          <div><h2 className="font-heading font-bold">{taking.title}</h2><p className="text-xs text-muted-foreground">{taking.subjects?.name} • {taking.duration_minutes} دقيقة</p></div>
          <button onClick={()=>{setTaking(null);setAnswers({});}} className="p-2 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4"/></button>
        </div>
        <p className="text-sm text-muted-foreground">أجب على جميع الأسئلة ثم اضغط تسليم</p>
        {(questions as any[]).map((q: any, i: number) => (
          <div key={q.id} className="bg-card rounded-lg border p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-heading font-bold flex items-center justify-center shrink-0">{i+1}</span>
              <p className="text-sm font-medium leading-relaxed">{q.question_text}</p>
            </div>
            <div className="pr-10">
              {q.question_type==="multiple_choice"&&Array.isArray(q.options)&&(
                <div className="space-y-2">{q.options.map((opt: string, oi: number)=>(
                  <button key={oi} onClick={()=>setAnswers({...answers,[q.id]:opt})} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-right transition-colors ${answers[q.id]===opt?"bg-primary/10 border-primary text-primary":"hover:bg-accent"}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[q.id]===opt?"border-primary bg-primary":"border-muted-foreground"}`}>{answers[q.id]===opt&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}</span>
                    {opt}
                  </button>
                ))}</div>
              )}
              {q.question_type==="true_false"&&(
                <div className="flex gap-3">{["صح","خطأ"].map(opt=><button key={opt} onClick={()=>setAnswers({...answers,[q.id]:opt})} className={`flex-1 py-3 rounded-lg border text-sm font-heading font-medium ${answers[q.id]===opt?"bg-primary/10 border-primary text-primary":"hover:bg-accent"}`}>{opt==="صح"?"✓ صح":"✗ خطأ"}</button>)}</div>
              )}
              {q.question_type==="short_answer"&&(
                <input value={answers[q.id]||""} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} placeholder="اكتب إجابتك هنا..." className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"/>
              )}
            </div>
          </div>
        ))}
        <button onClick={()=>submitMut.mutate()} disabled={submitMut.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-bold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
          <Send className="w-4 h-4"/>{submitMut.isPending?"جارٍ التسليم...":"تسليم الاختبار"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-bold">اختباراتي</h1><p className="text-muted-foreground text-sm mt-1">{exams.length} اختبار متاح</p></div>
      {!user?.class_id && <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-warning">لم يتم تعيينك في فصل دراسي.</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(exams as any[]).map((e: any) => {
          const taken = takenExamIds.has(e.id);
          const result = (results as any[]).find(r => r.exam_id === e.id);
          return (
            <div key={e.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-info">{e.exam_type}</span>
                {taken && <span className={result?.percentage>=60?"badge-success":"badge-destructive"}>{result?.percentage}%</span>}
              </div>
              <h3 className="font-heading font-semibold">{e.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{e.subjects?.name}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{e.duration_minutes} دقيقة</span>
                <span>{e.total_marks} درجة</span>
              </div>
              {taken ? (
                <div className={`mt-4 py-2 text-center rounded-lg text-xs font-heading ${result?.percentage>=60?"bg-success/10 text-success":"bg-destructive/10 text-destructive"}`}>
                  <CheckCircle className="w-3.5 h-3.5 inline ml-1"/>{result?.percentage>=60?"ناجح":"راسب"} • {result?.obtained_marks}/{result?.total_marks}
                </div>
              ) : (
                <button onClick={()=>{setTaking(e);setAnswers({});}} className="w-full mt-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading hover:bg-primary/90">ابدأ الاختبار</button>
              )}
            </div>
          );
        })}
      </div>
      {!isLoading && exams.length===0 && user?.class_id && <div className="text-center py-12 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد اختبارات منشورة حالياً</p></div>}
    </div>
  );
  var isLoading = false;
}
