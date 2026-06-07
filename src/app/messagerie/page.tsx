
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
  Image as ImageIcon,
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

  // 1. Récupérer les conversations
  const conversationsQuery = useMemo(() => {
    if (!db || !currentUserId) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    )
  }, [db, currentUserId])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // 2. Récupérer les messages du chat sélectionné
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
    // Marquer comme lu quand on ouvre
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
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: `conversations/${selectedChat.id}/messages`,
          operation: 'create',
          requestResourceData: messageData
        })
        errorEmitter.emit('permission-error', error)
      })

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

      // RÈGLES DE RESTRICTION ACADEX STRICTES
      if (currentUserRole === "Directeur") {
        allContacts = [
          ...teachersSnap.docs.map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Enseignant', sub: d.data().subject, type: 'private' })),
          ...studentsSnap.docs.map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', sub: d.data().classId, type: 'private' }))
        ]
      } else if (currentUserRole === "Enseignant") {
        // L'enseignant voit ses élèves et le directeur (PAS les autres profs)
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
        // L'élève voit ses profs (de sa classe) et le directeur
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingContacts(false)
    }
  }

  const startConversation = async (contact: any) => {
    const convId = contact.type === 'class' ? contact.id : [currentUserId, contact.id].sort().join("_")
    const convRef = doc(db, "conversations", convId)
    
    const participants = contact.type === 'class' 
      ? [currentUserId] 
      : [currentUserId, contact.id]

    await setDoc(convRef, {
      id: convId,
      participants,
      type: contact.type,
      participantNames: {
        [currentUserId]: currentUserName,
        [contact.id]: contact.name
      },
      lastMessage: "Discussion démarrée",
      lastMessageTime: serverTimestamp(),
      unreadCount: { [currentUserId]: 0, [contact.id]: 0 }
    }, { merge: true })

    setSelectedChat({ 
      id: convId, 
      participants, 
      otherName: contact.name, 
      type: contact.type 
    })
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
      <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
        <Card className={`flex-col overflow-hidden border-none shadow-sm bg-white rounded-[2.5rem] w-full md:w-[400px] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Messagerie</h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Canal Officiel Acadex</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={fetchContacts} className="size-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
                    <Plus className="size-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-8 bg-primary text-white">
                    <DialogTitle className="text-2xl font-black">Nouveau Message</DialogTitle>
                    <p className="text-xs font-medium opacity-70">Sélectionnez un contact autorisé.</p>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input placeholder="Rechercher un membre..." className="pl-12 h-14 rounded-2xl border-2 font-bold focus-visible:ring-primary" />
                    </div>
                    <ScrollArea className="h-[450px] pr-4">
                      {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                           <Loader2 className="animate-spin text-primary size-10" />
                           <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Filtrage des accès...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {contacts.length === 0 ? (
                            <div className="p-10 text-center italic text-muted-foreground">Aucun contact autorisé trouvé.</div>
                          ) : contacts.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => startConversation(c)}
                              className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-muted/50 border-2 border-transparent hover:border-primary/10 transition-all text-left group"
                            >
                              <div className="relative">
                                <Avatar className="size-14 border-4 border-white shadow-sm">
                                  <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">{c.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 border-2 border-white rounded-full" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-base group-hover:text-primary transition-colors truncate">{c.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary px-2">{c.role}</Badge>
                                  <p className="text-[10px] font-bold text-muted-foreground truncate">{c.sub}</p>
                                </div>
                              </div>
                              <div className="size-10 bg-muted/50 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <Send className="size-4" />
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

            <div className="space-y-6">
               <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-12 h-14 bg-muted/30 border-none rounded-2xl font-bold placeholder:text-muted-foreground/50 shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-muted/30 p-1 rounded-2xl h-12">
                  <TabsTrigger value="all" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest">Toutes</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest flex gap-2">
                    Non lus 
                    {conversations?.some(c => (c.unreadCount?.[currentUserId] || 0) > 0) && <div className="size-2 bg-primary rounded-full animate-pulse" />}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 no-scrollbar bg-muted/5">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="size-8 animate-spin text-primary/30" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 px-8 space-y-6">
                <div className="size-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto opacity-30">
                  <MessageCircle className="size-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-foreground">Silence radio</h3>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">Vos échanges officiels apparaîtront ici.</p>
                </div>
              </div>
            ) : (
              filteredConversations.map((chat: any) => {
                const otherParticipantId = chat.participants.find((p: string) => p !== currentUserId)
                const otherParticipantName = chat.participantNames?.[otherParticipantId] || (chat.type === 'class' ? chat.id : "Utilisateur")
                const unreadCount = chat.unreadCount?.[currentUserId] || 0
                
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setSelectedChat({ ...chat, otherName: otherParticipantName })}
                    className={`flex items-center gap-4 p-5 rounded-[2rem] cursor-pointer transition-all duration-300 relative group ${selectedChat?.id === chat.id ? 'bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.02]' : 'bg-white hover:bg-muted/5 border border-muted/20'}`}
                  >
                    <div className="relative">
                      <Avatar className={`size-14 border-4 ${selectedChat?.id === chat.id ? 'border-white/20' : 'border-white'} shadow-sm`}>
                        <AvatarFallback className={selectedChat?.id === chat.id ? "text-primary bg-white font-black text-xl" : "bg-primary/10 text-primary font-black text-xl"}> 
                          {otherParticipantName?.[0] || '?'} 
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 size-6 bg-amber-400 text-black font-black text-[10px] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black truncate text-sm tracking-tight">{otherParticipantName}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedChat?.id === chat.id ? 'text-white/60' : 'text-muted-foreground'}`}>
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {chat.lastMessage && <p className={`text-xs truncate font-medium flex-1 ${selectedChat?.id === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {chat.lastMessage}
                        </p>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className={`flex-1 border-none shadow-sm bg-white rounded-[2.5rem] flex-col overflow-hidden relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
              <div className="size-32 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl mb-10 group hover:scale-110 transition-all duration-700">
                <ShieldCheck className="size-16 text-primary animate-pulse" />
              </div>
              <div className="max-w-sm space-y-4">
                <h3 className="text-4xl font-black text-foreground tracking-tight">Canal Sécurisé</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Espace de communication crypté d'ACADEX. Échangez en toute confidentialité selon vos droits d'accès.
                </p>
                <div className="pt-6 flex justify-center gap-4">
                  <Badge className="bg-primary/5 text-primary border-primary/10 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">Restrictions Actives</Badge>
                  <Badge className="bg-primary/5 text-primary border-primary/10 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">Accès Protégé</Badge>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 px-10 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-6">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-2xl bg-muted/50" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft className="size-6" />
                  </Button>
                  <div className="relative">
                    <Avatar className="size-14 border-4 border-muted/20 shadow-sm transition-transform hover:scale-105">
                      <AvatarFallback className="bg-primary text-white font-black text-xl"> {selectedChat.otherName?.[0] || '?'} </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Espace d'échange</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="size-12 rounded-2xl hover:bg-muted transition-all">
                     <Lock className="size-5 text-muted-foreground" />
                   </Button>
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#F8FAFC]/30 scroll-smooth no-scrollbar"
              >
                {loadingMsgs ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="size-10 animate-spin text-primary/20" />
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                     <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                        <Smile className="size-8" />
                     </div>
                     <p className="text-sm font-medium text-muted-foreground">Aucun message. Dites bonjour !</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {messages?.map((msg: any, i: number) => {
                      const isMe = msg.senderId === currentUserId
                      const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId

                      return (
                        <div 
                          key={msg.id}
                          className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                        >
                          {!isMe && (
                            <div className="size-8 shrink-0">
                              {showAvatar && (
                                <Avatar className="size-8 border-2 border-white shadow-sm">
                                  <AvatarFallback className="bg-muted text-[10px] font-black">{msg.senderName?.[0]}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%] space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`group relative p-5 rounded-[2rem] text-sm md:text-base font-medium shadow-sm leading-relaxed transition-all ${
                              isMe 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-white text-foreground rounded-bl-none border border-muted/30'
                            }`}>
                              {msg.text}
                              <div className={`absolute bottom-2 right-4 flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity`}>
                                 <span className="text-[9px] font-black uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                                 {isMe && <CheckCheck className="size-3" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="p-8 pt-4 bg-white border-t border-muted/10">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2.5rem] border-2 border-transparent focus-within:border-primary/10 focus-within:bg-white transition-all shadow-inner"
                >
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5">
                    <Paperclip className="size-6" />
                  </Button>
                  
                  <Input 
                    placeholder="Tapez votre message officiel..." 
                    className="flex-1 bg-transparent border-none shadow-none h-14 font-bold focus-visible:ring-0 text-base placeholder:text-muted-foreground/40"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white size-14 rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all active:scale-90 group"
                  >
                    <Send className="size-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
