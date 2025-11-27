import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const concertBg = PlaceHolderImages.find(p => p.id === 'concert-background-1');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
       {concertBg && (
        <Image
          src={concertBg.imageUrl}
          alt={concertBg.description}
          data-ai-hint={concertBg.imageHint}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover -z-10 brightness-50"
        />
      )}
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="mb-8 flex items-center justify-center gap-3 text-white">
          <h1 className="text-3xl font-bold tracking-tight">VivoPass</h1>
            <Ticket className="h-10 w-10" />
          </div>
        </Link>
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">¡Bienvenido de Nuevo!</CardTitle>
            <CardDescription>Inicia sesión en tu cuenta de VivoPass</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
