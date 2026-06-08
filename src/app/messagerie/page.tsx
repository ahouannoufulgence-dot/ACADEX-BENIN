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
  Smile, 
  Plus, 
  CheckCheck,
  Loader2,
  MessageCircle,
  ChevronLeft,
  UserPlus,
  Users as UsersIcon,
  Megaphone,
  FileText,
  ImageIcon,
  ShieldCheck,
  Archive,
  Trash2,
  Lock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
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

  const { data: messages, loading: loadingMsgs } = useCollection(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (selectedChat && db) {
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
        
        allContacts = [
          { id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Administration', type: 'private' },
          ...myStudents
        ]
        userClasses.forEach(cls => {
          allContacts.push({ id: `GROUP_${cls}`, name: `Classe ${cls}`, role: 'Groupe', sub: 'Discussion Collective', type: 'class', classId: cls })
        })
      } else {
        const studentMatricule = currentUserId
        const studentClass = studentMatricule.split('-')[1]
        const myTeachers = teachersSnap.docs
          .filter(d => d.data().classes?.includes(studentClass))
          .map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Professeur', sub: d.data().subject, type: 'private' }))
        
        allContacts = [
          { id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Administration', type: 'private' },
          ...myTeachers
        ]
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
    if (activeTab === "unread") {
      list = conversations.filter(c => (c.unreadCount?.[currentUserId] || 0) > 0)
    }
    return list.filter(c => {
      const otherParticipantId = c.participants.find((p: string) => p !== currentUserId)
      const name = c.participantNames?.[otherParticipantId] || c.id
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.lastMessage?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, activeTab, currentUserId])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100svh-12rem)] md:h-[calc(100vh-12rem)] flex gap-6 animate-in">
        
        {/* Contacts Sidebar - Mobile friendly */}
        <Card className={`flex-col overflow-hidden border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] w-full md:w-[400px] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 md:p-8 pb-4">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Messagerie</h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Canal Officiel Acadex</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={fetchContacts} className="size-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all mobile-touch-target">
                    <Plus className="size-5 md:size-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-lg p-0 overflow-hidden border-none shadow-2xl w-[95%]">
                  <DialogHeader className="p-6 md:p-8 bg-primary text-white">
                    <DialogTitle className="text-xl md:text-2xl font-black">Nouveau Message</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 md:p-6 space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Rechercher..." className="pl-12 h-12 rounded-xl border-2 font-bold" />
                    </div>
                    <ScrollArea className="h-[350px] md:h-[400px] pr-4">
                      {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-primary size-10" /></div>
                      ) : (
                        <div className="space-y-3">
                          {contacts.map((c) => (
                            <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-muted/50 transition-all text-left">
                              <Avatar className="size-12 border-2 border-white shadow-sm"><AvatarFallback className="bg-primary/10 text-primary font-black">{c.name?.[0]}</AvatarFallback></Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm md:text-base truncate">{c.name}</p>
                                <Badge variant="outline" className="text-[8px] font-black uppercase px-2">{c.role}</Badge>
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

            <div className="space-y-4">
               <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-muted/30 p-1 rounded-2xl h-11">
                  <TabsTrigger value="all" className="flex-1 rounded-xl font-black text-[9px] uppercase tracking-widest">Toutes</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1 rounded-xl font-black text-[9px] uppercase tracking-widest">Non lus</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar bg-muted/5">
            {loadingConvs ? (
              <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
            ) : filteredConversations.map((chat: any) => {
              const otherId = chat.participants.find((p: string) => p !== currentUserId)
              const name = chat.participantNames?.[otherId] || (chat.type === 'class' ? chat.id : "Utilisateur")
              const unread = chat.unreadCount?.[currentUserId] || 0
              return (
                <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={`flex items-center gap-3 md:gap-4 p-4 rounded-[1.8rem] cursor-pointer transition-all ${selectedChat?.id === chat.id ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'bg-white hover:bg-muted/5 border border-muted/20'}`}>
                  <div className="relative">
                    <Avatar className={`size-12 border-4 ${selectedChat?.id === chat.id ? 'border-white/20' : 'border-white'}`}><AvatarFallback className="font-black text-lg">{name?.[0]}</AvatarFallback></Avatar>
                    {unread > 0 && <div className="absolute -top-1 -right-1 size-5 bg-amber-400 text-black font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white">{unread}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-black truncate text-sm">{name}</h4>
                      <span className="text-[8px] font-black uppercase opacity-60">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <p className={`text-[10px] md:text-[11px] truncate font-medium ${selectedChat?.id === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>{chat.lastMessage}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Chat Area - Full screen on mobile when active */}
        <Card className={`flex-1 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] flex-col overflow-hidden relative ${!selectedChat ? 'hidden md:flex' : 'fixed inset-0 z-50 md:relative md:flex'}`}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
              <div className="size-24 bg-white rounded-[3rem] flex items-center justify-center shadow-xl mb-6">
                <ShieldCheck className="size-12 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-2">Canal Sécurisé</h3>
              <p className="text-xs font-medium text-muted-foreground max-w-xs">Espace de communication crypté. Vos échanges sont confidentiels.</p>
            </div>
          ) : (
            <>
              <div className="p-4 md:p-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3 md:gap-6">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl bg-muted/50 mobile-touch-target" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-6" /></Button>
                  <Avatar className="size-10 md:size-12 border-2 border-muted/20"><AvatarFallback className="font-black text-lg">{selectedChat.otherName?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <h3 className="text-base md:text-xl font-black tracking-tight">{selectedChat.otherName}</h3>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">En ligne</span>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 bg-[#F8FAFC]/30 scroll-smooth no-scrollbar">
                {messages?.map((msg: any, i: number) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`group relative p-4 rounded-[1.8rem] text-sm md:text-base font-medium shadow-sm leading-relaxed max-w-[85%] md:max-w-[70%] ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-foreground rounded-bl-none border border-muted/30'}`}>
                        {msg.text}
                        <div className="flex justify-end gap-1 opacity-40 mt-1">
                           <span className="text-[8px] font-black">{formatTime(msg.timestamp)}</span>
                           {isMe && <CheckCheck className="size-2" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 md:p-8 pt-4 bg-white border-t border-muted/10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4 bg-muted/30 p-2 pl-4 rounded-[2rem] border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner">
                  <Input placeholder="Message..." className="flex-1 bg-transparent border-none shadow-none h-12 font-bold focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                  <Button type="submit" disabled={!messageText.trim()} className="bg-primary text-white size-12 rounded-2xl shadow-xl transition-all active:scale-90 mobile-touch-target"><Send className="size-5" /></Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}