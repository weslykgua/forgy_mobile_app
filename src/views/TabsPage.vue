<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar
        slot="bottom"
        class="custom-tab-bar"
      >
        <ion-tab-button
          tab="home"
          href="/tabs/home"
        >
          <ion-icon
            aria-hidden="true"
            :icon="homeOutline"
          />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab1"
          href="/tabs/tab1"
        >
          <ion-icon
            aria-hidden="true"
            :icon="barbellOutline"
          />
          <ion-label>Ejercicios</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab2"
          href="/tabs/tab2"
        >
          <ion-icon
            aria-hidden="true"
            :icon="calendarOutline"
          />
          <ion-label>Entreno</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab3"
          href="/tabs/tab3"
        >
          <ion-icon
            aria-hidden="true"
            :icon="statsChartOutline"
          />
          <ion-label>Progreso</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab4"
          href="/tabs/tab4"
        >
          <ion-icon
            aria-hidden="true"
            :icon="personOutline"
          />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, barbellOutline, calendarOutline, statsChartOutline, personOutline } from 'ionicons/icons';
</script>

<style scoped>
.custom-tab-bar {
  --background: white;
  --border: none;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.08);
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

ion-tab-button {
  --color: var(--ion-color-medium);
  --color-selected: var(--ion-color-primary);
  transition: all 0.3s ease;
}

ion-tab-button.tab-selected ion-icon {
  transform: scale(1.1);
}

ion-tab-button ion-icon {
  font-size: 22px;
  transition: transform 0.2s ease;
}

ion-tab-button ion-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
