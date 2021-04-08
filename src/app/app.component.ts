import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Home',
      url: '/page/Home',
      icon: 'boat'
    },
    {
      title: 'Form Entries',
      url: '/page/F1EntriesList',
      icon: 'clipboard'
    },
    {
      title: 'Wildlife',
      url: '/page/Wildlife',
      icon: 'glasses'
    },
    {
      title: 'Unmarked Creels',
      url: '/page/Creels',
      icon: 'help-buoy'
    },
    {
      title: 'Your Details',
      url: '/page/Settings',
      icon: 'person-circle'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('page/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }
}
