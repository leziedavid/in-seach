'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getLocationLogByUserId } from '@/api/api';
import { LocationLog } from '@/types/interface';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dynamic import for the map to avoid SSR issues
const UserMap = dynamic(() => import('@/components/maps/UserMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center rounded-2xl">
      <Icon icon="solar:map-bold-duotone" width={48} className="text-muted-foreground" />
    </div>
  ),
});

function LocationContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const [locationLog, setLocationLog] = useState<LocationLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('ID utilisateur manquant');
      setLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const res = await getLocationLogByUserId(userId);
        if (res.statusCode === 200 && res.data) {
          setLocationLog(res.data);
        } else {
          setError('Position non trouvée pour cet utilisateur');
        }
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Erreur lors de la récupération de la position');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="solar:restart-bold-duotone" width={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !locationLog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <Icon icon="solar:map-point-remove-bold-duotone" width={48} />
        </div>
        <h1 className="text-2xl font-black">{error || 'Erreur'}</h1>
        <Button asChild>
          <Link href="/akwaba">Retour à l'espace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-6 px-4 space-y-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {locationLog.user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-black text-foreground">{locationLog.user?.fullName || 'Utilisateur'}</h1>
            <p className="text-xs text-muted-foreground">Dernière mise à jour : {new Date(locationLog.updatedAt).toLocaleString('fr-FR')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl">
          <Link href="/akwaba">Retour</Link>
        </Button>
      </div>

      {/* Map Container */}
      <div className="max-w-4xl mx-auto w-full flex-1 min-h-[500px] bg-card overflow-hidden mb-10 relative">
        <UserMap
          lat={locationLog.lat}
          lng={locationLog.lng}
          userName={locationLog.user?.fullName}
          nearbyPoints={[
            {
              id: 'school-1',
              lat: locationLog.lat + 0.003,
              lng: locationLog.lng - 0.002,
              name: 'École Primaire Publique',
              type: 'school',
            },
            {
              id: 'school-2',
              lat: locationLog.lat - 0.004,
              lng: locationLog.lng + 0.005,
              name: 'Lycée Moderne',
              type: 'school',
            },
            {
              id: 'police-1',
              lat: locationLog.lat + 0.006,
              lng: locationLog.lng + 0.002,
              name: 'Commissariat de Police',
              type: 'police',
            },
            {
              id: 'hospital-1',
              lat: locationLog.lat - 0.002,
              lng: locationLog.lng - 0.005,
              name: 'Centre Hospitalier Universitaire',
              type: 'hospital',
            },
          ]}
        />
      </div>
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LocationContent />
    </Suspense>
  );
}
