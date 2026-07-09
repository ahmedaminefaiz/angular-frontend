import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName = 'daacpbysm';
  private readonly uploadPreset = 'urabnAlert';

  constructor(private readonly http: HttpClient) {}

  upload(file: File, type: CloudinaryResourceType, folder: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    return this.http.post<{ secure_url: string }>(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${type}/upload`,
      formData
    ).pipe(map(res => res.secure_url));
  }
}
