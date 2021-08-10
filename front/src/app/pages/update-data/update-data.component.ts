import { Component, OnInit , Inject, ElementRef, ViewChild} from '@angular/core';
import { DOCUMENT } from '@angular/common'; 

import {RestProvider} from '../../../providers/rest/rest'

@Component({
  selector: 'app-update-data',
  templateUrl: './update-data.component.html',
  styleUrls: ['./update-data.component.css']
})
export class UpdateDataComponent implements OnInit {

  selectedFiles: File;
  progress = 0;
  message = undefined;
  document:any;
  sucessFade = true;


  constructor(
    @Inject(DOCUMENT) document,
    private rest : RestProvider
  ) { 
    this.document = document
  }

  ngOnInit(): void {
  }

  selectFile(event): void {
    this.selectedFiles = event.target.files.item(0);
    this.message = "You were selected : " + this.selectedFiles.name
    console.log(this.message)
  }

  clickUpload(){
    this.document.getElementById("selectInput").click()
  }

  upload(): void {
    this.progress = 0;

    const contentType = this.selectedFiles.type;

      const params = {
          Bucket: 'angular-s3-projet-annuel',
          Key: "uploaded_dataset.csv",
          Body: this.selectedFiles,
          ACL: 'public-read',
          ContentType: contentType
      };

      this.message = "Uploading ........"
      var ret = this.rest.bucket.upload(params).promise().then(response => {
            this.message = 'Successfully uploaded file, The model will be automatically trained !!!';
            this.selectedFiles = undefined;
      })
  }

  // fitModel(){
  //   this.rest.FitModel().subscribe(
  //     f => {
  //       if(f.sucess){
  //         console.log(f)
  //         this.message = "Successfully fit model"
  //       }else{
  //         alert(f.msg)
  //       }
  //     },
  //     error => {
  //       console.log(error);
  //     }
  //   )
  // }
}
