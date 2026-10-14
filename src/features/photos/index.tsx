import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PhotoUploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publicId, setPublicId] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    setUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setPublicId(data.public_id);
      }
    } catch (error) {
      console.error('Erreur Cloudinary:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !title) return;

    // Ici, vous appellerez votre API backend (ou endpoint Node.js) qui utilise Prisma pour sauvegarder en base
    console.log({ title, description, imageUrl, publicId });
    alert('Image prête à être enregistrée en base !');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une photo - Pix'n Motion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Titre de la photo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Contexte ou description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Fichier image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {uploading && <p className="text-sm text-muted-foreground">Téléchargement en cours sur Cloudinary...</p>}
              {imageUrl && (
                <div className="mt-4">
                  <img src={imageUrl} alt="Aperçu" className="h-40 object-cover rounded-md border" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={uploading || !imageUrl} className="w-full">
              Enregistrer la photo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}