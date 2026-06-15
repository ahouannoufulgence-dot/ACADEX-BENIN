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
  Check,
  User
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
  const [isTyping, setIsTyping] = useState(false)
  const [otherPersonTyping, setOtherPersonTyping] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>(null)

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('acadex_user_id') || "")
    setCurrentUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setCurrentUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  // Liste des conversations en temps réel
  const conversationsQuery = useMemo(() => {
    if (!db || !currentUserId) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    )
  }, [db, currentUserId])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // Messages de la conversation sélectionnée
  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    )
  }, [db, selectedChat])

  const { data: messages } = useCollection(messagesQuery)

  // Écouter si l'autre personne écrit
  useEffect(() => {
    if (!db || !selectedChat || !currentUserId) return
    const otherId = selectedChat.participants.find((p: string) => p !== currentUserId)
    const unsub = onSnapshot(doc(db, "conversations", selectedChat.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setOtherPersonTyping(data.typing?.[otherId] || false)
      }
    })
    return () => unsub()
  }, [db, selectedChat, currentUserId])

  // Scroll automatique et lecture des messages
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

  const handleTyping = async () => {
    if (!selectedChat || !db || !currentUserId) return
    
    if (!isTyping) {
      setIsTyping(true)
      await updateDoc(doc(db, "conversations", selectedChat.id), {
        [`typing.${currentUserId}`]: true
      })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await updateDoc(doc(db, "conversations", selectedChat.id), {
        [`typing.${currentUserId}`]: false
      })
    }, 2000)
  }

  const handleSendMessage = async (e?: React.FormEvent, customText?: string, type: 'text' | 'image' | 'like' = 'text') => {
    if (e) e.preventDefault()
    const textToSend = customText || messageText
    if (!textToSend.trim() && type === 'text') return
    if (!selectedChat || !currentUserId || !db) return
    
    const msgContent = type === 'like' ? '👍' : textToSend
    setMessageText("")
    setIsTyping(false)

    try {
      await addDoc(collection(db, "conversations", selectedChat.id, "messages"), {
        senderId: currentUserId,
        senderName: currentUserName,
        text: msgContent,
        timestamp: serverTimestamp(),
        type: type,
        seen: false
      })
      
      const updates: any = { 
        lastMessage: type === 'image' ? '📷 Photo' : msgContent, 
        lastMessageTime: serverTimestamp(),
        [`typing.${currentUserId}`]: false
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
      unreadCount: { [currentUserId]: 0, [contact.id]: 0 },
      typing: { [currentUserId]: false, [contact.id]: false }
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
              <h2 className="text-2xl font-black tracking-tight">Messages</h2>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" onClick={fetchContacts} className="size-10 rounded-full bg-primary text-white shadow-lg active:scale-90 transition-all"><Plus className="size-6" /></Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2.2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-6 bg-primary text-white flex items-center justify-between">
                      <DialogTitle className="text-xl md:text-2xl font-black uppercase">Nouveau Chat</DialogTitle>
                    </div>
                    <div className="p-4 bg-white border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par nom ou rôle..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-full bg-muted/30 border-none pl-10 h-11" />
                      </div>
                    </div>
                    <ScrollArea className="h-[450px] p-2 bg-[#F8FAFC]">
                      {loadingContacts ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary size-8" /></div> : 
                        contacts.map(c => (
                          <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left mb-2 group">
                            <Avatar className="size-12 border-2 border-white shadow-sm group-hover:border-primary/20"><AvatarFallback className="bg-primary/5 text-primary font-black text-sm">{c.name?.[0]}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                              <p className="font-black text-sm truncate uppercase">{c.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.role} • {c.sub}</p>
                            </div>
                            <ChevronRight className="ml-auto size-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
                const isOtherTyping = chat.typing?.[otherId] || false
                return (
                  <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all mx-1 mb-1",
                    selectedChat?.id === chat.id ? "bg-primary/5 md:bg-muted/30" : "hover:bg-muted/20"
                  )}>
                    <div className="relative">
                      <Avatar className="size-14 border-2 border-white shadow-sm">
                        <AvatarFallback className="font-black text-base bg-primary/10 text-primary uppercase">{name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0.5 right-0.5 size-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={cn("truncate text-sm font-black uppercase tracking-tight", unread > 0 ? "text-foreground" : "text-foreground/70")}>{name}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground shrink-0">{formatTime(chat.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {isOtherTyping ? (
                          <p className="text-xs font-black text-primary animate-pulse italic">écrit...</p>
                        ) : (
                          <p className={cn("text-xs truncate max-w-[85%]", unread > 0 ? "font-black text-foreground" : "font-medium text-muted-foreground/60")}>
                            {chat.lastMessage}
                          </p>
                        )}
                        {unread > 0 && <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 min-w-[1.4rem] h-5 justify-center rounded-full shadow-lg">{unread}</Badge>}
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
              <div className="size-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-700">
                <MessageCircle className="size-16 text-primary opacity-20" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Votre Espace Chat</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3 max-w-xs mx-auto opacity-40">Sélectionnez une discussion scellée pour démarrer</p>
            </div>
          ) : (
            <>
              {/* Header du Chat */}
              <div className="h-16 md:h-20 px-4 md:px-8 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-muted" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-6" /></Button>
                  <div className="relative group cursor-pointer">
                    <Avatar className="size-10 md:size-12 border-2 border-muted/10 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarFallback className="font-black text-sm bg-primary/5 text-primary uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-lg font-black uppercase truncate tracking-tight">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-1.5">
                      {otherPersonTyping ? (
                        <span className="text-[10px] font-black text-primary animate-pulse uppercase italic tracking-tighter">en train d'écrire...</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="size-1.5 bg-emerald-500 rounded-full animate-ping" /> Actif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-4">
                  <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5 hidden sm:flex"><Phone className="size-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5 hidden sm:flex"><Video className="size-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Info className="size-5" /></Button>
                </div>
              </div>

              {/* Zone des Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar bg-[#F8FAFC]/30 scroll-smooth">
                {/* Information de sécurité scellée */}
                <div className="flex justify-center mb-10">
                   <div className="bg-white/90 backdrop-blur-sm border border-muted/50 px-6 py-2.5 rounded-full flex items-center gap-3 shadow-md">
                      <ShieldCheck className="size-3.5 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em]">Canal crypté Acadex V1</span>
                   </div>
                </div>

                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId)
                  const isLast = i === messages.length - 1
                  
                  return (
                    <div key={msg.id || i} className={cn(
                      "flex items-end gap-2 group animate-in slide-in-from-bottom-2 duration-300", 
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isMe && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="size-8 border shadow-sm">
                              <AvatarFallback className="text-[10px] font-black uppercase bg-primary/10 text-primary">{selectedChat.otherName?.[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div className={cn("max-w-[80%] md:max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[14px] md:text-base font-medium leading-relaxed shadow-sm transition-all hover:brightness-95 cursor-default",
                          isMe 
                            ? "bg-primary text-white rounded-br-sm" 
                            : "bg-white text-foreground border border-muted/50 rounded-bl-sm"
                        )}>
                          {msg.text === '👍' ? (
                            <ThumbsUp className="size-8 md:size-12 fill-primary text-primary" />
                          ) : (
                            msg.text
                          )}
                        </div>
                        {isMe && isLast && (
                          <div className="mt-1 flex items-center gap-1.5 opacity-40">
                             <CheckCheck className={cn("size-3.5", msg.seen ? "text-emerald-500" : "text-muted-foreground")} />
                             <span className="text-[8px] font-black uppercase tracking-widest">{msg.seen ? 'Vu' : 'Remis'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {otherPersonTyping && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <Avatar className="size-7 border">
                      <AvatarFallback className="text-[8px] font-black uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="bg-white border px-4 py-2.5 rounded-2xl flex gap-1 items-center shadow-sm">
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Barre d'Action (Input Messenger) */}
              <div className="p-4 md:p-8 bg-white border-t border-muted/10 shadow-2xl">
                <div className="flex items-end gap-2 md:gap-4 max-w-5xl mx-auto">
                  <div className="flex items-center gap-1.5 mb-1 hidden sm:flex">
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><Plus className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><Camera className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><ImageIcon className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><Mic className="size-5" /></Button>
                  </div>
                  
                  <div className="flex-1 relative flex items-center">
                    <form onSubmit={handleSendMessage} className="w-full relative">
                      <textarea 
                        rows={1}
                        placeholder="Ecrivez votre message scellé..." 
                        className="w-full bg-muted/40 border-none rounded-3xl py-3.5 pl-5 pr-14 focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none font-medium text-sm md:text-lg max-h-32 transition-all shadow-inner"
                        value={messageText} 
                        onChange={(e) => {
                          setMessageText(e.target.value)
                          handleTyping()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center">
                        <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-transparent h-10 w-10"><Smile className="size-6" /></Button>
                      </div>
                    </form>
                  </div>

                  <div className="mb-1.5">
                    {messageText.trim() ? (
                      <Button onClick={() => handleSendMessage()} className="bg-primary text-white size-11 md:size-14 rounded-full shadow-xl shadow-primary/20 hover:scale-105 active:scale-90 transition-all flex-shrink-0">
                        <Send className="size-6" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleSendMessage(undefined, "👍", "like")} className="rounded-full text-primary hover:bg-primary/5 size-11 md:size-14 flex-shrink-0 transition-transform active:scale-125">
                        <ThumbsUp className="size-7 md:size-9 fill-primary text-primary" />
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
