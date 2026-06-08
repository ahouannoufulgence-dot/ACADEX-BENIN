
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Send, 
  MoreVertical, 
  Paperclip, 
  Plus, 
  CheckCheck,
  Loader2,
  MessageCircle,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Bot
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useMemo, useEffect, useRef } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  limit, 
  getDocs, 
  setDoc,
  increment
} from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function MessagingPage() {
  const db = useFirestore()
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = localStorage.getItem('acadex_user_id') || ""
    const name = localStorage.getItem('acadex_user_name') || "Utilisateur"
    const role = localStorage.getItem('acadex_user_role') || "Élève"
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    
    setCurrentUserId(id)
    setCurrentUserName(name)
    setCurrentUserRole(role)
    setUserClasses(classes)
  }, [])

  const conversationsQuery = useMemo(() => {
    if (!db || !currentUserId) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    )
  }, [db, currentUserId])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    )
  }, [db, selectedChat])

  const { data: messages } = useCollection(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (selectedChat && db && currentUserId) {
      const convRef = doc(db, "conversations", selectedChat.id)
      updateDoc(convRef, {
        [`unreadCount.${currentUserId}`]: 0
      })
    }
  }, [messages, selectedChat, currentUserId, db])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedChat || !currentUserId || !db) return
    const text = messageText
    setMessageText("")

    const messageData = {
      senderId: currentUserId,
      senderName: currentUserName,
      text,
      timestamp: serverTimestamp(),
      type: 'text'
    }

    addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData)
    
    const updates: any = {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    }

    selectedChat.participants.forEach((pId: string) => {
      if (pId !== currentUserId) {
        updates[`unreadCount.${pId}`] = increment(1)
      }
    })

    updateDoc(doc(db, "conversations", selectedChat.id), updates)
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const teachersSnap = await getDocs(collection(db, "teachers"))
      const studentsSnap = await getDocs(collection(db, "students"))
      let allContacts: any[] = []

      if (currentUserRole === "Directeur") {
        allContacts = [
          ...teachersSnap.docs.map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Enseignant', sub: d.data().subject, type: 'private' })),
          ...studentsSnap.docs.map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', sub: d.data().classId, type: 'private' }))
        ]
      } else if (currentUserRole === "Enseignant") {
        const myStudents = studentsSnap.docs
          .filter(d => userClasses.includes(d.data().classId))
          .map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', sub: d.data().classId, type: 'private' }))
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Administration', type: 'private' }, ...myStudents]
        userClasses.forEach(cls => allContacts.push({ id: `GROUP_${cls}`, name: `Classe ${cls}`, role: 'Groupe', sub: 'Discussion Collective', type: 'class', classId: cls }))
      } else {
        const parts = currentUserId.split('-')
        const studentClass = parts.length > 1 ? parts[1] : ""
        const myTeachers = teachersSnap.docs
          .filter(d => d.data().classes?.includes(studentClass))
          .map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Professeur', sub: d.data().subject, type: 'private' }))
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Administration', type: 'private' }, ...myTeachers]
      }
      setContacts(allContacts.filter(c => c.id !== currentUserId))
    } catch (e) { console.error(e) } 
    finally { setLoadingContacts(false) }
  }

  const startConversation = async (contact: any) => {
    const convId = contact.type === 'class' ? contact.id : [currentUserId, contact.id].sort().join("_")
    const convRef = doc(db, "conversations", convId)
    const participants = contact.type === 'class' ? [currentUserId] : [currentUserId, contact.id]

    await setDoc(convRef, {
      id: convId,
      participants,
      type: contact.type,
      participantNames: { [currentUserId]: currentUserName, [contact.id]: contact.name },
      lastMessage: "Discussion démarrée",
      lastMessageTime: serverTimestamp(),
      unreadCount: { [currentUserId]: 0, [contact.id]: 0 }
    }, { merge: true })

    setSelectedChat({ id: convId, participants, otherName: contact.name, type: contact.type })
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    let list = conversations
    if (activeTab === "unread") list = conversations.filter(c => (c.unreadCount?.[currentUserId] || 0) > 0)
    return list.filter(c => {
      const otherId = c.participants.find((p: string) => p !== currentUserId)
      const name = c.participantNames?.[otherId] || c.id
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.lastMessage?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, activeTab, currentUserId])

  const formatTime = (ts: any) => {
    if (!ts) return ""
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    const now = new Date()
    return date.toDateString() === now.toDateString() 
      ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100svh-12rem)] md:h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
        
        <Card className={cn(
          "flex-col overflow-hidden border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] w-full md:w-[420px] transition-all",
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-6 md:p-10 pb-4">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight uppercase">Canal <span className="text-primary italic">Scellé</span></h2>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2">
                   <ShieldCheck className="size-3 text-emerald-500" /> Sécurité Acadex
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={fetchContacts} className="size-11 md:size-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all mobile-touch-target">
                    <Plus className="size-5 md:size-7" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                  <div className="p-6 md:p-10 bg-primary text-white">
                    <DialogTitle className="text-xl md:text-3xl font-black">Nouveau Message</DialogTitle>
                    <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mt-1">Sélectionnez un destinataire certifié</p>
                  </div>
                  <div className="p-5 md:p-8 space-y-6 bg-[#F8FAFC]">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Rechercher un contact..." className="pl-12 h-13 rounded-2xl border-none shadow-inner font-bold bg-white" />
                    </div>
                    <ScrollArea className="h-[350px] md:h-[450px] pr-2 no-scrollbar">
                      {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
                           <Loader2 className="animate-spin text-primary size-10" />
                           <p className="text-[9px] font-black uppercase tracking-widest">Appel de l'annuaire...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {contacts.map((c) => (
                            <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all text-left group border-2 border-transparent hover:border-primary/10">
                              <Avatar className="size-12 border-4 border-white shadow-sm group-hover:border-primary/20 transition-all"><AvatarFallback className="bg-primary/5 text-primary font-black text-lg">{c.name?.[0]}</AvatarFallback></Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm md:text-lg truncate uppercase tracking-tight">{c.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-muted/50 text-muted-foreground">{c.role}</Badge>
                                  <span className="text-[8px] font-bold text-primary uppercase">{c.sub}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-5 mb-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input placeholder="Chercher une discussion..." className="pl-11 h-12 bg-muted/30 border-none rounded-2xl font-bold text-xs shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-muted/30 p-1 rounded-2xl h-11">
                  <TabsTrigger value="all" className="flex-1 rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white">TOUT</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1 rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-white">NON LUS</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 no-scrollbar bg-muted/5">
            {loadingConvs ? (
              <div className="flex justify-center py-20 animate-pulse opacity-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-20 text-center space-y-4 opacity-30">
                 <MessageCircle className="size-10 mx-auto" />
                 <p className="text-[8px] font-black uppercase tracking-widest">Aucune discussion</p>
              </div>
            ) : filteredConversations.map((chat: any) => {
              const otherId = chat.participants.find((p: string) => p !== currentUserId)
              const name = chat.participantNames?.[otherId] || (chat.type === 'class' ? chat.id : "Utilisateur")
              const unread = chat.unreadCount?.[currentUserId] || 0
              const isActive = selectedChat?.id === chat.id
              return (
                <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={cn(
                  "flex items-center gap-4 p-4 rounded-[1.8rem] cursor-pointer transition-all border-2",
                  isActive ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" : "bg-white hover:bg-muted/5 border-transparent shadow-sm"
                )}>
                  <div className="relative shrink-0">
                    <Avatar className={cn("size-12 border-4 transition-all", isActive ? "border-white/20" : "border-white")}>
                      <AvatarFallback className={cn("font-black text-lg", isActive ? "bg-white/10 text-white" : "bg-primary/5 text-primary")}>{name?.[0]}</AvatarFallback>
                    </Avatar>
                    {unread > 0 && <div className="absolute -top-1 -right-1 size-5 bg-amber-400 text-black font-black text-[10px] rounded-full flex items-center justify-center border-4 border-white animate-bounce">{unread}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-black truncate text-xs md:text-base uppercase tracking-tight">{name}</h4>
                      <span className={cn("text-[7px] font-black uppercase", isActive ? "text-white/60" : "opacity-40")}>{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <p className={cn("text-[9px] md:text-xs truncate font-medium", isActive ? "text-white/80" : "text-muted-foreground")}>{chat.lastMessage}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className={cn(
          "flex-1 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] flex-col overflow-hidden relative transition-all",
          !selectedChat ? "hidden md:flex" : "fixed inset-0 z-50 md:relative md:flex"
        )}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F8FAFC]/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Zap className="size-64" /></div>
              <div className="size-24 bg-white rounded-[3rem] flex items-center justify-center shadow-xl mb-8 relative z-10">
                <ShieldCheck className="size-12 text-primary" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-3 uppercase tracking-tight relative z-10">Espace Crypté</h3>
              <p className="text-[9px] md:text-sm font-bold text-muted-foreground max-w-xs uppercase tracking-widest relative z-10">Communications certifiées ACADEX • AES-256</p>
            </div>
          ) : (
            <>
              <div className="p-4 md:p-8 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3 md:gap-8">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl bg-muted/50 size-10 mobile-touch-target" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-6" /></Button>
                  <Avatar className="size-11 md:size-16 border-4 border-muted/20 shadow-sm"><AvatarFallback className="font-black text-xl bg-primary/5 text-primary">{selectedChat.otherName?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <h3 className="text-base md:text-2xl font-black tracking-tight uppercase">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-2">
                       <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[7px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">En ligne scellé</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-12 rounded-2xl hover:bg-muted mobile-touch-target">
                  <MoreVertical className="size-5 text-muted-foreground" />
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-14 space-y-6 md:space-y-10 bg-[#F8FAFC]/50 scroll-smooth no-scrollbar">
                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id || i} className={cn("flex animate-in slide-in-from-bottom-2", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "group relative p-4 md:p-8 rounded-[1.8rem] md:rounded-[3rem] text-xs md:text-lg font-medium shadow-sm leading-relaxed max-w-[88%] md:max-w-[75%]",
                        isMe ? "bg-primary text-white rounded-br-none shadow-primary/20" : "bg-white text-foreground rounded-bl-none border border-muted/30"
                      )}>
                        {msg.text}
                        <div className="flex justify-end gap-1.5 opacity-40 mt-2">
                           <span className="text-[7px] md:text-[10px] font-black uppercase">{formatTime(msg.timestamp)}</span>
                           {isMe && <CheckCheck className="size-2 md:size-3" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 md:p-10 pt-4 bg-white border-t border-muted/10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 md:gap-6 bg-muted/40 p-2 md:p-3 pl-5 md:pl-10 rounded-[2rem] md:rounded-[3rem] border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner">
                  <Input 
                    placeholder="Votre message scellé..." 
                    className="flex-1 bg-transparent border-none shadow-none h-11 md:h-16 font-bold focus-visible:ring-0 text-sm md:text-xl placeholder:text-muted-foreground/30" 
                    value={messageText} 
                    onChange={(e) => setMessageText(e.target.value)} 
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" className="size-10 md:size-14 rounded-2xl text-muted-foreground hidden sm:flex"><Paperclip className="size-4 md:size-7" /></Button>
                    <Button type="submit" disabled={!messageText.trim()} className="bg-primary text-white size-11 md:size-16 rounded-[1.1rem] md:rounded-3xl shadow-xl transition-all active:scale-90 mobile-touch-target">
                      <Send className="size-5 md:size-8" />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
