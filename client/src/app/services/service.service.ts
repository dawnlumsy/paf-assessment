import { Injectable, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { CountryList } from '../model';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  constructor(private http: HttpClient) { }

  getCountries(): Promise<CountryList[]> {
    console.info("getCountry Method in Svc");
    return(
      this.http.get<CountryList[]>('/api/countries/').toPromise()
    )
  }

  upload(form: NgForm, fileRef: ElementRef): Promise<any>{
    console.info("enter svc upload method");
    console.info(form.value);
    // multipart/form-data
    const formData = new FormData();
    // normal non file files
    formData.set('title', form.value['title']);
    formData.set('country', form.value['country']);
    formData.set('listen_slots', form.value['listen_slots']);
    formData.set('lyrics', form.value['lyrics']);
    // file
    formData.set('mySong',fileRef.nativeElement.files[0]);

    console.info(formData);

    return (
        this.http.post<any>('/api/upload',formData).toPromise()
    );
}

}
