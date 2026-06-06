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
  UserPlus
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo, useEffect, useRef } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, addDoc, query, where, orderBy, serverTimestamp, doc, updateDoc, limit, getDocs, setDoc } from "firebase/firestore"
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

export default function MessagingPage() {
  const db = useFirestore()
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = localStorage.getItem('acadex_user_id') || ""
    const name = localStorage.getItem('acadex_user_name') || "Utilisateur"
    setCurrentUserId(id)
    setCurrentUserName(name)
  }, [])

  // 1. Récupérer les conversations où l'utilisateur est participant
  const conversationsQuery = useMemo(() => {
    if (!db || !currentUserId) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc"),
      limit(20)
    )
  }, [db, currentUserId])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // 2. Récupérer les messages de la conversation sélectionnée
  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    )
  }, [db, selectedChat])

  const { data: messages, loading: loadingMsgs } = useCollection(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedChat || !currentUserId || !db) return

    const text = messageText
    setMessageText("")

    const messageData = {
      senderId: currentUserId,
      senderName: currentUserName,
      text,
      timestamp: serverTimestamp()
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

    updateDoc(doc(db, "conversations", selectedChat.id), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${selectedChat.participants.find((p: string) => p !== currentUserId)}`]: 1
    })
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const teachersSnap = await getDocs(collection(db, "teachers"))
      const studentsSnap = await getDocs(collection(db, "students"))
      
      const allContacts = [
        ...teachersSnap.docs.map(d => ({ id: d.data().officialId || d.id, name: d.data().fullName, role: 'Enseignant', subject: d.data().subject })),
        ...studentsSnap.docs.map(d => ({ id: d.data().matricule || d.id, name: `${d.data().firstName} ${d.data().lastName}`, role: 'Élève', class: d.data().classId }))
      ].filter(c => c.id !== currentUserId)
      
      setContacts(allContacts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingContacts(false)
    }
  }

  const startConversation = async (contact: any) => {
    const convId = [currentUserId, contact.id].sort().join("_")
    const convRef = doc(db, "conversations", convId)
    
    await setDoc(convRef, {
      participants: [currentUserId, contact.id],
      participantNames: {
        [currentUserId]: currentUserName,
        [contact.id]: contact.name
      },
      lastMessage: "Début de la conversation",
      lastMessageTime: serverTimestamp()
    }, { merge: true })

    setSelectedChat({ id: convId, participants: [currentUserId, contact.id], participantNames: { [contact.id]: contact.name } })
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    return conversations.filter(c => 
      (c.lastMessage?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [conversations, searchTerm])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-14rem)] flex gap-6 animate-in fade-in duration-500">
        
        {/* Barre latérale : Liste des discussions */}
        <Card className="hidden md:flex w-96 border-none shadow-sm bg-white rounded-[2.5rem] flex-col overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Messagerie</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={fetchContacts} className="rounded-2xl bg-muted/50 hover:bg-primary hover:text-white transition-all">
                    <UserPlus className="size-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Nouveau Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Chercher un contact..." className="pl-10 h-12 rounded-xl border-2" />
                    </div>
                    <ScrollArea className="h-[400px] pr-4">
                      {loadingContacts ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
                      ) : (
                        <div className="space-y-2">
                          {contacts.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => startConversation(c)}
                              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-muted transition-all text-left group"
                            >
                              <Avatar className="size-10 border-2 border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary font-black">{c.name?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-black text-sm group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.role} • {c.subject || c.class}</p>
                              </div>
                              <Plus className="size-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Filtrer discussions..." 
                className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold placeholder:text-muted-foreground/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                  <MessageCircle className="size-8" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aucune discussion active</p>
              </div>
            ) : (
              filteredConversations.map((chat: any) => {
                const otherParticipantId = chat.participants.find((p: string) => p !== currentUserId)
                const otherParticipantName = chat.participantNames?.[otherParticipantId] || "Utilisateur"
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setSelectedChat({ ...chat, otherName: otherParticipantName })}
                    className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 ${selectedChat?.id === chat.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-muted/50'}`}
                  >
                    <Avatar className="size-14 border-4 border-white shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${chat.id}/100/100`} />
                      <AvatarFallback className={selectedChat?.id === chat.id ? "text-primary bg-white font-black" : "bg-primary/10 text-primary font-black"}> 
                        {otherParticipantName?.[0] || '?'} 
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black truncate text-sm">{otherParticipantName}</h4>
                        <span className={`text-[10px] font-black ${selectedChat?.id === chat.id ? 'text-white/60' : 'text-muted-foreground'}`}>
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${selectedChat?.id === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Fenêtre de Chat principale */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2.5rem] flex flex-col overflow-hidden relative">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
              <div className="size-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 group hover:rotate-12 transition-transform duration-500">
                <Send className="size-12 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">Espace de Communication</h3>
              <p className="text-muted-foreground font-medium max-w-sm leading-relaxed">
                Échangez en temps réel avec les enseignants, l'administration ou les parents dans un environnement 100% sécurisé par ACADEX.
              </p>
            </div>
          ) : (
            <>
              <div className="p-6 px-10 border-b flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft className="size-6" />
                  </Button>
                  <Avatar className="size-12 border-2 border-primary/10 shadow-sm">
                    <AvatarFallback className="bg-primary text-white font-black"> {selectedChat.otherName?.[0] || '?'} </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Canal Sécurisé</span>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-6 bg-[#F8FAFC]/50 scroll-smooth no-scrollbar"
              >
                {loadingMsgs ? (
                  <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary opacity-20" /></div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-20 italic text-muted-foreground font-medium">Aucun message. Commencez l'échange !</div>
                ) : (
                  messages?.map((msg: any) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div className={`max-w-[75%] space-y-2 ${msg.senderId === currentUserId ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-[2rem] text-sm md:text-base font-medium shadow-sm leading-relaxed transition-all ${
                          msg.senderId === currentUserId 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-foreground rounded-tl-none border border-muted/30'
                        }`}>
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.senderId === currentUserId && <CheckCheck className="size-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 pt-4 bg-white border-t border-muted/20">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2.5rem] border-2 border-transparent focus-within:border-primary/10 focus-within:bg-white transition-all shadow-inner"
                >
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Paperclip className="size-5" />
                  </Button>
                  <Input 
                    placeholder="Tapez votre message..." 
                    className="flex-1 bg-transparent border-none shadow-none h-12 font-bold focus-visible:ring-0 text-base"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white size-12 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                  >
                    <Send className="size-5 group-hover:rotate-12 transition-transform" />
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
