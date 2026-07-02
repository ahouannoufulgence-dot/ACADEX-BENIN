import { supabase } from "@/lib/supabase"

export interface ConductConfig {
  note_depart: number
  seuil_absences: number
  bareme: Record<string, number>
}

export interface ConductResult {
  noteConduite: number
  totalPoints: number
  sanctionsCount: number
  sanctions: any[]
}

/**
 * Récupère la configuration de conduite depuis Supabase (source unique)
 */
export async function getConductConfig(): Promise<ConductConfig> {
  const { data } = await supabase.from('conduct_config').select('*').eq('id', 'main').single()
  return {
    note_depart: data?.note_depart ?? 20,
    seuil_absences: data?.seuil_absences ?? 3,
    bareme: data?.bareme || {}
  }
}

/**
 * Calcule la note de conduite d'un élève pour un trimestre donné.
 * Formule unique utilisée partout dans ACADEX (Notes, Cahier de Vie, Bulletin).
 */
export async function getStudentConduct(
  studentMatricule: string,
  academicYear: string,
  trimestre: string,
  config?: ConductConfig
): Promise<ConductResult> {
  const conductConfig = config || await getConductConfig()

  const { data: sanctions } = await supabase
    .from('sanctions')
    .select('*')
    .eq('student_matricule', studentMatricule)
    .eq('academic_year', academicYear)
    .eq('trimestre', trimestre)

  const sanctionsList = sanctions || []
  const totalPoints = sanctionsList.reduce((acc, s) => acc + (Number(s.points_retires) || 0), 0)
  const noteConduite = Math.max(0, (conductConfig.note_depart || 20) - totalPoints)

  return {
    noteConduite,
    totalPoints,
    sanctionsCount: sanctionsList.length,
    sanctions: sanctionsList
  }
}

/**
 * Calcule la conduite pour les 3 trimestres d'un élève (pour moyenne annuelle)
 */
export async function getStudentConductAllTerms(
  studentMatricule: string,
  academicYear: string
): Promise<Record<'T1' | 'T2' | 'T3', number>> {
  const config = await getConductConfig()
  const results: any = {}
  for (const term of ['T1', 'T2', 'T3']) {
    const r = await getStudentConduct(studentMatricule, academicYear, term, config)
    results[term] = r.noteConduite
  }
  return results
}