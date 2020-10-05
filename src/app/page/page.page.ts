import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';

@Component({
  selector: 'app-page',
  templateUrl: './page.page.html',
  styleUrls: ['./page.page.scss'],
})
export class Page implements OnInit {
  public page: string;

  constructor(private activatedRoute: ActivatedRoute, private db: DbService) {}

  ngOnInit() {
    this.page = this.activatedRoute.snapshot.paramMap.get('id');
  }

  getDbContents() {
    this.db.getContents();
    return this.db.getMessage();
  }


}
