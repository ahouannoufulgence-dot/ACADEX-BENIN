const handleSend = async (overrideText?: string) => {
  const text = overrideText || input
  if (!text.trim() || loading || !userRole) return

  const userId = localStorage.getItem('acadex_user_id') || ""
  const activeYear = localStorage.getItem('acadex_active_year') || "2026-2027"
  
  const newMessage: Message = { role: 'user', content: text, timestamp: new Date() }
  setMessages(prev => [...prev, newMessage])
  setInput("")
  setLoading(true)

  try {
    // Charger les notes Firebase de l'élève
    let contextData: any = { 
      schoolName: schoolInfo.name,
      year: activeYear,
    }

    if (userRole === "Élève" && userId) {
      const { collection, query, where, getDocs } = await import("firebase/firestore")
      
      // Charger les notes
      const gradesQuery = query(
        collection(db, "grades"), 
        where("studentId", "==", userId),
        where("academicYear", "==", activeYear)
      )
      const gradesSnap = await getDocs(gradesQuery)
      const gradesData = gradesSnap.docs.map(d => d.data())

      // Charger les absences
      const lifeQuery = query(
        collection(db, "student_life"),
        where("studentId", "==", userId),
        where("academicYear", "==", activeYear)
      )
      const lifeSnap = await getDocs(lifeQuery)
      const lifeData = lifeSnap.docs.map(d => d.data())

      // Calculer les moyennes par matière (même logique que notes/page.tsx)
      const subjects: Record<string, any> = {}
      gradesData.forEach((g: any) => {
        if (!subjects[g.subject]) {
          subjects[g.subject] = { 
            name: g.subject, 
            coef: Number(g.coefficient) || 1, 
            details: { int1: null, int2: null, int3: null, dev1: null, dev2: null } 
          }
        }
        subjects[g.subject].details[g.type] = Number(g.value)
      })

      const notes: Record<string, number> = {}
      let totalWeighted = 0, totalCoef = 0

      Object.values(subjects).forEach((s: any) => {
        const interros = [s.details.int1, s.details.int2, s.details.int3].filter(v => v !== null)
        const avgInt = interros.length > 0 ? interros.reduce((a: number, b: number) => a + b, 0) / interros.length : null
        const pillars = []
        if (avgInt !== null) pillars.push(avgInt)
        if (s.details.dev1 !== null) pillars.push(s.details.dev1)
        if (s.details.dev2 !== null) pillars.push(s.details.dev2)
        const avg = pillars.length > 0 ? pillars.reduce((a: number, b: number) => a + b, 0) / pillars.length : 0
        notes[s.name] = Number(avg.toFixed(2))
        totalWeighted += avg * s.coef
        totalCoef += s.coef
      })

      const moyenneGenerale = totalCoef > 0 ? totalWeighted / totalCoef : 0
      const absences = lifeData.filter((e: any) => e.type === "absence").length

      contextData = {
        ...contextData,
        notes,
        moyenneGenerale: Number(moyenneGenerale.toFixed(2)),
        absences,
        nomEleve: localStorage.getItem('acadex_user_name') || userId,
      }
    }

    const result = await askAcadexBrain({
      question: text,
      userRole: userRole as any,
      userId,
      contextData
    })

    if (result.error) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Erreur IA : ${result.error}`,
        timestamp: new Date(),
      }])
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        suggestions: result.suggestions
      }])
    }
  } catch (e: any) {
    setMessages(prev => [...prev, {
      role: 'error',
      content: "Une erreur critique de communication avec le serveur est survenue.",
      timestamp: new Date()
    }])
  } finally {
    setLoading(false)
  }
}