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
  Bot,
  Image as ImageIcon,
  Mic,
  Smile,
  ThumbsUp,
  Phone,
  Video,
  Info,
  Camera,
  Check
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  increment,
  onSnapshot
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (selectedChat && db && currentUserId) {
      const markAsRead = async () => {
        const convRef = doc(db, "conversations", selectedChat.id)
        await updateDoc(convRef, { [`unreadCount.${currentUserId}`]: 0 })
      }
      markAsRead()
    }
  }, [messages, selectedChat, currentUserId, db])

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = customText || messageText
    if (!textToSend.trim() || !selectedChat || !currentUserId || !db) return
    
    setMessageText("")

    try {
      await addDoc(collection(db, "conversations", selectedChat.id, "messages"), {
        senderId: currentUserId,
        senderName: currentUserName,
        text: textToSend,
        timestamp: serverTimestamp(),
        type: 'text',
        seen: false
      })
      
      const updates: any = { 
        lastMessage: textToSend, 
        lastMessageTime: serverTimestamp() 
      }
      
      selectedChat.participants.forEach((pId: string) => { 
        if (pId !== currentUserId) updates[`unreadCount.${pId}`] = increment(1) 
      })
      
      await updateDoc(doc(db, "conversations", selectedChat.id), updates)
    } catch (e) {
      toast({ title: "Erreur d'envoi", variant: "destructive" })
    }
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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diff < 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100svh-9.5rem)] md:h-[calc(100vh-9.5rem)] flex gap-0 md:gap-4 animate-in fade-in duration-500 overflow-hidden -m-4 md:m-0">
        
        {/* Sidebar - Liste des discussions */}
        <Card className={cn(
          "flex flex-col overflow-hidden border-none shadow-none md:shadow-sm bg-white md:rounded-[2rem] w-full md:w-[360px] lg:w-[420px] transition-all shrink-0",
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 md:p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <h2 className="text-xl md:text-2xl font-black tracking-tight">Discussions</h2>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="rounded-full bg-muted/50"><MoreVertical className="size-5" /></Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" onClick={fetchContacts} className="size-10 rounded-full bg-primary text-white shadow-lg active:scale-90 transition-all"><Plus className="size-6" /></Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2.2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none">
                    <div className="p-6 bg-primary text-white"><DialogTitle className="text-xl md:text-2xl font-black uppercase">Nouveau Message</DialogTitle></div>
                    <div className="p-4 bg-white border-b"><Input placeholder="Rechercher un contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-full bg-muted/30 border-none h-11" /></div>
                    <ScrollArea className="h-[400px] p-2 bg-[#F8FAFC]">
                      {loadingContacts ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary size-8" /></div> : 
                        contacts.map(c => (
                          <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left mb-1">
                            <Avatar className="size-12 border-2 border-white shadow-sm"><AvatarFallback className="bg-primary/5 text-primary font-black text-xs">{c.name?.[0]}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                              <p className="font-black text-sm truncate uppercase">{c.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.role} • {c.sub}</p>
                            </div>
                          </button>
                      ))}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Rechercher dans Messenger..." className="pl-11 h-11 bg-muted/40 border-none rounded-full font-medium text-sm focus-visible:ring-primary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 no-scrollbar pb-10">
            {loadingConvs ? <div className="flex justify-center p-10"><Loader2 className="size-8 animate-spin text-primary opacity-20" /></div> : 
              filteredConversations.map(chat => {
                const otherId = chat.participants.find((p: string) => p !== currentUserId)
                const name = chat.participantNames?.[otherId] || "Utilisateur"
                const unread = chat.unreadCount?.[currentUserId] || 0
                return (
                  <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all mx-1",
                    selectedChat?.id === chat.id ? "bg-primary/5 md:bg-muted/30" : "hover:bg-muted/20"
                  )}>
                    <div className="relative">
                      <Avatar className="size-14 border-2 border-white shadow-sm">
                        <AvatarFallback className="font-black text-sm bg-primary/10 text-primary uppercase">{name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0.5 right-0.5 size-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={cn("truncate text-sm font-bold uppercase", unread > 0 ? "text-foreground" : "text-foreground/80")}>{name}</h4>
                        <span className="text-[10px] font-medium text-muted-foreground shrink-0">{formatTime(chat.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs truncate max-w-[80%]", unread > 0 ? "font-black text-foreground" : "font-medium text-muted-foreground")}>
                          {chat.lastMessage}
                        </p>
                        {unread > 0 && <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 min-w-[1.2rem] h-5 justify-center rounded-full">{unread}</Badge>}
                      </div>
                    </div>
                  </div>
                )
            })}
          </div>
        </Card>

        {/* Zone de Chat - Le cockpit de conversation */}
        <Card className={cn(
          "flex-1 border-none shadow-none md:shadow-sm bg-white md:rounded-[2rem] flex-col overflow-hidden relative transition-all",
          !selectedChat ? "hidden md:flex" : "flex fixed inset-0 z-50 md:relative"
        )}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="size-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="size-12 text-primary opacity-20" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Sélectionnez une discussion</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 max-w-xs mx-auto opacity-40">Vos communications sont cryptées et certifiées par ACADEX</p>
            </div>
          ) : (
            <>
              {/* Header du Chat */}
              <div className="h-16 md:h-20 px-4 md:px-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-muted" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-6" /></Button>
                  <div className="relative">
                    <Avatar className="size-10 md:size-11 border-2 border-muted/10 shadow-sm">
                      <AvatarFallback className="font-black text-sm bg-primary/5 text-primary uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black uppercase truncate max-w-[140px] md:max-w-none">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-4">
                  <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 hidden sm:flex"><Phone className="size-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 hidden sm:flex"><Video className="size-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Info className="size-5" /></Button>
                </div>
              </div>

              {/* Zone des Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar bg-[#F8FAFC]/50 scroll-smooth">
                {/* Information de sécurité scellée */}
                <div className="flex justify-center mb-8">
                   <div className="bg-white/80 backdrop-blur-sm border border-muted px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                      <ShieldCheck className="size-3 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Canal scellé • Chiffrement Acadex</span>
                   </div>
                </div>

                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId)
                  
                  return (
                    <div key={msg.id || i} className={cn(
                      "flex items-end gap-2 group animate-in slide-in-from-bottom-2 duration-300", 
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isMe && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="size-7 border shadow-sm">
                              <AvatarFallback className="text-[10px] font-black uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div className={cn("max-w-[75%] md:max-w-[65%] flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[13px] md:text-base font-medium leading-relaxed shadow-sm",
                          isMe 
                            ? "bg-primary text-white rounded-br-sm" 
                            : "bg-white text-foreground border border-muted/50 rounded-bl-sm"
                        )}>
                          {msg.text}
                        </div>
                        {isMe && i === messages.length - 1 && (
                          <div className="mt-1 flex items-center gap-1 opacity-50">
                             <CheckCheck className="size-3 text-primary" />
                             <span className="text-[8px] font-bold uppercase">Distribué</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barre d'Action (Input Messenger) */}
              <div className="p-3 md:p-6 bg-white border-t border-muted/10">
                <div className="flex items-end gap-2 md:gap-3">
                  <div className="flex items-center gap-1 mb-1 hidden sm:flex">
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Plus className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Camera className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><ImageIcon className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Mic className="size-5" /></Button>
                  </div>
                  
                  <div className="flex-1 relative flex items-center">
                    <form onSubmit={handleSendMessage} className="w-full relative">
                      <textarea 
                        rows={1}
                        placeholder="Aa" 
                        className="w-full bg-muted/40 border-none rounded-3xl py-3 pl-4 pr-12 focus:ring-0 focus:outline-none resize-none font-medium text-sm md:text-base max-h-32"
                        value={messageText} 
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-transparent h-9 w-9"><Smile className="size-5" /></Button>
                      </div>
                    </form>
                  </div>

                  <div className="mb-1">
                    {messageText.trim() ? (
                      <Button onClick={() => handleSendMessage()} className="bg-primary text-white size-10 md:size-11 rounded-full shadow-lg transition-all active:scale-90 flex-shrink-0">
                        <Send className="size-5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleSendMessage(undefined, "👍")} className="rounded-full text-primary hover:bg-primary/5 size-10 md:size-11 flex-shrink-0">
                        <ThumbsUp className="size-6 fill-primary" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
