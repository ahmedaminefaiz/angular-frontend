import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type CloudinaryResourceType = 'image' | 'video';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName = 'daacpbysm';
  private readonly uploadPreset = 'urabnAlert';

  upload(file: File, type: CloudinaryResourceType, folder: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    return from(
      fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${type}/upload`,
        { method: 'POST', body: formData }
      ).then(async res => {
        if (!res.ok) throw new Error(`Échec de l'upload: ${res.statusText}`);
        return res.json() as Promise<{ secure_url: string }>;
      })
    ).pipe(map(res => res.secure_url));
  }
}