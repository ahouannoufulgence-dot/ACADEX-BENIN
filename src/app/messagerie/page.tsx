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
import { useFirestore, useCollection } from "@/firebase"
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
    setCurrentUserId(localStorage.getItem('acadex_user_id') || "")
    setCurrentUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setCurrentUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    if (selectedChat && db && currentUserId) {
      updateDoc(doc(db, "conversations", selectedChat.id), { [`unreadCount.${currentUserId}`]: 0 })
    }
  }, [messages, selectedChat, currentUserId, db])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedChat || !currentUserId || !db) return
    const text = messageText
    setMessageText("")

    addDoc(collection(db, "conversations", selectedChat.id, "messages"), {
      senderId: currentUserId,
      senderName: currentUserName,
      text,
      timestamp: serverTimestamp(),
      type: 'text'
    })
    
    const updates: any = { lastMessage: text, lastMessageTime: serverTimestamp() }
    selectedChat.participants.forEach((pId: string) => { if (pId !== currentUserId) updates[`unreadCount.${pId}`] = increment(1) })
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
          ...teachersSnap.docs.map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Prof', sub: d.data().subject })),
          ...studentsSnap.docs.map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', sub: d.data().classId }))
        ]
      } else if (currentUserRole === "Enseignant") {
        const myStudents = studentsSnap.docs
          .filter(d => userClasses.includes(d.data().classId))
          .map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', sub: d.data().classId }))
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Admin' }, ...myStudents]
      } else {
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Admin' }]
      }
      
      setContacts(allContacts.filter(c => c.id !== currentUserId).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) { console.error(e) } 
    finally { setLoadingContacts(false) }
  }

  const startConversation = async (contact: any) => {
    const convId = [currentUserId, contact.id].sort().join("_")
    const convRef = doc(db, "conversations", convId)
    await setDoc(convRef, {
      id: convId,
      participants: [currentUserId, contact.id],
      type: 'private',
      participantNames: { [currentUserId]: currentUserName, [contact.id]: contact.name },
      lastMessage: "Conversation démarrée",
      lastMessageTime: serverTimestamp(),
      unreadCount: { [currentUserId]: 0, [contact.id]: 0 }
    }, { merge: true })
    setSelectedChat({ id: convId, participants: [currentUserId, contact.id], otherName: contact.name })
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    let list = conversations
    if (activeTab === "unread") list = conversations.filter(c => (c.unreadCount?.[currentUserId] || 0) > 0)
    return list.filter(c => {
      const otherId = c.participants.find((p: string) => p !== currentUserId)
      const name = c.participantNames?.[otherId] || "Utilisateur"
      return name.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, activeTab, currentUserId])

  return (
    <DashboardLayout>
      <div className="h-[calc(100svh-12rem)] md:h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
        
        <Card className={cn(
          "flex-col overflow-hidden border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[2.5rem] w-full md:w-[380px] transition-all",
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-5 md:p-10 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">Canal <span className="text-primary italic">Live</span></h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" onClick={fetchContacts} className="size-11 md:size-14 rounded-2xl bg-primary text-white shadow-xl active:scale-90 transition-all"><Plus className="size-5 md:size-7" /></Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none">
                  <div className="p-6 md:p-10 bg-primary text-white"><DialogTitle className="text-xl md:text-3xl font-black uppercase">Nouveau Message</DialogTitle></div>
                  <ScrollArea className="h-[400px] p-4 bg-[#F8FAFC]">
                    {loadingContacts ? <Loader2 className="animate-spin text-primary size-8 mx-auto" /> : 
                      contacts.map(c => (
                        <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all text-left mb-2">
                          <Avatar className="size-10 border-2 border-white"><AvatarFallback className="bg-primary/5 text-primary font-black text-xs">{c.name?.[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0"><p className="font-black text-sm truncate uppercase">{c.name}</p><Badge variant="outline" className="text-[7px] font-black uppercase">{c.role} • {c.sub}</Badge></div>
                        </button>
                    ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative mb-4"><Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><Input placeholder="Chercher..." className="pl-11 h-11 bg-muted/30 border-none rounded-xl font-bold text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4"><TabsList className="w-full bg-muted/30 p-1 rounded-xl h-10"><TabsTrigger value="all" className="flex-1 rounded-lg font-black text-[8px] uppercase">TOUT</TabsTrigger><TabsTrigger value="unread" className="flex-1 rounded-lg font-black text-[8px] uppercase">LUS</TabsTrigger></TabsList></Tabs>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar bg-muted/5">
            {loadingConvs ? <Loader2 className="size-6 animate-spin text-primary mx-auto" /> : 
              filteredConversations.map(chat => {
                const otherId = chat.participants.find((p: string) => p !== currentUserId)
                const name = chat.participantNames?.[otherId] || "Utilisateur"
                const unread = chat.unreadCount?.[currentUserId] || 0
                return (
                  <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border-2",
                    selectedChat?.id === chat.id ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" : "bg-white hover:bg-muted/5 border-transparent shadow-sm"
                  )}>
                    <Avatar className={cn("size-10 border-2 transition-all", selectedChat?.id === chat.id ? "border-white/20" : "border-white")}>
                      <AvatarFallback className="font-black text-xs uppercase">{name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5"><h4 className="font-black truncate text-xs uppercase">{name}</h4>{unread > 0 && <div className="size-2 bg-amber-400 rounded-full animate-pulse shadow-md" />}</div>
                      <p className={cn("text-[9px] truncate font-medium", selectedChat?.id === chat.id ? "text-white/80" : "text-muted-foreground")}>{chat.lastMessage}</p>
                    </div>
                  </div>
                )
            })}
          </div>
        </Card>

        <Card className={cn(
          "flex-1 border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[2.5rem] flex-col overflow-hidden relative transition-all",
          !selectedChat ? "hidden md:flex" : "fixed inset-0 z-50 md:relative md:flex"
        )}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group">
              <Zap className="size-16 md:size-24 text-primary/10 mb-6 animate-pulse" />
              <h3 className="text-xl md:text-4xl font-black uppercase tracking-tight">Canal Sécurisé</h3>
              <p className="text-[8px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Communications certifiées ACADEX • AES-256</p>
            </div>
          ) : (
            <>
              <div className="p-4 md:p-8 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3 md:gap-8">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-lg bg-muted/50" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-5" /></Button>
                  <Avatar className="size-10 md:size-14 border-2 border-muted/20 shadow-sm"><AvatarFallback className="font-black text-sm bg-primary/5 text-primary uppercase">{selectedChat.otherName?.[0]}</AvatarFallback></Avatar>
                  <div><h3 className="text-sm md:text-xl font-black tracking-tight uppercase truncate max-w-[120px] md:max-w-none">{selectedChat.otherName}</h3><div className="flex items-center gap-1.5"><div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[7px] md:text-[9px] font-black text-emerald-600 uppercase">Canal Scellé</span></div></div>
                </div>
                <Button variant="ghost" size="icon" className="size-10 rounded-lg hover:bg-muted"><MoreVertical className="size-4 text-muted-foreground" /></Button>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 space-y-4 md:space-y-8 bg-[#F8FAFC]/50 scroll-smooth no-scrollbar">
                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id || i} className={cn("flex animate-in slide-in-from-bottom-2", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-[10px] md:text-lg font-medium shadow-sm leading-relaxed max-w-[85%] md:max-w-[70%]",
                        isMe ? "bg-primary text-white rounded-br-none shadow-primary/20" : "bg-white text-foreground rounded-tl-none border border-muted/30"
                      )}>{msg.text}</div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 md:p-10 pt-2 bg-white border-t border-muted/10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-muted/40 p-1.5 md:p-2.5 pl-4 md:pl-8 rounded-[1.5rem] md:rounded-[3rem] border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner">
                  <Input placeholder="Message..." className="flex-1 bg-transparent border-none shadow-none h-10 md:h-14 font-bold focus-visible:ring-0 text-xs md:text-lg placeholder:text-muted-foreground/30" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                  <Button type="submit" disabled={!messageText.trim()} className="bg-primary text-white size-10 md:size-14 rounded-[1rem] md:rounded-2xl shadow-xl transition-all active:scale-90"><Send className="size-4 md:size-6" /></Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}