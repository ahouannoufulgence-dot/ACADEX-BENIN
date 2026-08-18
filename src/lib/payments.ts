import { supabase } from "@/lib/supabase"

export interface PaymentStatus {
  totalPaid: number
  totalDue: number
  percent: number
}

export async function getPaymentStatus(studentMatricule: string, academicYear: string): Promise<PaymentStatus> {
  const { data: studentData } = await supabase
    .from('students')
    .select('class_id')
    .eq('matricule', studentMatricule)
    .single()

  const classId = studentData?.class_id || ""

  let totalDue = 0
  if (classId) {
    const { data: feeData } = await supabase
      .from('class_fees')
      .select('amount')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .single()
    if (feeData) totalDue = Number(feeData.amount) || 0
  }

  const { data: payData } = await supabase
    .from('payments')
    .select('amount_paid, status')
    .eq('student_matricule', studentMatricule)
    .eq('academic_year', academicYear)

  // Seuls les paiements confirmés ("Payé") comptent pour débloquer les notes
  const totalPaid = (payData || [])
    .filter((p: any) => p.status === 'Payé')
    .reduce((acc: number, p: any) => acc + Number(p.amount_paid), 0)

  const percent = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0
  return { totalPaid, totalDue, percent }
}

export const TERM_THRESHOLDS: Record<string, number> = {
  T1: 0,
  T2: 34,
  T3: 67,
}
export const BULLETIN_THRESHOLD = 100

export function isTermUnlocked(term: string, percent: number): boolean {
  return percent >= (TERM_THRESHOLDS[term] ?? 0)
}
