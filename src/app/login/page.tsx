
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signIn } from '@/firebase/auth';
import { useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse.'),
  password: z.string().min(1, 'Passwort ist erforderlich.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Anmeldung fehlgeschlagen',
        description: 'Authentifizierungsdienst nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
      setIsSubmitting(false);
      return;
    }

    const result = await signIn(auth, values.email, values.password);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Anmeldung fehlgeschlagen',
        description: result.error,
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: 'Anmeldung erfolgreich',
        description: 'Willkommen zurück!',
      });
      router.push('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>Geben Sie Ihre E-Mail-Adresse unten ein, um sich bei Ihrem Konto anzumelden.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="name@beispiel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anmelden
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Noch kein Konto?{' '}
            <Link href="/register" className="underline">
              Registrieren
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
