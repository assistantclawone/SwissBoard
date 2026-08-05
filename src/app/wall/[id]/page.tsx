'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { FullPageLoader } from '@/components/loader';
import { Header } from '@/components/header';
import { AddPostForm } from '@/components/wall/add-post-form';
import { ContentCard } from '@/components/wall/content-card';
import type { Content, Wall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Users, Link as LinkIcon, Share2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function WallPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const wallRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'walls', id);
  }, [firestore, user, id]);

  const { data: wall, isLoading: wallLoading, error: wallError } = useDoc<Wall>(wallRef);

  const contentRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return collection(firestore, 'users', user.uid, 'walls', id, 'content');
  }, [firestore, user, id]);

  const { data: posts, isLoading: postsLoading } = useCollection<Content>(contentRef);

  const addPost = async ({ type, data }: { type: 'text' | 'image' | 'link'; data: string }) => {
    if (!user || !contentRef) return;
    
    addDoc(contentRef, {
        wallId: id,
        authorId: user.uid,
        type,
        data,
        position: { x: Math.random() * 600 + 50, y: Math.random() * 400 + 50 },
        createdAt: serverTimestamp(),
    }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: contentRef.path,
        operation: 'create',
        requestResourceData: { wallId: id, authorId: user.uid, type, data }
      }));
    });
  };

  const updatePost = (postId: string, data: Partial<Omit<Content, 'id'>>) => {
    if (!contentRef) return;
    const postRef = doc(contentRef, postId);
    updateDoc(postRef, data).catch(error => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: postRef.path,
        operation: 'update',
        requestResourceData: data
      }));
    });
  };

  const deletePost = (postId: string) => {
    if (!contentRef) return;
    const postRef = doc(contentRef, postId);
    deleteDoc(postRef).then(() => {
      toast({
          title: "Beitrag gelöscht",
          description: "Ihr Beitrag wurde entfernt.",
      });
    }).catch(error => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: postRef.path,
        operation: 'delete',
      }));
    });
  };
  
  const handleConfirmDelete = () => {
    if (postToDelete) {
        deletePost(postToDelete);
        setPostToDelete(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link kopiert",
      description: "Der Link zur Wand wurde in Ihre Zwischenablage kopiert.",
    });
  };

  if (userLoading || wallLoading || !user || !id) {
    return <FullPageLoader />;
  }
  
  // This error state is crucial for debugging permission issues
  if (wallError) {
      return (
        <div className="flex h-screen flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center text-center p-4">
                <div>
                    <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                    <h1 className="mt-4 text-3xl font-bold">Zugriff verweigert</h1>
                    <p className="text-muted-foreground mt-2">Sie haben keine Berechtigung, auf diese Wand zuzugreifen.</p>
                    <p className="text-sm text-muted-foreground mt-4">Stellen Sie sicher, dass Sie mit dem richtigen Konto angemeldet sind und Mitglied dieser Wand sind.</p>
                    <Button asChild className="mt-6">
                        <Link href="/">
                            <ArrowLeft className="mr-2" />
                            Zurück zum Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      );
  }
  
  // This handles the case where the document doesn't exist.
  if (!wall && !wallLoading) {
    return (
        <div className="flex h-screen flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center text-center p-4">
                <div>
                    <h1 className="text-3xl font-bold">Wand nicht gefunden</h1>
                    <p className="text-muted-foreground mt-2">Diese Wand existiert nicht oder wurde gelöscht.</p>
                    <Button asChild className="mt-6">
                        <Link href="/">
                            <ArrowLeft className="mr-2" />
                            Zurück zum Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  // Final loading check before render
  if (!wall) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-card">
          <div className="container p-4 flex justify-between items-center gap-4">
             <div className="flex-1 min-w-0">
                <Link href="/" className='text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-1'>
                    <ArrowLeft size={14} />
                    Meine Wände
                </Link>
                <h1 className="text-2xl font-bold truncate">{wall.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>Nur für Sie</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={copyLink}>
                        <LinkIcon size={14} />
                        Link kopieren
                    </Button>
                </div>
             </div>
             <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" className="gap-2">
                    <Share2 size={16} />
                    Teilen
                </Button>
                <AddPostForm onAddPost={addPost} />
             </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-auto bg-background">
            <div className="absolute top-0 left-0 w-[200vw] h-[200vh] p-4">
              {postsLoading && <p className="text-center text-muted-foreground">Beiträge werden geladen...</p>}
              {posts && posts.map((post) => (
                <ContentCard 
                  key={post.id} 
                  post={post}
                  onUpdatePost={updatePost}
                  onDeleteRequest={() => setPostToDelete(post.id)}
                />
              ))}
            </div>
        </div>
        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird dieser Beitrag dauerhaft von der Wand entfernt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
