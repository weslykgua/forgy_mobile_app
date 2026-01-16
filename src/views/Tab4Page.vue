<template>
    <ion-page>
        <ion-header>
            <ion-toolbar color="primary">
                <ion-title>
                    <ion-icon
                        :icon="personCircle"
                        style="margin-right: 8px;"
                    ></ion-icon>
                    Mi Perfil
                </ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="avatar-container">
                    <ion-avatar>
                        <img
                            src="https://ionicframework.com/docs/img/demos/avatar.svg"
                            alt="Avatar"
                        />
                    </ion-avatar>
                    <ion-button
                        fill="clear"
                        size="small"
                        class="edit-avatar-btn"
                    >
                        <ion-icon :icon="camera"></ion-icon>
                    </ion-button>
                </div>
                <h2 class="user-name">Usuario Forgy</h2>
                <p class="user-email">usuario@forgy.app</p>
                <ion-chip color="primary">
                    <ion-icon :icon="star"></ion-icon>
                    <ion-label>Premium</ion-label>
                </ion-chip>
            </div>

            <!-- Stats Summary -->
            <div class="stats-summary">
                <div class="stat-item">
                    <span class="stat-value">{{ savedWorkouts }}</span>
                    <span class="stat-label">Entrenos</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-value">{{ totalDays }}</span>
                    <span class="stat-label">Días activo</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-value">{{ level }}</span>
                    <span class="stat-label">Nivel</span>
                </div>
            </div>

            <!-- Menu Options -->
            <ion-list class="menu-list">
                <ion-list-header>
                    <ion-label>Configuración</ion-label>
                </ion-list-header>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="personOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Editar Perfil</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="notificationsOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Notificaciones</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="settingsOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Preferencias</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="moonOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Modo Oscuro</ion-label>
                    <ion-toggle
                        slot="end"
                        v-model="darkMode"
                        @ionChange="toggleDarkMode"
                    ></ion-toggle>
                </ion-item>
            </ion-list>

            <ion-list class="menu-list">
                <ion-list-header>
                    <ion-label>Soporte</ion-label>
                </ion-list-header>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="helpCircleOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Ayuda y FAQ</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="chatbubbleOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Contactar Soporte</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="starOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Calificar App</ion-label>
                </ion-item>
            </ion-list>

            <ion-list class="menu-list">
                <ion-item
                    button
                    detail
                    lines="none"
                    class="logout-item"
                >
                    <ion-icon
                        :icon="logOutOutline"
                        slot="start"
                        color="danger"
                    ></ion-icon>
                    <ion-label color="danger">Cerrar Sesión</ion-label>
                </ion-item>
            </ion-list>

            <!-- App Version -->
            <div class="app-version">
                <p>Forgy v1.0.0</p>
                <p>Hecho con 💪 para atletas</p>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonAvatar, IonButton, IonIcon, IonChip, IonLabel,
    IonList, IonListHeader, IonItem, IonToggle,
    onIonViewWillEnter
} from '@ionic/vue';
import { ref, computed } from 'vue';
import {
    personCircle, camera, star, personOutline,
    notificationsOutline, settingsOutline, moonOutline,
    helpCircleOutline, chatbubbleOutline, starOutline, logOutOutline
} from 'ionicons/icons';

const API_URL = 'http://localhost:3000';

const darkMode = ref(false);
const stats = ref({ totalWorkouts: 0, totalVolume: 0, streakDays: 0 });

const savedWorkouts = computed(() => stats.value.totalWorkouts);
const totalDays = computed(() => stats.value.streakDays || 0);
const level = computed(() => {
    if (stats.value.totalWorkouts >= 100) return '🏆 Elite';
    if (stats.value.totalWorkouts >= 50) return '💪 Pro';
    if (stats.value.totalWorkouts >= 20) return '⭐ Intermedio';
    return '🌱 Novato';
});

const loadStats = async () => {
    try {
        const res = await fetch(`${API_URL}/progress/stats`);
        stats.value = await res.json();
    } catch (e) {
        console.error(e);
    }
};

const toggleDarkMode = () => {
    document.body.classList.toggle('dark', darkMode.value);
};

onIonViewWillEnter(() => loadStats());
</script>

<style scoped>
.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
    background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
    color: white;
}

.avatar-container {
    position: relative;
    margin-bottom: 16px;
}

.avatar-container ion-avatar {
    width: 100px;
    height: 100px;
    border: 4px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: -8px;
    --background: white;
    --color: var(--ion-color-primary);
    width: 36px;
    height: 36px;
    border-radius: 50%;
}

.user-name {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
}

.user-email {
    margin: 0 0 12px;
    opacity: 0.8;
    font-size: 14px;
}

.profile-header ion-chip {
    --background: rgba(255, 255, 255, 0.2);
    --color: white;
}

.stats-summary {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px;
    background: white;
    margin: -20px 16px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--ion-color-primary);
}

.stat-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-top: 4px;
}

.stat-divider {
    width: 1px;
    height: 40px;
    background: var(--ion-color-light);
}

.menu-list {
    margin: 16px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.menu-list ion-list-header {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--ion-color-medium);
}

.menu-list ion-item {
    --padding-start: 16px;
}

.menu-list ion-icon {
    font-size: 22px;
}

.logout-item {
    --background: rgba(235, 68, 90, 0.05);
}

.app-version {
    text-align: center;
    padding: 24px;
    color: var(--ion-color-medium);
    font-size: 12px;
}

.app-version p {
    margin: 4px 0;
}
</style>
