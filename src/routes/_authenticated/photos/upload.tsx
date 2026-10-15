import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { AdminProtection } from '@/components/AdminProtection';

export const Route = createFileRoute('/_authenticated/photos/upload')({
  component: () => (
    <AdminProtection>
      <PhotoUploadPage />
    </AdminProtection>
  ),
});

interface UploadedImage {
  url: string;
  publicId: string;
}

const CATEGORIES = [
  'Photographie',
  'Vidéo',
  'Corporate',
  'Mariage',
  'Évènementiel',
  'Shooting photo',
  'Musique',
];

// Compression d'image dans le navigateur pour éviter les fichiers trop lourds
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
  });
};

function PhotoUploadPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError('');
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const newUploadedImages: UploadedImage[] = [];

    try {
      for (const file of Array.from(files)) {
        const compressedFile = await compressImage(file);

        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: formData }
        );
        const data = await res.json();

        if (!res.ok || !data.secure_url) {
          // eslint-disable-next-line no-console
          console.error('Cloudinary a refusé le fichier :', data);
          setUploadError(data?.error?.message ?? "Échec de l'upload");
          continue;
        }

        newUploadedImages.push({ url: data.secure_url, publicId: data.public_id });
      }

      setImages((prev) => [...prev, ...newUploadedImages]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur Cloudinary:', error);
      setUploadError('Erreur réseau pendant le téléchargement');
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 || !title || !category) return;

    try {
  // Détermine dynamiquement l'URL de l'API selon l'environnement
  const apiUrl = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/photos` 
    : '/api/photos';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      category,
      location,
      description,
      images,
    }),
  });

      const data = await response.json();
      if (response.ok) {
        alert('Événement et photos enregistrés avec succès dans Neon !');
        setTitle('');
        setLocation('');
        setDescription('');
        setImages([]);
      } else {
        alert(`Erreur : ${data.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur réseau:', error);
      alert("Impossible de contacter le serveur d'API.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des photos - Pix'n Motion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'événement</Label>
              <Input
                id="title"
                placeholder="Ex: Concert Kalash"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Type d'événement</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-background text-foreground">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Ex: Stade de Dillon, Fort-de-France"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Contexte)</Label>
              <Textarea
                id="description"
                placeholder="Détails supplémentaires..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Fichiers images (1 ou plusieurs)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">
                  Compression et téléchargement des photos en cours...
                </p>
              )}
              
              {uploadError && (
                <p className="text-sm text-red-500 font-medium">{uploadError}</p>
              )}
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group border rounded-md overflow-hidden">
                      <img src={img.url} alt={`Aperçu ${index}`} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={uploading || images.length === 0} className="W-full">
              Enregistrer l'événement ({images.length} photo{images.length > 1 ? 's' : ''})
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}