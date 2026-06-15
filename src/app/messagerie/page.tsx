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
  User,
  X,
  PhoneOff,
  MicOff,
  VideoOff,
  Maximize2
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

  // Call System State
  const [isCalling, setIsCalling] = useState(false)
  const [callType, setCallType] = useState<'video' | 'voice' | null>(null)
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting')

  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('acadex_user_id') || "")
    setCurrentUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setCurrentUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  // Conversations query
  const conversationsQuery = useMemo(() => {
    if (!db || !currentUserId) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    )
  }, [db, currentUserId])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // Messages query
  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    )
  }, [db, selectedChat])

  const { data: messages } = useCollection(messagesQuery)

  // Typing indicator sync
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

  // Scroll and read receipts
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
      await updateDoc(doc(db, "conversations", selectedChat.id), { [`typing.${currentUserId}`]: true })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await updateDoc(doc(db, "conversations", selectedChat.id), { [`typing.${currentUserId}`]: false })
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
        lastMessage: type === 'image' ? '📷 Photo' : (type === 'like' ? '👍 Like' : msgContent), 
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      await handleSendMessage(undefined, base64, 'image')
      toast({ title: "Photo envoyée" })
    }
    reader.readAsDataURL(file)
  }

  const startCall = (type: 'video' | 'voice') => {
    setCallType(type)
    setIsCalling(true)
    setCallStatus('connecting')
    
    // Simuler une connexion après 3 secondes
    setTimeout(() => {
      setCallStatus('active')
    }, 3000)
  }

  const endCall = () => {
    setCallStatus('ended')
    setTimeout(() => {
      setIsCalling(false)
      setCallType(null)
    }, 1000)
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
    return conversations.filter(c => {
      const otherId = c.participants.find((p: string) => p !== currentUserId)
      const name = c.participantNames?.[otherId] || "Utilisateur"
      return name.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, currentUserId])

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
        
        {/* Sidebar - Discussions */}
        <Card className={cn(
          "flex flex-col overflow-hidden border-none shadow-none md:shadow-sm bg-white md:rounded-[2rem] w-full md:w-[360px] lg:w-[420px] shrink-0",
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 md:p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Messages</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" onClick={fetchContacts} className="size-10 rounded-full bg-primary text-white shadow-lg"><Plus className="size-6" /></Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                  <div className="p-6 bg-primary text-white flex items-center justify-between">
                    <DialogTitle className="text-xl md:text-2xl font-black uppercase">Nouveau Chat</DialogTitle>
                  </div>
                  <div className="p-4 bg-white border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-full bg-muted/30 border-none pl-10 h-11" />
                    </div>
                  </div>
                  <ScrollArea className="h-[450px] p-2 bg-[#F8FAFC]">
                    {loadingContacts ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary size-8" /></div> : 
                      contacts.map(c => (
                        <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left mb-2 group">
                          <Avatar className="size-12 border-2 border-white shadow-sm"><AvatarFallback className="bg-primary/5 text-primary font-black text-sm">{c.name?.[0]}</AvatarFallback></Avatar>
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
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-11 h-11 bg-muted/40 border-none rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                    "flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all mx-1 mb-1",
                    selectedChat?.id === chat.id ? "bg-primary/5 md:bg-muted/30" : "hover:bg-muted/20"
                  )}>
                    <Avatar className="size-14 border-2 border-white">
                      <AvatarFallback className="font-black text-base bg-primary/10 text-primary uppercase">{name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={cn("truncate text-sm font-black uppercase tracking-tight", unread > 0 ? "text-foreground" : "text-foreground/70")}>{name}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground">{formatTime(chat.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs truncate max-w-[85%]", unread > 0 ? "font-black text-foreground" : "font-medium text-muted-foreground/60")}>
                          {chat.lastMessage}
                        </p>
                        {unread > 0 && <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 min-w-[1.4rem] h-5 justify-center rounded-full">{unread}</Badge>}
                      </div>
                    </div>
                  </div>
                )
            })}
          </div>
        </Card>

        {/* Chat Area */}
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
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3 opacity-40">Sélectionnez une discussion scellée</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="h-16 md:h-20 px-4 md:px-8 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-6" /></Button>
                  <Avatar className="size-10 md:size-12 border-2 border-muted/10">
                    <AvatarFallback className="font-black text-sm bg-primary/5 text-primary uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-lg font-black uppercase truncate tracking-tight">{selectedChat.otherName}</h3>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" /> Actif
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-4">
                  <Button onClick={() => startCall('voice')} variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Phone className="size-5" /></Button>
                  <Button onClick={() => startCall('video')} variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Video className="size-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Info className="size-5" /></Button>
                </div>
              </div>

              {/* Messages Zone */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar bg-[#F8FAFC]/30 scroll-smooth">
                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id || i} className={cn("flex items-end gap-2 group animate-in slide-in-from-bottom-2 duration-300", isMe ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn("max-w-[80%] md:max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[14px] md:text-base font-medium leading-relaxed shadow-sm",
                          isMe ? "bg-primary text-white rounded-br-sm" : "bg-white text-foreground border border-muted/50 rounded-bl-sm"
                        )}>
                          {msg.type === 'image' ? (
                            <img src={msg.text} alt="Shared" className="rounded-xl max-w-full max-h-[300px] object-cover cursor-pointer hover:scale-[1.02] transition-transform" />
                          ) : msg.text === '👍' ? (
                            <ThumbsUp className="size-10 md:size-14 fill-primary text-primary" />
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {otherPersonTyping && (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="bg-white border px-4 py-2 rounded-2xl flex gap-1 shadow-sm">
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce" />
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Zone */}
              <div className="p-4 md:p-8 bg-white border-t border-muted/10">
                <div className="flex items-end gap-2 md:gap-4 max-w-5xl mx-auto">
                  <div className="flex items-center gap-1.5 mb-1 hidden sm:flex">
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Plus className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5" onClick={() => fileInputRef.current?.click()}><ImageIcon className="size-5" /></Button>
                     <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/5"><Mic className="size-5" /></Button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  
                  <div className="flex-1 relative flex items-center">
                    <form onSubmit={handleSendMessage} className="w-full relative">
                      <textarea 
                        rows={1}
                        placeholder="Ecrivez..." 
                        className="w-full bg-muted/40 border-none rounded-3xl py-3.5 pl-5 pr-14 focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none font-medium text-sm md:text-lg max-h-32 transition-all shadow-inner"
                        value={messageText} 
                        onChange={(e) => {
                          setMessageText(e.target.value)
                          handleTyping()
                        }}
                      />
                      <Button variant="ghost" size="icon" className="absolute right-2 bottom-2 rounded-full text-primary h-10 w-10"><Smile className="size-6" /></Button>
                    </form>
                  </div>

                  <div className="mb-1.5">
                    {messageText.trim() ? (
                      <Button onClick={() => handleSendMessage()} className="bg-primary text-white size-11 md:size-14 rounded-full shadow-xl shadow-primary/20 transition-all">
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

              {/* Call Overlay */}
              {isCalling && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-10 text-white animate-in zoom-in duration-300">
                  <div className="w-full flex justify-end">
                     <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={endCall}><Maximize2 className="size-6" /></Button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-8">
                     <div className="relative">
                        <div className={cn("absolute inset-0 bg-primary/20 rounded-full animate-ping", callStatus === 'connecting' ? 'block' : 'hidden')} />
                        <Avatar className="size-32 md:size-48 border-4 border-white/20 shadow-2xl">
                          <AvatarFallback className="bg-primary text-white text-5xl md:text-7xl font-black uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                        </Avatar>
                     </div>
                     <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">{selectedChat.otherName}</h2>
                        <p className="text-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                          {callStatus === 'connecting' ? 'Appel en cours...' : 'Conversation active'}
                        </p>
                     </div>
                  </div>

                  {callType === 'video' && callStatus === 'active' && (
                    <div className="absolute inset-0 z-0 overflow-hidden opacity-50">
                       <img src="https://picsum.photos/seed/call-placeholder/1920/1080" className="w-full h-full object-cover" alt="Video Call" />
                    </div>
                  )}

                  <div className="relative z-10 w-full max-w-md flex justify-center items-center gap-6 md:gap-10">
                     <Button variant="outline" size="icon" className="size-14 md:size-20 rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20">
                        <MicOff className="size-6 md:size-8" />
                     </Button>
                     <Button onClick={endCall} className="size-20 md:size-28 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-600/40 group active:scale-95 transition-all">
                        <PhoneOff className="size-10 md:size-14 fill-white group-hover:rotate-12 transition-transform" />
                     </Button>
                     <Button variant="outline" size="icon" className="size-14 md:size-20 rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20">
                        <VideoOff className="size-6 md:size-8" />
                     </Button>
                  </div>

                  <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-4">
                     <ShieldCheck className="size-4" /> Crypteur de flux Acadex scellé
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
