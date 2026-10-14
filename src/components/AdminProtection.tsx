import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface AdminProtectionProps {
  children: ReactNode;
}

export function AdminProtection({ children }: AdminProtectionProps) {
  // Initialisation directe de l'état sans useEffect
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('pix_admin_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = import.meta.env.VITE_ADMIN_PIN || '1234';

    if (pin === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('pix_admin_auth', 'true');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  // Si l'utilisateur est authentifié, on affiche le formulaire d'upload
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Sinon, on affiche l'écran de verrouillage par code PIN
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Administration - Pix'n Motion</CardTitle>
          <p className="text-sm text-muted-foreground">
            Veuillez entrer votre code PIN secret pour accéder à l'espace de gestion.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Entrez le code PIN..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={10}
                autoFocus
                className="text-center tracking-widest text-lg"
              />
              {error && (
                <p className="text-sm text-red-500 font-medium text-center">
                  Code incorrect. Veuillez réessayer.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}