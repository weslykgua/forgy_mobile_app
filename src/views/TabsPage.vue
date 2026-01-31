<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="home"
          href="/tabs/home"
        >
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="exercises"
          href="/tabs/exercises"
        >
          <ion-icon :icon="barbellOutline" />
          <ion-label>Ejercicios</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="train"
          href="/tabs/train"
        >
          <ion-icon :icon="barbell" />
          <ion-label>Entrenar</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="progress"
          href="/tabs/progress"
        >
          <ion-icon :icon="statsChartOutline" />
          <ion-label>Progreso</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="profile"
          href="/tabs/profile"
        >
          <ion-icon :icon="personOutline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue';
import { homeOutline, barbellOutline, statsChartOutline, personOutline, barbell } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  --background: var(--forgy-card-bg);
  border-top: 1px solid var(--forgy-border);
}

ion-tab-button {
  --color: var(--ion-color-medium);
  --color-selected: var(--ion-color-primary);
}
</style>