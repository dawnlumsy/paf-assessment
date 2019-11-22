import { Component, OnInit,  ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ServiceService } from '../services/service.service'
import { CountryList } from '../model';

@Component({
  selector: 'app-songupload',
  templateUrl: './songupload.component.html',
  styleUrls: ['./songupload.component.css']
})
export class SonguploadComponent implements OnInit {

   //Inject the input:file as ElementRef
  //Reason is we need to access the DOM
  @ViewChild('songFile', { static: false }) songFile: ElementRef;


  countries: CountryList[] = [];

  //private activatedRoute: ActivatedRoute, private router: Router, 
  constructor(private svc: ServiceService) { }


  ngOnInit() {
    this.svc.getCountries()
    .then(result=>{
      console.info(result);
      this.countries = result;
    })
  }

  performUpdate(form: NgForm) {
    console.info('form contain:', form.value);
    console.info('#songFile: ', this.songFile.nativeElement.files);
    this.svc.upload(form, this.songFile)
      .then(result => {
        console.info('uploaded');
        form.resetForm();
      })
      .catch( error => { console.info('upload error: ', error ); })
  }


}
