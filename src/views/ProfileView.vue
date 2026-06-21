<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonAvatar, IonButton, IonIcon, IonChip, IonLabel,
    IonList, IonListHeader, IonItem, IonToggle,
    onIonViewWillEnter,
    alertController
} from '@ionic/vue'
import { ref, computed } from 'vue'
import {
    personCircle, camera, star, personOutline,
    notificationsOutline, settingsOutline, moonOutline,
    helpCircleOutline, chatbubbleOutline, starOutline, logOutOutline,
    pulseOutline
} from 'ionicons/icons';
import { useProfile } from '../utils/useProfile'

const darkMode = ref(false);
const healthDevicesConnected = ref(false);
const stats = ref({ totalWorkouts: 0, totalVolume: 0, streakDays: 0 })

const toggleHealthDevices = (checked: boolean) => {
    healthDevicesConnected.value = checked;
    localStorage.setItem('health_devices_connected', checked ? 'true' : 'false');
};
const { userName, userEmail, loadProfileData, logout } = useProfile()

// Configuración local para acceso a la API para no modificar useProfile.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://forgybackendapi-production.up.railway.app'
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const totalDays = computed(() => stats.value.streakDays || 0);
const level = computed(() => {
    if (stats.value.totalWorkouts >= 100) return 'Élite';
    if (stats.value.totalWorkouts >= 50) return 'Pro';
    if (stats.value.totalWorkouts >= 20) return 'Intermedio';
    return 'Empezando';
})

async function getStatsFromServer() {
    try {
        // 1. Obtener la racha de entrenamiento
        const streakResponse = await fetch(`${API_URL}/user/streak`, {
            headers: getHeaders()
        });

        if (!streakResponse.ok) {
            throw new Error('No se pudo obtener la racha');
        }

        const streakData = await streakResponse.json();

        if (streakData && typeof streakData.currentStreak === 'number') {
            stats.value.streakDays = streakData.currentStreak;
        }

        // 2. Obtener métricas del dashboard para el total de entrenamientos
        const dashboardResponse = await fetch(`${API_URL}/dashboard`, {
            headers: getHeaders()
        });
        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            stats.value.totalWorkouts = dashboardData.totalWorkouts || 0;
        }
    } catch (error) {
        console.error('Error al obtener estadísticas del servidor:', error);
    }
}

const toggleDarkMode = () => {
    document.body.classList.toggle('dark', darkMode.value);
    document.body.classList.toggle('light', !darkMode.value);
};

onIonViewWillEnter(() => {
    loadProfileData()
    getStatsFromServer()
    darkMode.value = document.body.classList.contains('dark')
    healthDevicesConnected.value = localStorage.getItem('health_devices_connected') === 'true'
})

async function confirmLogout() {
    const alert = await alertController.create({
        header: 'Cerrar Sesión',
        message: '¿Estás seguro de que quieres cerrar sesión?',
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sí, cerrar sesión', role: 'destructive', handler: () => logout() },
        ],
    });
    await alert.present();
}

</script>

<template>
    <ion-page>
        <ion-header class="forgy-header">
            <ion-toolbar>
                <ion-title class="forgy-title">
                    Perfil
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
                <h2 class="user-name">{{ userName }}</h2>
                <p class="user-email">{{ userEmail }}</p>
                <ion-chip color="primary">
                    <ion-icon :icon="star"></ion-icon>
                    <ion-label>Premium</ion-label>
                </ion-chip>
            </div>

            <!-- Stats Summary -->
            <div class="stats-summary">
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
                        :checked="darkMode"
                        @ionChange="(e: CustomEvent) => { darkMode = e.detail.checked; toggleDarkMode() }"
                    ></ion-toggle>
                </ion-item>

                <ion-item>
                    <ion-icon
                        :icon="pulseOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Dispositivos de Salud</ion-label>
                    <ion-toggle
                        slot="end"
                        :checked="healthDevicesConnected"
                        @ionChange="(e: any) => toggleHealthDevices(e.detail.checked)"
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
                    lines="none"
                    class="logout-item"
                >
                    <ion-button
                        class="logout-button"
                        expand="block"
                        fill="outline"
                        color="danger"
                        @click="confirmLogout"
                    >
                        <ion-icon
                            :icon="logOutOutline"
                            slot="start"
                        ></ion-icon>
                        <span class="logout-text">Cerrar Sesión</span>
                    </ion-button>
                </ion-item>
            </ion-list>

            <!-- App Version -->
            <div class="app-version">
                <p>Forgy v1.0.0</p>
                <p>Creado para atletas</p>
            </div>
        </ion-content>
    </ion-page>
</template>

<style scoped>
.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
    background: var(--ion-background-color);
    color: var(--forgy-text-primary);
    border-bottom: 1px solid var(--ion-border-color);
}

.avatar-container {
    position: relative;
    margin-bottom: 16px;
}

.avatar-container ion-avatar {
    width: 90px;
    height: 90px;
    border: 2px solid var(--ion-border-color);
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: -8px;
    --background: var(--forgy-input-bg);
    --color: var(--ion-color-primary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    --border-width: 1px;
    --border-style: solid;
    --border-color: var(--ion-border-color);
}

.user-name {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 700;
}

.user-email {
    margin: 0 0 12px;
    color: var(--forgy-text-secondary);
    font-size: 13px;
}

.profile-header ion-chip {
    --background: var(--forgy-input-bg);
    --color: var(--ion-color-primary);
    border: 1px solid var(--ion-border-color);
}

.stats-summary {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 16px;
    background: var(--forgy-card-bg);
    margin: 20px 16px 16px;
    border-radius: 8px;
    border: 1px solid var(--ion-border-color);
    color: var(--forgy-text-primary);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--ion-color-primary);
}

.stat-label {
    font-size: 11px;
    color: var(--forgy-text-secondary);
    margin-top: 4px;
}

.stat-divider {
    width: 1px;
    height: 32px;
    background: var(--ion-border-color);
}

.menu-list {
    margin: 16px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--ion-border-color);
    background: var(--forgy-card-bg);
}

.menu-list ion-list-header {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--forgy-text-secondary);
    border-bottom: 1px solid var(--ion-border-color);
}

.menu-list ion-item {
    --padding-start: 16px;
    --border-color: var(--ion-border-color);
}

.menu-list ion-icon {
    font-size: 20px;
}

.logout-item {
    --background: transparent;
}

.logout-button {
    width: 100%;
    --border-radius: 6px;
    --border-width: 1px;
    --border-color: var(--ion-color-danger);
    --border-style: solid;
    --padding-top: 10px;
    --padding-bottom: 10px;
    margin: 0;
}

.logout-button::part(native) {
    text-transform: none;
    font-weight: 600;
}

.logout-text {
    display: inline-block;
    font-size: 13px;
}

.app-version {
    text-align: center;
    padding: 24px;
    color: var(--forgy-text-secondary);
    font-size: 11px;
}

.app-version p {
    margin: 2px 0;
}
</style>
