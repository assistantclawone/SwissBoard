'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FullPageLoader } from '@/components/loader';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { WallCard } from '@/components/dashboard/wall-card';
import { collection, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Wall } from '@/lib/types';

const wallFormSchema = z.object({
  title: z.string().min(3, 'Der Titel muss mindestens 3 Zeichen lang sein.'),
});

type WallWithId = Wall & { id: string };

function CreateWallDialog({ open, onOpenChange, onWallCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onWallCreated: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof wallFormSchema>>({
    resolver: zodResolver(wallFormSchema),
    defaultValues: { title: '' },
  });

  async function onSubmit(values: z.infer<typeof wallFormSchema>) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Fehler", description: "Sie müssen angemeldet sein, um eine Wand zu erstellen." });
      return;
    }

    setIsSubmitting(true);
    
    try {
        const wallsCollection = collection(firestore, 'users', user.uid, 'walls');
        const newWallRef = doc(wallsCollection);
        
        await setDoc(newWallRef, {
            ownerId: user.uid,
            title: values.title,
            createdAt: serverTimestamp(),
            privacySetting: 'private',
            members: { [user.uid]: 'editor' }
        });

        toast({ title: "Wand erstellt", description: "Ihre neue Wand ist bereit." });
        onWallCreated();
        form.reset();
    } catch (error) {
        console.error("Error creating wall:", error);
        toast({ variant: "destructive", title: "Fehler beim Erstellen der Wand", description: "Ihre Wand konnte nicht erstellt werden." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Wand erstellen</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel der Wand</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Projekt Brainstorming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Abbrechen</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditWallDialog({ wall, open, onOpenChange, onWallUpdated }: { wall: WallWithId | null, open: boolean, onOpenChange: (open: boolean) => void, onWallUpdated: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof wallFormSchema>>({
    resolver: zodResolver(wallFormSchema),
  });

  useEffect(() => {
    if (wall) {
      form.reset({ title: wall.title });
    }
  }, [wall, form]);


  async function onSubmit(values: z.infer<typeof wallFormSchema>) {
    if (!user || !firestore || !wall) {
      toast({ variant: "destructive", title: "Fehler", description: "Wandinformationen fehlen." });
      return;
    }

    setIsSubmitting(true);
    
    try {
        const wallRef = doc(firestore, 'users', user.uid, 'walls', wall.id);
        await updateDoc(wallRef, {
            title: values.title
        });

        toast({ title: "Wand aktualisiert", description: "Der Titel der Wand wurde geändert." });
        onWallUpdated();
        form.reset();
    } catch (error) {
        console.error("Error updating wall:", error);
        toast({ variant: "destructive", title: "Fehler beim Aktualisieren", description: "Der Titel konnte nicht geändert werden." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wand-Namen bearbeiten</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel der Wand</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Projekt Brainstorming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Abbrechen</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingWall, setEditingWall] = useState<WallWithId | null>(null);
  const [deletingWallId, setDeletingWallId] = useState<string | null>(null);


  const wallsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'walls');
  }, [user, firestore]);

  const { data: walls, isLoading: wallsLoading } = useCollection<Wall>(wallsQuery);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleDeleteWall = async () => {
    if (!deletingWallId || !user || !firestore) {
      toast({ variant: "destructive", title: "Fehler", description: "Wandinformationen zum Löschen fehlen." });
      return;
    }
    try {
      const wallRef = doc(firestore, 'users', user.uid, 'walls', deletingWallId);
      await deleteDoc(wallRef);
      toast({ title: "Wand gelöscht", description: "Die Wand wurde erfolgreich entfernt." });
    } catch (error) {
      console.error("Error deleting wall:", error);
      toast({ variant: "destructive", title: "Fehler beim Löschen", description: "Die Wand konnte nicht gelöscht werden." });
    } finally {
      setDeletingWallId(null);
    }
  };

  if (userLoading || !user) {
    return <FullPageLoader />;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Meine Wände</h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neue Wand erstellen
            </Button>
          </div>
          {wallsLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-40 w-full bg-muted rounded-lg animate-pulse" />)}
            </div>
          )}
          {!wallsLoading && walls && walls.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold text-muted-foreground">Sie haben noch keine Wände</h2>
                <p className="text-muted-foreground mt-2">Klicken Sie auf "Neue Wand erstellen", um zu beginnen.</p>
            </div>
          )}
          {!wallsLoading && walls && walls.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {walls.map((wall) => (
                <WallCard 
                  key={wall.id} 
                  wall={wall} 
                  ownerId={user.uid} 
                  onEdit={() => setEditingWall(wall)}
                  onDelete={() => setDeletingWallId(wall.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <CreateWallDialog 
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onWallCreated={() => setCreateDialogOpen(false)}
      />
      <EditWallDialog
        wall={editingWall}
        open={!!editingWall}
        onOpenChange={(open) => !open && setEditingWall(null)}
        onWallUpdated={() => setEditingWall(null)}
      />
      <AlertDialog open={!!deletingWallId} onOpenChange={(open) => !open && setDeletingWallId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird die Wand und alle ihre Inhalte dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWall} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
